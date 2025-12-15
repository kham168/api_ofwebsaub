import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

export const queryHouseDataAll = async (req, res) => {
  try {
    // const { page, limit = 20 } = req.params; // ✅ use query params

    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // ✅ Count total records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbhouse
      WHERE status = '1';
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
    WHERE id = '3'
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

    // ✅ Main query
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
      WHERE h.status = '1'
      GROUP BY 
      h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
        h.contactnumber, h.locationvideo, h.moredetail,
        p.province, d.district, h.image, h.cdate
      ORDER BY h.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(query, [validLimit, offset]);
    let rows = result?.rows || [];

    // ✅ Image parsing & full URLs
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

    // ✅ If page === 0 → also call top data function

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
      ...(validPage === 0 && { ...channelData, topData }),
    });
  } catch (error) {
    console.error("Error in query_house_dataall:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// search by name
export const searchHouseData = async (req, res) => {
  try {
    // const { name = "", page = 0, limit = 20 } = req.body; // or req.query if GET
    const name = req.query.name ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // ✅ Count total matching records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbhouse
      WHERE status = '1' AND housename ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // ✅ Main query
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
      WHERE h.status = '1' AND h.housename ILIKE $1
      GROUP BY 
       h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
        h.contactnumber, h.locationvideo, h.moredetail,
        p.province, d.district, h.image, h.cdate
      ORDER BY h.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // ✅ Safe image handling
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
    console.error("Error in search_house_data:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// query by provice id and district id
export const queryHouseDataByDistrictId = async (req, res) => {
  //const { districtId, page = 0, limit = 20 } = req.params;

  const districtId = req.query.districtId ?? 0;
  const page = req.query.page ?? 0;
  const limit = req.query.limit ?? 15;

  // ✅ sanitize & convert
  const validPage = Math.max(parseInt(page, 10) || 0, 0);
  const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT h.id) AS total
      FROM public.tbhouse h
      WHERE h.status = '1'  
        AND h.districtid = $1
    `;
    const countResult = await dbExecution(countQuery, [districtId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages: 0,
        },
      });
    }

    // Main query with pagination
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
      WHERE h.status = '1' AND h.districtid = $1
      GROUP BY 
       h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
        h.contactnumber, h.locationvideo, h.moredetail,
        p.province, d.district, h.image, h.cdate
      ORDER BY h.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [districtId, validLimit, offset]);
    let rows = result?.rows || [];

    // Map images to full URLs
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
      "Error in query_house_data_byprovinceid_and_districtid:",
      error
    );
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total: 0,
        totalPages: 0,
      },
    });
  }
};

export const queryHouseDataByVillageId = async (req, res) => {
  //const { villageId, page = 0, limit = 20 } = req.params;

  const villageId = req.query.villageId ?? 0;
  const page = req.query.page ?? 0;
  const limit = req.query.limit ?? 15;

  // ✅ sanitize & convert
  const validPage = Math.max(parseInt(page, 10) || 0, 0);
  const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT h.id) AS total
      FROM public.tbhouse h 
      WHERE h.status = '1'  
        AND $1 = ANY(string_to_array(replace(replace(h.villageid, '{', ''), '}', ''), ',')::int[]);
    `;
    const countResult = await dbExecution(countQuery, [villageId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages: 0,
        },
      });
    }

    // Main query with pagination
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
      WHERE h.status = '1' 
        AND $1 = ANY(string_to_array(replace(replace(h.villageid, '{', ''), '}', ''), ',')::int[])
      GROUP BY 
       h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
        h.contactnumber, h.locationvideo, h.moredetail,
        p.province, d.district, h.image, h.cdate
      ORDER BY h.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [villageId, validLimit, offset]);
    let rows = result?.rows || [];

    // Map images to full URLs
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
    console.error("Error in query_house_data_districtid_and_villageid:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total: 0,
        totalPages: 0,
      },
    });
  }
};

// query by id
export const queryHouseDataOne = async (req, res) => {
  //const { id } = req.params;
  const id = req.query.id ?? 0;

  const baseUrl = "http://localhost:5151/";

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
