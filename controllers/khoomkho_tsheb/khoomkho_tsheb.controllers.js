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
    const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '4' LIMIT 1;
    `;
    const qrResult = await dbExecution(qrQuery, []);
    const qrRaw = qrResult.rows[0]?.qr || null;
    const qrimage = qrRaw ? baseUrl + qrRaw : null;

    // Query paginated data
    const query = `
      SELECT 
        id,
        type,
        name,
        "Price1",
        "Price2",
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

    // Pagination object
    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages,
    };

    // Optional topData for page 0
    let topData = null;
    if (validPage === 0) {
      try {
        const topResult = await QueryTopup.getAllProductAData();
        topData = topResult?.data || topResult;
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    // FINAL RESPONSE
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrimage,
      data: rows,
      pagination,
      ...(validPage === 0 && { topData }),
    });
  } catch (error) {
    console.error("Error in queryKhoomKhoTshebDataAll:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrimage: null,
      data: [],
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
    const qrimage = qrRaw ? baseUrl + qrRaw : null;

    // ✅ Fetch paginated matching data
    const query = `
      SELECT 
        id,type,
        name,
        "Price1",
        "Price2",
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
      qrimage,
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in searchKhoomKhoTshebData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrimage: null,
      data: [],
    });
  }
};

// query khoomkho_tsheb data by id
export const queryKhoomKhoTshebDataOne = async (req, res) => {
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
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '4' LIMIT 1;
    `;
  const qrResult = await dbExecution(qrQuery, []);
  const qrRaw = qrResult.rows[0]?.qr || null;
  const qrimage = qrRaw ? baseUrl + qrRaw : null;

  try {
    const query = `SELECT 
        k.id,type,
        k.name,
        k."Price1",
        k."Price2",
        k.tel,
        k.detail, 
        k.locationgps,
        ,k.image
        k.donation
      FROM public.tbkhoomkhotsheb k where k.id= $1
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
      qrimage,
      data: rows,
    });
  } catch (error) {
    console.error("Error in query khoomkho tsheb dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      qrimage: null,
      data: [],
    });
  }
};

export const insertKhoomKhoTshebData = async (req, res) => {
  const { id, type, name, price1, price2, tel, detail, locationgps } = req.body;

  // ✅ Validate required fields
  if (!id || !name || !price1 || !detail) {
    return res.status(400).send({
      status: false,
      message:
        "Missing required fields: id, name, price1, and detail are required",
      data: [],
    });
  }

  // ✅ Extract uploaded image filenames
  const imageArray =
    req.files && req.files.length > 0
      ? req.files.map((file) => file.filename)
      : [];

  try {
    // ✅ Build query for inserting data directly into tbkhoomkhotsheb
    const query = `
      INSERT INTO public.tbkhoomkhotsheb(
        id, type, name, "Price1", "Price2", tel, detail, locationgps, image, status, cdate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], '1', NOW())
      RETURNING *;
    `;

    const values = [
      id,
      type,
      name,
      price1,
      price2 || null,
      tel || null,
      detail,
      locationgps,
      imageArray,
    ];

    const result = await dbExecution(query, values);

    // ✅ Response handling
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
    console.error("Error in insert_khoomkho_tsheb_data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
      data: [],
    });
  }
};

// delete khoomkho_tsheb data

export const deleteKhoomKhoTshebData = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbkhoomkhotsheb SET status='0' WHERE id =$1 RETURNING *`;
    const values = [id];
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

// re-open khoomkho_tsheb data status 0 to 1

export const reopenKhoomKhoTshebDataStatus0To1 = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbkhoomkhotsheb SET status='1' WHERE id =$1 RETURNING *`;
    const values = [id];
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
