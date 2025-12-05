import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

// query tshuaj data all or select top 15   with image lawm nawb muas
export const queryTshuajDataAll = async (req, res) => {
  try {
    // Get pagination params from query
    //const { page = "0", limit = "15" } = req.query;

    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Count total rows first
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbtshuaj t
      WHERE t.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(total / validLimit);

    const baseUrl = "http://localhost:5151/";

    // Query QR image
    const qrQuery = `
      SELECT qr 
      FROM public.tbchanneldetail 
      WHERE id = '6'
      LIMIT 1;
    `;
    const qrResult = await dbExecution(qrQuery, []);
    const qrRaw = qrResult.rows[0]?.qr || null;
    const qrImage = qrRaw ? baseUrl + qrRaw : null;

    // Now get paginated results
    const dataQuery = `
      SELECT 
       t.channel,
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        t.donation,
        t.image
      FROM public.tbtshuaj t 
      WHERE t.status = '1'
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

    // ✅ If page === 0 → also call top data function
    let topData = null;

    if (validPage === 0) {
      try {
        const topResult = await QueryTopup.getAllProductAData();

        topData = topResult?.topData || topResult;
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrImage,
      data: rows,
      pagination,
      ...(validPage === 0 && { topData }),
    });
  } catch (error) {
    console.error("Error in query_tshuaj_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrImage: null,
      data: [],
    });
  }
};

export const searchTshuajData = async (req, res) => {
  try {
    //const { name, page = "0", limit = "15" } = req.params;

    const name = req.query.name ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Count total results first
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbtshuaj t
      WHERE t.status = '1' AND t.name ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(total / validLimit);

    const baseUrl = "http://localhost:5151/";

    // Query QR image
    const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '6' LIMIT 1;
    `;
    const qrResult = await dbExecution(qrQuery, []);
    const qrRaw = qrResult.rows[0]?.qr || null;
    const qrImage = qrRaw ? baseUrl + qrRaw : null;

    // Query paginated search results
    const dataQuery = `
      SELECT 
        t.channel,
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        t.donation,
        t.image
      FROM public.tbtshuaj t 
      WHERE t.status = '1' AND t.name ILIKE $1
      ORDER BY t.cdate DESC
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
    console.error("Error in search_tshuaj_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrImage: null,
      data: [],
    });
  }
};

// query tshuaj data by id
export const queryTshuajDataOne = async (req, res) => {
  //const { id } = req.params;

  const id = req.query.id ?? 0;

  const baseUrl = "http://localhost:5151/";

  // Query QR image
  const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '6' LIMIT 1;
    `;
  const qrResult = await dbExecution(qrQuery, []);
  const qrRaw = qrResult.rows[0]?.qr || null;
  const qrImage = qrRaw ? baseUrl + qrRaw : null;

  try {
    const query = `SELECT 
        t.channel,
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        t.donation,
        t.image
      FROM public.tbtshuaj t
      WHERE t.id= $1; 
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
    console.error("Error in query_tshuaj_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrImage: null,
      data: [],
    });
  }
};
 

export const updateProductData = async (req, res) => {
  const { id, name, Price1, Price2, tel, detail, donation } = req.body;

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

    const addField = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    addField("name", name);
    addField(`price1`, Price1);
    addField(`price2`, Price2);
    addField("tel", tel);
    addField("detail", detail);
    addField("donation", donation);

    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No valid fields provided to update",
        data: null,
      });
    }

    values.push(id);

    const query = `
      UPDATE public.tbtshuaj
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
    } else {
      return res.status(404).send({
        status: false,
        message: "Product not found",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
