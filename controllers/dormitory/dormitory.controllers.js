import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "../class/class.controller.js";

// tsi tau rub mu siv
export const queryDormitoryDataOne = async (req, res) => {
  try {
    // const { id } = req.params;
    const id = req.query.id ?? 0;
    // 🧩 Validate input
    if (!id) {
      return res.status(400).send({
        status: false,
        message: "Missing dormitory ID",
        data: [],
      });
    }

    //   const baseUrl = "http://localhost:5151/";
    const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
    // 📦 Main query (no LIMIT/OFFSET)
    const query = `
      SELECT 
        d.channel,
        d.id,
        d.dormantalname,
        d.price1,
        d.price2,
        d.price3,
        d.type,
        d.totalroom,
        d.activeroom,
        d.locationvideo,
        d.tel,
        d.contactnumber,
        d.moredetail,
        p.province,
        dis.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        d.image,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.id = $1
      GROUP BY 
       d.channel, d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC;
    `;

    // 🧮 Execute query
    const result = await dbExecution(query, [id]);
    let rows = result?.rows || [];

    // 🖼️ Process images
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopData.cleanImageArray(r.image);

        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      }),
    );

    // ✅ Send success response
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error in queryDormitoryDataOne:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const UpdateActiveStatusDormitoryData = async (req, res) => {
  // done

  const { id, status } = req.body;

  try {
    const query = `update public.tbdormantalroom set status=$1 where id=$2 RETURNING *`;
    let values = [status, id];
    const resultSingle = await dbExecution(query, values);
    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "updadte data successfull",
        data: resultSingle?.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "updadte data fail",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};

// kho lawm // hai dormantal ce tsi ua lo yog tsi muaj viewnumber lawm

export const UpdateViewNumberOfThisId = async (req, res) => {
  // done

  const id = req.body.id;

  try {
    const query_v = `SELECT viewnumber FROM public.tbdormantalroom where id=$1`;

    const result = await dbExecution(query_v, [id]);
    let viewnumber = result.rows[0].viewnumber;
    viewnumber += 1;

    const query = `update public.tbdormantalroom set viewnumber= $1 where id= $2 RETURNING *`;
    let values = [viewnumber, id];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "updadte data successfull",
        data: resultSingle?.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "updadte data fail",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const updateProductData = async (req, res) => {
  const {
    id,
    dormantalname,
    price1,
    price2,
    price3,
    type,
    totalroom,
    activeroom,
    locationvideo,
    tel,
    contactnumber,
    moredetail,
    provinceid,
    districtid,
    villageid,
    plan_on_next_month,
  } = req.body;

  //const villageIdArray = Array.isArray(villageid) ? villageid : [];

  try {
    if (!id) {
      return res.status(400).send({
        status: false,
        message: "Missing product ID",
        data: null,
      });
    }

    let updateFields = [];
    let values = [];
    let index = 1;

    // Helper to avoid repeating checks
    const pushUpdate = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    // Use helper for all fields
    pushUpdate("dormantalname", dormantalname);
    pushUpdate("price1", price1);
    pushUpdate("price2", price2);
    pushUpdate("price3", price3);
    pushUpdate("type", type);
    pushUpdate("totalroom", totalroom);
    pushUpdate("activeroom", activeroom);
    pushUpdate("locationvideo", locationvideo);
    pushUpdate("tel", tel);
    pushUpdate("contactnumber", contactnumber);
    pushUpdate("moredetail", moredetail);
    pushUpdate("provinceid", provinceid);
    pushUpdate("districtid", districtid);
    pushUpdate("plan_on_next_month", plan_on_next_month);

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

    // If nothing to update
    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No fields provided to update",
        data: null,
      });
    }

    values.push(id);

    const query = `
      UPDATE public.tbdormitory
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
