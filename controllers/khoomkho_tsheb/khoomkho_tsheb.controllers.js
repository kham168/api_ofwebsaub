import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

export const queryKhoomKhoTshebDataAll = async (req, res) => {
  try {
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // sanitize numbers
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbkhoomkhotsheb
      WHERE status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);
    const totalPages = Math.ceil(total / validLimit);

    // Query QR image
    let channelData = null;
    let topData = null;

    if (validPage === 0) {
      const qrQuery = `
    SELECT qr,
      image AS "channelimage",
      video1,
      video2,
      guidelinevideo
    FROM public.tbchanneldetail
    WHERE id = '4'
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
    // Query paginated data
    const query = `
      SELECT 
      channel, id,
        type,
        name,
        price1,
        price2,
        tel,
        detail,
        locationgps,
        image,
        donation
      FROM public.tbkhoomkhotsheb
      WHERE status = '1'
      ORDER BY cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    let rows = (await dbExecution(query, [validLimit, offset]))?.rows || [];

    // Convert image array
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopup.cleanImageArray(r.image);
        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      })
    );

    // Pagination object
    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages,
    };

    // FINAL RESPONSE
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
      ...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
    });
  } catch (error) {
    console.error("Error in queryKhoomKhoTshebDataAll:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: null,
      channelData: null,
      topData: null,
    });
  }
};

export const searchKhoomKhoTshebData = async (req, res) => {
  try {
    // const { name = "", page = 0, limit = 25 } = req.params;

    const name = req.query.name ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // ✅ Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).send({
        status: false,
        aaa: name,
        message: "Invalid or missing name",
        data: [],
      });
    }

    const baseUrl = "http://localhost:5151/";

    // ✅ Count total matches (for pagination)
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbkhoomkhotsheb
      WHERE status = '1' AND name ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);
    const totalPages = Math.ceil(total / validLimit);

    // Query QR image
    const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '4' LIMIT 1;
    `;
    const qrResult = await dbExecution(qrQuery, []);
    const qrRaw = qrResult.rows[0]?.qr || null;
    const qr = qrRaw ? baseUrl + qrRaw : null;

    // ✅ Fetch paginated matching data
    const query = `
      SELECT 
       channel, id,type,
        name,
        price1,
        price2,
        tel,
        detail,
        locationgps,
        image,
        donation
      FROM public.tbkhoomkhotsheb
      WHERE status = '1' AND name ILIKE $1
      ORDER BY cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    let rows =
      (await dbExecution(query, [`%${name}%`, validLimit, offset]))?.rows || [];

    // ✅ Safely parse images from Postgres array
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopup.cleanImageArray(r.image);
        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      })
    );

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
      data: rows,
      pagination,
      qr,
    });
  } catch (error) {
    console.error("Error in searchKhoomKhoTshebData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: [],
      qr: null,
    });
  }
};

// query khoomkho_tsheb data by id
export const queryKhoomKhoTshebDataOne = async (req, res) => {
  //const id = req.params.id;

  const idParam = req.query.id ?? "";
  const id = String(idParam).trim();

  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Invalid id",
      data: [],
    });
  }
  const baseUrl = "http://localhost:5151/";

  // Query QR image
  const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '4' LIMIT 1;
    `;
  const qrResult = await dbExecution(qrQuery, []);
  const qrRaw = qrResult.rows[0]?.qr || null;
  const qr = qrRaw ? baseUrl + qrRaw : null;

  try {
    const query = `SELECT
        channel,
        k.id,
        type,
        k.name,
        k.price1,
        k.price2,
        k.tel,
        k.detail,
        k.locationgps,
        k.image,
        k.donation
      FROM public.tbkhoomkhotsheb k
      WHERE k.id = $1;
    `;

    let rows = (await dbExecution(query, [id]))?.rows || [];

    // ✅ Safely parse images from Postgres array
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopup.cleanImageArray(r.image);
        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      })
    );

    // ✅ Send final response

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      qr,
    });
  } catch (error) {
    console.error("Error in query khoomkho tsheb dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
      qr: null,
    });
  }
};

export const updateProductData = async (req, res) => {
  try {
    const {
      id,
      type,
      name,
      Price1,
      Price2,
      tel,
      detail,
      locationGps,
      donation,
    } = req.body;

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

    // Only update fields that are not undefined, null, or empty string
    const addField = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    addField("type", type);
    addField("name", name);
    addField(`price1`, Price1);
    addField(`price2`, Price2);
    addField("tel", tel);
    addField("detail", detail);
    addField("locationgps", locationGps);
    addField("donation", donation);

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
      UPDATE public.tbkhoomkhotsheb
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
