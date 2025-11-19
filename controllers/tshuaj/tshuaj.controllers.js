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
    // Now get paginated results
    const dataQuery = `
      SELECT 
        t.id,
        t.name,
        t."Price1",
        t."Price2",
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
    console.error("Error in query_tshuaj_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
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

    // Query paginated search results
    const dataQuery = `
      SELECT 
        t.id,
        t.name,
        t."Price1",
        t."Price2",
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
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in search_tshuaj_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// query tshuaj data by id
export const queryTshuajDataOne = async (req, res) => {
  //const { id } = req.params;

  const id = req.query.id ?? 0;

  const baseUrl = "http://localhost:5151/";

  try {
    const query = `SELECT 
        t.id,
        t.name,
        t."Price1",
        t."Price2",
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
      data: rows,
    });
  } catch (error) {
    console.error("Error in query_tshuaj_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert data  test  nw work lawm
export const insertTshuajData = async (req, res) => {
  const { id, name, price1, price2, tel, detail, donation } = req.body;

  // ✅ Validate required fields
  if (!id || !name || !price1 || !detail) {
    return res.status(400).send({
      status: false,
      message:
        "Missing required fields: id, name, price1, and detail are required",
      data: [],
    });
  }

  // ✅ Collect uploaded filenames into an array
  const imageArray =
    req.files && req.files.length > 0
      ? req.files.map((file) => file.filename)
      : [];

  try {
    // ✅ Insert into main table directly
    const query = `
      INSERT INTO public.tbtshuaj(
        id, name, "Price1", "Price2", tel, detail, image, status, donation, cdate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::text[], '1', $8, NOW())
      RETURNING *;
    `;

    const values = [
      id,
      name,
      price1,
      price2 || null,
      tel || "",
      detail,
      imageArray,
      donation || "",
    ];

    const result = await dbExecution(query, values);

    // ✅ Success response
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
    console.error("Error in insert_tshuaj_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
      data: [],
    });
  }
};

// delete tshuaj data || update data status 1 to 0

export const deleteTshuajData = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbtshuaj SET status='0' WHERE id =$1 RETURNING *`;
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

// re-open tshuaj data status 0 to 1

export const reopenTshuajDataStatus0To1 = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbtshuaj SET status='1' WHERE id =$1 RETURNING *`;
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
