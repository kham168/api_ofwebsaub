import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "../class/class.controller.js";

// query by id
export const queryHouseDataOne = async (req, res) => {
  //const { id } = req.params;
  const id = req.query.id ?? 0;

  //  const baseUrl = "http://localhost:5151/";
  const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
  try {
    const query = `
      SELECT 
       h.channel,
        h.id,
        h.housename,
        h.price1,
        h.price2,
        h.price3,
        h.tel,
        h.contactnumber,
        h.locationvideo,
        h.moredetail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        h.image,
        h.cdate
      FROM public.tbhouse h
      INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(h.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE h.status = '1' AND h.id = $1
      GROUP BY 
      h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
        h.contactnumber, h.locationvideo, h.moredetail,
        p.province, d.district, h.image, h.cdate;
    `;

    const result = await dbExecution(query, [id]);
    let rows = result?.rows || [];

    if (!rows.length) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
      });
    }

    // Map images to full URLs
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopData.cleanImageArray(r.image);

        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      }),
    );

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error in query_house_dataone:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const updateProductData = async (req, res) => {
  try {
    const {
      id,
      housename,
      price1,
      price2,
      price3,
      tel,
      contactnumber,
      locationvideo,
      moredetail,
      provinceid,
      districtid,
      villageid,
    } = req.body;

    if (!id) {
      return res.status(400).send({
        status: false,
        message: "Missing product ID",
        data: null,
      });
    }

    // Arrays for dynamic update
    let updateFields = [];
    let values = [];
    let index = 1;

    // Helper function to push field
    const addField = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    // Add each field only if it is not null
    addField("housename", housename);
    addField("price1", price1);
    addField("price2", price2);
    addField("price3", price3);
    addField("tel", tel);
    addField("contactnumber", contactnumber);
    addField("locationvideo", locationvideo);
    addField("moredetail", moredetail);
    addField("provinceid", provinceid);
    addField("districtid", districtid);

    // Village list (array)
    let villageIdArray = null;
    if (Array.isArray(villageid) && villageid.length > 0) {
      villageIdArray = `{${villageid.join(",")}}`;
    }

    // Only push if there’s data
    if (villageIdArray) {
      updateFields.push(`villageid = $${index++}`);
      values.push(villageIdArray);
    }

    // No fields to update
    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No fields provided to update",
        data: null,
      });
    }

    // Add ID as final parameter
    values.push(id);

    const query = `
      UPDATE public.tbhouse
      SET ${updateFields.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await dbExecution(query, values);

    if (result?.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update successful",
        data: result.rows,
      });
    }

    return res.status(404).send({
      status: false,
      message: "Product not found",
      data: null,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
