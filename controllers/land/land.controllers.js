import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "../class/class.controller.js";

export const queryLandDataOne = async (req, res) => {
  //const { id } = req.params;

  const id = req.query.id ?? 0;

  // const baseUrl = "http://localhost:5151/";
  const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
  try {
    const query = `
      SELECT 
       l.channel, l.id,
        l.productname,
        l.type,l.squaremeters, 
        l.area,
        l.price,
        l.tel,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.moredetail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        l.image,
        l.cdate
      FROM public.tbland l
      INNER JOIN public.tbprovince p ON p.provinceid = l.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE l.status = '1' AND l.id = $1
      GROUP BY 
       l.channel, l.id, l.productname, l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
        l.locationurl, l.locationvideo, l.moredetail, 
        p.province, d.district, l.image, l.cdate
      ORDER BY l.cdate DESC;
    `;

    let rows = (await dbExecution(query, [id]))?.rows || [];

    // ✅ Safely parse images from Postgres array
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopData.cleanImageArray(r.image);

        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      }),
    );

    // ✅ Build combined response
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error in query_land_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const updateProductData = async (req, res) => {
  try {
    const {
      id,
      ownername,
      productname,
      type,
      squaremeters,
      area,
      price,
      tel,
      contactnumber,
      locationurl,
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

    //const villageIdArray = parseVillageList(villageid);
    // Village list (array)
    let villageIdArray = null;
    if (Array.isArray(villageid) && villageid.length > 0) {
      villageIdArray = `{${villageid.join(",")}}`;
    }

    // Build dynamic update
    let updateFields = [];
    let values = [];
    let index = 1;

    // Helper to add fields
    const addField = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    // Add fields automatically
    addField("ownername", ownername);
    addField("productname", productname);
    addField("type", type);
    addField("squaremeters", squaremeters);
    addField("area", area);
    addField("price", price);
    addField("tel", tel);
    addField("contactnumber", contactnumber);
    addField("locationurl", locationurl);
    addField("locationvideo", locationvideo);
    addField("moredetail", moredetail);
    addField("provinceid", provinceid);
    addField("districtid", districtid);
    addField("villageid", villageIdArray);

    // No data provided
    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No fields provided to update",
        data: null,
      });
    }

    // ID last
    values.push(id);

    const query = `
      UPDATE public.tbland
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
