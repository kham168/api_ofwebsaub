import { dbExecution } from "../../config/dbConfig.js";

// query tshuaj data all or select top 15   with image lawm nawb muas
export const queryTshuajDataAll = async (req, res) => {
  try {
    // Get pagination params from query
    const { page = "0", limit = "15" } = req.query;

    // Validate and convert to numbers
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

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    const rows = result?.rows || [];

    // Prepare unified response
    res.status(200).send({
      status: true,
      message: "Query data success",
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
      },
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
    const { name, page = "0", limit = "15" } = req.params;

    // Validate pagination inputs
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

    const result = await dbExecution(dataQuery, [
      `%${name}%`,
      validLimit,
      offset,
    ]);
    const rows = result?.rows || [];

    // Build response
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
  const { id } = req.params;

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

    const resultSingle = await dbExecution(query, [id]);

    if (resultSingle && resultSingle.rowCount > 0) {
      res.status(200).send({
        status: true,
        message: "Query data successful",
        data: resultSingle.rows,
      });
    } else {
      res.status(200).send({
        status: false,
        message: "No data found",
        data: [],
      });
    }
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
