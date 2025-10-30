import { dbExecution } from "../../config/dbConfig.js";





export const query_khoomkho_tsheb_dataall = async (req, res) => {
  try {
    // Pagination params from request
    const { page = 0, limit = 25 } = req.body;
    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // Count total rows for pagination metadata
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbkhoomkho_tsheb k
      WHERE k.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main data query with LIMIT and OFFSET
    const query = `
      SELECT 
        k.id,
        k.name,
        k."Price1",
        k."Price2",
        k.tel,
        k.detail,
        k.donation,
        COALESCE(ARRAY_AGG(ki.url) FILTER (WHERE ki.url IS NOT NULL), '{}') AS images
      FROM public.tbkhoomkho_tsheb k
      LEFT JOIN public.tbkhoomkho_tshebimage ki ON ki.khoomkho_id = k.id
      WHERE k.status = '1'
      GROUP BY k.id, k.name, k."Price1", k."Price2", k.tel, k.detail, k.donation
      ORDER BY k.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    let rows = (await dbExecution(query, [validLimit, offset]))?.rows || [];

    // Map images to full URLs
    rows = rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
    }));

    const result = {
        status: true,
        message: "Query data success",
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    res.status(200).send({
      status: rows.length > 0,
      message: rows.length > 0 ? "Query data successful" : "No data found",
      data: result,
    });
  } catch (error) {
    console.error("Error in query_khoomkho_tsheb_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};


export const search_khoomkho_tsheb_data = async (req, res) => {
  const { name, page = 0, limit = 20 } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid name",
      data: [],
    });
  }

  try {
    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // Count total rows for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbkhoomkho_tsheb k
      WHERE k.status = '1' AND k.name ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query with LIMIT and OFFSET
    const query = `
      SELECT 
        k.id,
        k.name,
        k."Price1",
        k."Price2",
        k.tel,
        k.detail,
        k.donation,
        COALESCE(ARRAY_AGG(ki.url) FILTER (WHERE ki.url IS NOT NULL), '{}') AS images
      FROM public.tbkhoomkho_tsheb k
      LEFT JOIN public.tbkhoomkho_tshebimage ki ON ki.khoomkho_id = k.id
      WHERE k.status = '1' AND k.name ILIKE $1
      GROUP BY k.id, k.name, k."Price1", k."Price2", k.tel, k.detail, k.donation
      ORDER BY k.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    let rows = (await dbExecution(query, [`%${name}%`, validLimit, offset]))?.rows || [];

    // Map images to full URLs
    rows = rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
    }));

    const result = {
        status: true,
        message: "Query data success",
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    res.status(200).send({
      status: rows.length > 0,
      message: rows.length > 0 ? "Query data successful" : "No data found",
      data: result,
    });
  } catch (error) {
    console.error("Error in search_khoomkho_tsheb_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};


// query khoomkho_tsheb data by id
export const query_khoomkho_tsheb_dataone = async (req, res) => {
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
        k.id,
        k.name,
        k."Price1",
        k."Price2",
        k.tel,
        k.detail,
        k.donation,
        COALESCE(ARRAY_AGG(ki.url) FILTER (WHERE ki.url IS NOT NULL), '{}') AS images
      FROM public.tbkhoomkho_tsheb k
      LEFT JOIN public.tbkhoomkho_tshebimage ki ON ki.id = k.id where k.status='1' and k.id= $1
      GROUP BY k.id, k.name, k."Price1", k."Price2",k.tel, k.detail, k.donation;
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
    console.error("Error in query_khoomkho_tsheb_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert khoomkho_tsheb data

//INSERT INTO public.tbkhoomkho_tshebimage(
//id, url)
//VALUES (?, ?);

export const insert_khoomkho_tsheb_data = async (req, res) => {
  const { id, name, price1, price2, tel, detail } = req.body;

  if (!id || !name || !price1 || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const queryImage = `INSERT INTO public.tbkhoomkho_tshebimage(id, url) VALUES ($1, $2) RETURNING *`;
        await dbExecution(queryImage, [id, file.filename]);
      }
    }

    const query = `
      INSERT INTO public.tbkhoomkho_tsheb(
        id, name, "Price1", "Price2",tel, detail, cdate, status
      )
      VALUES ($1, $2, $3, $4, $5,$6, NOW(), $7)
      RETURNING *
    `;
    const values = [id, name, price1, price2, tel, detail, "1"];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(200).send({
        status: false,
        message: "Insert data failed",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in insert_khoomkho_tsheb_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// delete khoomkho_tsheb data

export const delete_khoomkho_tsheb_data = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbkhoomkho_tsheb SET status='0' WHERE id =$1 RETURNING *`;
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

export const reopen_khoomkho_tsheb_data_status_0_to_1 = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbkhoomkho_tsheb SET status='1' WHERE id =$1 RETURNING *`;
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
