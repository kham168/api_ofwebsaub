import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

// query muas data all or select top 15 
 export const queryMuasDataAll = async (req, res) => {
  try {
    // Read pagination params from the query string
    const { page = '0', limit = '15' } = req.query;

    // Validate and convert to integers
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

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    const rows = result?.rows || [];

    // Build unified response
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

    // ✅ Build combined response
    const responseData = {
      rows,
      pagination,
      ...(validPage === 0 && { topData }), // only include if page === 0
    };

    // ✅ Send success response
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: responseData,
    });
  } catch (error) {
    console.error("Error in query_muas_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const searchMuasData = async (req, res) => {
  try { 
    const { name, page = '0', limit = '15' } = req.params;

    // Validate pagination
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

    const result = await dbExecution(dataQuery, [`%${name}%`, validLimit, offset]);
    const rows = result?.rows || [];

    // Send unified response
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query data successful" : "No data found",
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
      },
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
  const id = req.params.id;

  if (!id || typeof id !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid id",
      data: [],
    });
  }

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
    const resultSingle = await dbExecution(query, [id]);
    const rows = resultSingle?.rows || [];

    if (rows.length > 0) {
      res.status(200).send({
        status: true,
        message: "Query data success",
        data: rows,
      });
    } else {
      res.status(200).send({
        status: false,
        message: "No data found",
        data: [],
      });
    }
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
    const imageArray = req.files && req.files.length > 0
      ? req.files.map(file => file.filename)
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
      imageArray,  // 👈 store array of images here
      "1",         // active status
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
