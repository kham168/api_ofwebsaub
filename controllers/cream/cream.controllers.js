import { dbExecution } from "../../config/dbConfig.js";

export const query_cream_dataall = async (req, res) => {
  try {
    // Extract pagination params from query
    const { page = "0", limit = "15" } = req.query;

    // Validate and convert to numbers
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Count total available records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbcream c
      WHERE c.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(total / validLimit);

    // Fetch paginated cream data
    const dataQuery = `
      SELECT 
        c.id,
        c.creamname,
        c."Price1",
        c."Price2",
        c."Price3",
        c.tel,
        c.detail,
        c.donation,
        COALESCE(ARRAY_AGG(ci.url) FILTER (WHERE ci.url IS NOT NULL), '{}') AS images
      FROM public.tbcream c
      LEFT JOIN public.tbcreamimage ci ON ci.id = c.id
      WHERE c.status = '1'
      GROUP BY c.id, c.creamname, c."Price1", c."Price2", c."Price3", c.tel, c.detail, c.donation
      ORDER BY c.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    let rows = result?.rows || [];

    // Base URL for image mapping
    const baseUrl = "http://localhost:5151/";

    // Append full URLs to images
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    // Unified API response
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
    console.error("Error in query_cream_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// search cream data by name
export const search_cream_data = async (req, res) => {
  const name = req.body.name;

  if (!name || typeof name !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid id",
      data: [],
    });
  }

  try {
    const query = `SELECT 
        c.id,
        c.creamname,
        c."Price1",
        c."Price2",
        c."Price3",
        c.tel,
        c.detail,
        c.donation,
        COALESCE(ARRAY_AGG(ci.url) FILTER (WHERE ci.url IS NOT NULL), '{}') AS images
      FROM public.tbcream c
      LEFT JOIN public.tbcreamimage ci ON ci.id = c.id where c.status='1' and c.creamname Ilike $1
      GROUP BY c.id, c.creamname, c."Price1", c."Price2", c."Price3",c.tel, c.detail,c.donation
      ORDER BY c.cdate DESC limit 25;
    `;
    const resultSingle = await dbExecution(query, [`%${name}%`]);
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
    console.error("Error in query_cream_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const query_cream_dataone = async (req, res) => {
  try {
    const { id } = req.body;

    // Validate ID input (allow both string or number)
    if (!id || (typeof id !== "string" && typeof id !== "number")) {
      return res.status(400).send({
        status: false,
        message: "Invalid or missing ID",
        data: [],
      });
    }

    const query = `
      SELECT 
        c.id,
        c.creamname,
        c."Price1",
        c."Price2",
        c."Price3",
        c.tel,
        c.detail,
        c.donation,
        COALESCE(ARRAY_AGG(ci.url) FILTER (WHERE ci.url IS NOT NULL), '{}') AS images
      FROM public.tbcream c
      LEFT JOIN public.tbcreamimage ci ON ci.id = c.id
      WHERE c.status = '1' AND c.id = $1
      GROUP BY c.id, c.creamname, c."Price1", c."Price2", c."Price3", c.tel, c.detail, c.donation;
    `;

    const result = await dbExecution(query, [id]);
    let rows = result?.rows || [];

    // Define base URL for image mapping
    const baseUrl = "http://localhost:5151/";

    // Map images to full URLs
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    if (rows.length > 0) {
      res.status(200).send({
        status: true,
        message: "Query data successful",
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
    console.error("Error in query_cream_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert cream data

export const insert_cream_data = async (req, res) => {
  const { id, creamname, price1, price2, price3, tel, detail } = req.body;

  if (!id || !creamname || !price1 || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    // Insert images first
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await dbExecution(
          `INSERT INTO public.tbcreamimage(id, url) VALUES ($1, $2) RETURNING *`,
          [id, file.filename]
        );
      }
    }

    // Insert main cream data
    const query = `
  INSERT INTO public.tbcream(id, creamname, "Price1", "Price2", "Price3",tel, detail, cdate, status)
  VALUES ($1, $2, $3, $4, $5, $6,$7, NOW(), $8)
  RETURNING *
`;

    const values = [id, creamname, price1, price2, price3, tel, detail, "1"];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "Insert data failed",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in insert_cream_data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// delet cream data  ||  update status 1 to 0

export const delete_cream_data = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbcream SET status='0' WHERE <condition> WHERE id =$1 RETURNING *`;
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

// re-open cream data status 0 to 1

export const reopen_cream_data_status_0_to_1 = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbcream SET status='1' WHERE <condition> WHERE id =$1 RETURNING *`;
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
