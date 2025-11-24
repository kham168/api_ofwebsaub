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

    // ✅ Query QR image
    const qrQuery = `
      SELECT qr 
      FROM public.tbchanneldetail 
      WHERE id = '1' 
      LIMIT 1;
    `;
    const qrResult = await dbExecution(qrQuery, []);
    const qrRaw = qrResult.rows[0]?.qr || null;

    // Base URL
    const baseUrl = "http://localhost:5151/";

    // Convert QR to full URL
    const qrimage = qrRaw ? baseUrl + qrRaw : null;

    // Fetch paginated cream data
    const dataQuery = `
      SELECT 
        c.id,
        c.creamname,
        c."Price1",
        c."Price2",
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

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    let topData = null;
    if (validPage === 0) {
      try {
        const topResult = await QueryTopup.getAllProductAData();
        topData = topResult?.data || topResult;
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    // Final Output
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrimage, // ⬅️ HERE!
      data: rows,
      pagination,
      ...(validPage === 0 && { topData }),
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
        c.id,
        c.creamname,
        c."Price1",
        c."Price2",
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
        c.id,
        c.creamname,
        c."Price1",
        c."Price2",
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

// insert cream data
export const insertCreamData = async (req, res) => {
  const { id, creamName, price1, price2, tel, detail, donation } = req.body;

  if (!id || !creamName || !price1 || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    // 🖼️ Collect uploaded image filenames into an array
    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename)
        : [];

    // 🧠 Insert into tbcream
    const query = `
      INSERT INTO public.tbcream (
        id, creamname, "Price1", "Price2",
        tel, detail, image, donation, status, cdate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9, NOW())
      RETURNING *;
    `;

    const values = [
      id,
      creamName,
      price1,
      price2,
      tel,
      detail,
      imageArray, // 👈 image array here
      donation || "",
      "1", // status = active
    ];

    const result = await dbExecution(query, values);

    if (result && result.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert data successful",
        data: result.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "Insert data failed",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in insertCreamData:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
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
    pushUpdate(`"Price1"`, Price1);
    pushUpdate(`"Price2"`, Price2);
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
