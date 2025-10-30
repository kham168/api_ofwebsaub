import { dbExecution } from "../../config/dbConfig.js";


// query muas data all or select top 15 
 export const query_muas_dataall = async (req, res) => {
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
        COALESCE(ARRAY_AGG(mi.url) FILTER (WHERE mi.url IS NOT NULL), '{}') AS images
      FROM public.tbmuas m
      LEFT JOIN public.tbmuasimage mi ON mi.id = m.id
      WHERE m.status = '1'
      GROUP BY m.id, m.name, m.price, m.tel, m.detail, m.status, m.donation, m.cdate
      ORDER BY m.id ASC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    const rows = result?.rows || [];

    // Build unified response
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
    console.error("Error in query_muas_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const search_muas_data = async (req, res) => {
  try {
    const { name = '' } = req.body;
    const { page = '0', limit = '15' } = req.query;

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
        COALESCE(ARRAY_AGG(mi.url) FILTER (WHERE mi.url IS NOT NULL), '{}') AS images
      FROM public.tbmuas m
      LEFT JOIN public.tbmuasimage mi ON mi.id = m.id
      WHERE m.status = '1' AND m.name ILIKE $1
      GROUP BY m.id, m.name, m.price, m.tel, m.detail, m.status, m.donation
      ORDER BY m.id ASC
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
export const query_muas_dataone = async (req, res) => {
  const id = req.body.id;

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
        COALESCE(ARRAY_AGG(mi.url) FILTER (WHERE mi.url IS NOT NULL), '{}') AS images
      FROM public.tbmuas m
      LEFT JOIN public.tbmuasimage mi ON mi.id = m.id
      WHERE m.status = '1' and m.id = $1
      GROUP BY m.id, m.name, m.price,m.tel, m.detail, m.status,m.donation;
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

 

// insert muas data

//INSERT INTO public.tbmuasimage(
//	id, url)
	//VALUES (?, ?)

export const insert_muas_data = async (req, res) => {
  const { id, name, price,tel, detail } = req.body;
  const data = req.body; // define data to hold file

  if (req.file) {
    data.file = req.file.filename;
  }

  if (!id || !name || !price || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    // Insert image only if file exists
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
      const queryImage = `INSERT INTO public.tbmuasimage(id, url) VALUES ($1, $2) RETURNING *`;
       await dbExecution(queryImage, [id, file.filename]);
      }
    }

    // Insert muas data
    const query = `
      INSERT INTO public.tbmuas(id, name, price,tel, detail, status, cdate)
      VALUES ($1, $2, $3, $4, $5,$6, NOW())
      RETURNING *
    `;
    const values = [id, name, price,tel, detail, '1'];
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
    console.error("Error in insert_muas_data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};


     // delete muas data

export const delete_muas_data = async (req, res) => {
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
export const reopen_muas_data_status_0_to_1 = async (req, res) => {
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
