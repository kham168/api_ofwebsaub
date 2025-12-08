import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

// query muas data all or select top 15
export const queryMuasDataAll = async (req, res) => {
  try {
    // Read pagination params from the query string
    // const { page = '0', limit = '15' } = req.query;

    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Count total rows first
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbmuas m
      WHERE m.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(total / validLimit);

    const baseUrl = "http://localhost:5151/";

    // Query QR image
    // Query QR image
    let channelData = null;
    let topData = null;

    if (validPage === 0) {
      const qrQuery = `
    SELECT  qr,
      image AS "channelimage",
      video1,
      video2,
      guidelinevideo
    FROM public.tbchanneldetail
    WHERE id = '8'
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
        const topResult = await QueryTopup.getAllProductAData();
        topData = topResult?.topData || topResult;
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    // Get paginated data
    const dataQuery = `
      SELECT 
       m.channel, m.id,
        m.name,
        m.price,
        m.tel,
        m.detail,
        m.status,
        m.donation,
        m.cdate,
        m.image
      FROM public.tbmuas m 
      WHERE m.status = '1'
      LIMIT $1 OFFSET $2;
    `;

    let rows = (await dbExecution(dataQuery, [validLimit, offset]))?.rows || [];

    // ✅ Safely parse images
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

    // ✅ Send response
    // Unified API response
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
      ...(validPage === 0 && {channelData, topData }),
    });
  } catch (error) {
    console.error("Error in query_muas dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
      channelData: null,
      topData: null,
    });
  }
};

export const searchMuasData = async (req, res) => {
  try {
    // const { name, page = "0", limit = "15" } = req.params;

    // Validate pagination
    const name = req.query.name ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Validate name
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).send({
        status: false,
        message: "Invalid or missing name",
        data: [],
      });
    }

    // Count total matches
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbmuas m
      WHERE m.status = '1' AND m.name ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(total / validLimit);

    const baseUrl = "http://localhost:5151/";

    // Query QR image
    const qrQuery = `
      SELECT qr 
      FROM public.tbchanneldetail 
      WHERE id = '1'
      LIMIT 1;
    `;
    const qrResult = await dbExecution(qrQuery, []);
    const qrRaw = qrResult.rows[0]?.qr || null;
    const qrImage = qrRaw ? baseUrl + qrRaw : null;

    // Fetch paginated search results
    const dataQuery = `
      SELECT 
        m.channel,
        m.id,
        m.name,
        m.price,
        m.tel,
        m.detail,
        m.status,
        m.donation,
        image
      FROM public.tbmuas m
      WHERE m.status = '1' AND m.name ILIKE $1
      LIMIT $2 OFFSET $3;
    `;

    let rows =
      (await dbExecution(dataQuery, [`%${name}%`, validLimit, offset]))?.rows ||
      [];

    // ✅ Safely parse images from Postgres array
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

    // ✅ Send final response
    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrImage,
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in search_muas_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrImage: null,
      data: [],
    });
  }
};

// query muas data by id
export const queryMuasDataOne = async (req, res) => {
  //const id = req.params.id;
  const id = req.query.id ?? 0;

  if (!id || typeof id !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid id",
      data: [],
    });
  }

  const baseUrl = "http://localhost:5151/";

  // Query QR image
  const qrQuery = `
      SELECT qr 
      FROM public.tbchanneldetail 
      WHERE id = '1'
      LIMIT 1;
    `;
  const qrResult = await dbExecution(qrQuery, []);
  const qrRaw = qrResult.rows[0]?.qr || null;
  const qrImage = qrRaw ? baseUrl + qrRaw : null;

  try {
    const query = `SELECT 
       m.channel,
        m.id,
        m.name,
        m.price,
        m.tel,
        m.detail,
        m.status,
        m.donation,
        m.image
      FROM public.tbmuas m 
      WHERE m.id = $1
    `;
    let rows = (await dbExecution(query, [id]))?.rows || [];

    // ✅ Safely parse images from Postgres array
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

    // ✅ Send final response

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrImage,
      data: rows,
    });
  } catch (error) {
    console.error("Error in query_muas_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrImage: null,
      data: [],
    });
  }
};
  
export const updateProductData = async (req, res) => {
  try {
    const { id, name, price, tel, detail, donation } = req.body;

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

    const addField = (column, value) => {
      // Only update if value is not undefined, null, or empty string
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    addField("name", name);
    addField("price", price);
    addField("tel", tel);
    addField("detail", detail);
    addField("donation", donation);

    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No fields provided to update",
        data: null,
      });
    }

    values.push(id);

    const query = `
      UPDATE public.tbmuas
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

