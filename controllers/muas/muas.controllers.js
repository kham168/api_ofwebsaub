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
    // Get paginated data
    const dataQuery = `
      SELECT 
        m.id,
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

    // ✅ If page === 0 → also call top data function
    let topData = null;
    if (validPage === 0) {
      try {
        const topResult = await QueryTopup.getAllProductAData(); // must return data in JS object, not Express res
        topData = topResult?.data || topResult; // handle both formats
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
      ...(validPage === 0 && { topData }),
    });
  } catch (error) {
    console.error("Error in query_muas dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
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

    // Fetch paginated search results
    const dataQuery = `
      SELECT 
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
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in search_muas_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
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

  try {
    const query = `SELECT 
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
      data: rows,
    });
  } catch (error) {
    console.error("Error in query_muas_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const insertMuasData = async (req, res) => {
  const { id, name, price, tel, detail } = req.body;

  // Validate required fields
  if (!id || !name || !price || !detail) {
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

    // 🧠 Insert data into tbmuas
    const query = `
      INSERT INTO public.tbmuas (
        id, name, price, tel, detail, image, status, cdate
      )
      VALUES ($1, $2, $3, $4, $5, $6::text[], $7, NOW())
      RETURNING *;
    `;

    const values = [
      id,
      name,
      price,
      tel,
      detail,
      imageArray, // 👈 store array of images here
      "1", // active status
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
    console.error("Error in insertMuasData:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const deleteMuasData = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Missing id",
      data: [],
    });
  }

  try {
    const query = `
      UPDATE public.tbmuas
      SET status = '0'
      WHERE id = $1
      RETURNING *
    `;
    const values = [id];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(200).send({
        status: false,
        message: "No data updated",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in update_muas_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// delete muas data
export const reopenMuasDataStatus0To1 = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Missing id",
      data: [],
    });
  }

  try {
    const query = `
      UPDATE public.tbmuas
      SET status = '1'
      WHERE id = $1
      RETURNING *
    `;
    const values = [id];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(200).send({
        status: false,
        message: "No data updated",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in update_muas_data_status_0_to_1:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};
