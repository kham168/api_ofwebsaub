import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";
// kho lawm  qhob no with image lawm nawb muas

export const queryDormitoryDataAll = async (req, res) => {
  try {
    // const { page = 0, limit = 25 } = req.query;

    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // 🧮 Count total records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormitory d
      WHERE d.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    let channelData = null;
    let topData = null;
    // ----------------------------------------
    // ✅ Query QR + channel images ONLY on first page
    // ----------------------------------------

    if (validPage === 0) {
      const qrQuery = `
    SELECT qr,
      image AS "channelimage",
      video1,
      video2,
      guidelinevideo
    FROM public.tbchanneldetail
    WHERE id = '2'
    LIMIT 1;
  `;

      const qrResult = await dbExecution(qrQuery, []);
      const raw = qrResult.rows[0] || null;

      if (raw) {
        // Helper: convert "a.png,b.png" → ["url/a.png", "url/b.png"]
        const convertToUrlArray = (str) => {
          if (!str) return [];
          return str
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((x) => baseUrl + x);
        };

        channelData = {
          qr: raw.qr ? baseUrl + raw.qr : null,
          channelimage: convertToUrlArray(raw.channelimage),
          video1: raw.video1 ? baseUrl + raw.video1 : null,
          video2: raw.video2 ? baseUrl + raw.video2 : null,
          guidelinevideo: raw.guidelinevideo
            ? baseUrl + raw.guidelinevideo
            : null,
        };
      }

      try {
        const topResult = await QueryTopup.getAllProductB();

        topData = topResult?.topData || topResult;
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    // 📦 Main query with pagination
    const dataQuery = `
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
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.status = '1'
      GROUP BY 
       d.channel, d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    let rows = result?.rows || [];

    // 🖼️ Map image URLs to full paths
    // 🖼️ Map image URLs to full paths
    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string") {
          imgs = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }

      return {
        ...r,
        image: imgs.map((img) => baseUrl + img),
      };
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
      ...(validPage === 0 && { ...channelData, topData }), // only include if page === 0
    });
  } catch (error) {
    console.error("Error in query_dormantal_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// search ny name. // kho lawm
export const searchDormitoryData = async (req, res) => {
  try {
    // const { name } = req.params;
    //const { page = 0, limit = 25 } = req.query;

    const name = req.query.name ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    if (!name || typeof name !== "string") {
      return res.status(400).send({
        status: false,
        message: "Missing or invalid dormitory name",
        data: [],
      });
    }

    const baseUrl = "http://localhost:5151/";

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormitory d
      WHERE d.status = '1' AND d.dormantalname ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

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
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.status = '1' AND d.dormantalname ILIKE $1
      GROUP BY 
       d.channel, d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string") {
          imgs = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }

      return {
        ...r,
        image: imgs.map((img) => baseUrl + img),
      };
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in searchDormitoryData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// select data by provinceid and districtid   // kho lawm query_dormantal_data_by_provinceid_and_districtid
export const queryDormitoryDataByDistrictId = async (req, res) => {
  try {
    // const { districtId, page = 0, limit = 25 } = req.params;

    const districtId = req.query.districtId ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // 🧩 Validate input
    if (!districtId) {
      return res.status(400).send({
        status: false,
        message: "Missing province or district ID",
        data: [],
      });
    }

    const baseUrl = "http://localhost:5151/";

    // 🧮 Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormitory d
      WHERE d.status = '1' AND d.districtid = $1;
    `;
    const countResult = await dbExecution(countQuery, [districtId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // 📦 Main query
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
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.status = '1' AND d.districtid = $1
      GROUP BY 
       d.channel, d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [districtId, validLimit, offset]);
    let rows = result?.rows || [];

    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string") {
          imgs = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }

      return {
        ...r,
        image: imgs.map((img) => baseUrl + img),
      };
    });

    // ✅ Send success response
    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in query_dormitory_data_by_districtid:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const queryDormitoryDataByVillageId = async (req, res) => {
  try {
    // const { villageId, page = 0, limit = 20 } = req.params;

    const villageId = req.query.villageId ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;
    // 🧩 Validate input
    if (!villageId) {
      return res.status(400).send({
        status: false,
        message: "Missing district or village ID",
        data: [],
      });
    }

    const baseUrl = "http://localhost:5151/";

    // 🧮 Count query for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormitory d
      WHERE d.status = '1' 
        AND ($1::varchar IS NULL OR $1::int = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[]));
    `;
    const countResult = await dbExecution(countQuery, [villageId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // 📦 Main query with joins
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
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.status = '1' AND $1 = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      GROUP BY 
      d.channel,  d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [villageId, validLimit, offset]);
    let rows = result?.rows || [];

    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string") {
          imgs = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }

      return {
        ...r,
        image: imgs.map((img) => baseUrl + img),
      };
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error(
      "Error in query_dormitory_data_by_district_or_villageid:",
      error
    );
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

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

    const baseUrl = "http://localhost:5151/";

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
        d.plan_on_next_month,
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
    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string") {
          imgs = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }

      return {
        ...r,
        image: imgs.map((img) => baseUrl + img),
      };
    });

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
