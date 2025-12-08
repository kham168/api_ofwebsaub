import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

export const queryCreamDataAll = async (req, res) => {
  try {
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbcream c
      WHERE c.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    const baseUrl = "http://localhost:5151/";

    // ----------------------------------------
    // ✅ Query QR ONLY on first page
    // ----------------------------------------
    let channelData = null;
    let topData = null;

    if (validPage === 0) {
      const qrQuery = `
    SELECT 
      qr,
      image AS "channelimage",
      video1,
      video2,
      guidelinevideo
    FROM public.tbchanneldetail
    WHERE id = '1'
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

    // Fetch paginated cream data
    const dataQuery = `
      SELECT 
        c.channel,
        c.id,
        c.creamname,
        c.price1,
        c.price2,
        c.tel,
        c.detail,
        c.donation,
        c.image
      FROM public.tbcream c
      WHERE c.status = '1'
      ORDER BY c.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    let rows = result?.rows || [];

    // Format images
    rows = rows.map((r) => {
      let imgs = [];
      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
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

    // Pagination data
    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    // Response
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
      ...(validPage === 0 && { channelData, topData }), // ⬅️ Only include on first page
    });
  } catch (error) {
    console.error("Error in queryCreamDataAll:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const searchCreamData = async (req, res) => {
  try {
    const name = req.query.name ?? "";
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).send({
        status: false,
        message: "Invalid or missing name",
        data: [],
      });
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbcream c
      WHERE c.status = '1' AND c.creamname ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Base URL for images + QR
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
    const qrimage = qrRaw ? baseUrl + qrRaw : null;

    // Main search query
    const query = `
      SELECT 
        c.channel,
        c.id,
        c.creamname,
        c.price1,
        c.price2,
        c.tel,
        c.detail,
        c.donation,
        c.image
      FROM public.tbcream c
      WHERE c.status = '1' 
        AND c.creamname ILIKE $1
      ORDER BY c.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // Format image URLs
    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
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

    // Final response (with qrimage)
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrimage,
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in searchCreamData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const queryCreamDataOne = async (req, res) => {
  try {
    const baseUrl = "http://localhost:5151/";
    const id = req.query.id ?? "";

    // Validate ID
    const validId = id.toString().trim();
    if (!validId) {
      return res.status(400).send({
        status: false,
        message: "Invalid or missing ID",
        data: [],
      });
    }

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

    // Main query
    const query = `
      SELECT 
        c.channel,
        c.id,
        c.creamname,
        c.price1,
        c.price2,
        c.tel,
        c.detail,
        c.donation,
        c.image
      FROM public.tbcream c 
      WHERE c.id = $1 AND c.status = '1';
    `;

    const result = await dbExecution(query, [validId]);
    let rows = result?.rows || [];

    // If no data
    if (rows.length === 0) {
      return res.status(404).send({
        status: false,
        message: "No data found",
        qrimage: qrImage,
        data: [],
      });
    }

    // Parse images
    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
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

    // Final response (QR at top level)
    return res.status(200).send({
      status: true,
      message: "Query successful",
      qrimage: qrImage,
      data: rows,
    });
  } catch (error) {
    console.error("Error in queryCreamDataOne:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrimage: null,
      data: [],
    });
  }
};

export const updateProductData = async (req, res) => {
  const { id, bland, creamName, Price1, Price2, tel, detail, donation } =
    req.body;

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

    const pushUpdate = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    // Add fields only if NOT empty string
    pushUpdate("bland", bland);
    pushUpdate("creamname", creamName);
    pushUpdate(`price1`, Price1);
    pushUpdate(`price2`, Price2);
    pushUpdate("tel", tel);
    pushUpdate("detail", detail);
    pushUpdate("donation", donation);

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
      UPDATE public.tbcream
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
