import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

 export const queryKhoomKhoTshebDataAll = async (req, res) => {
  try {
    // ✅ Read from query params (not path params)
    const { page = 0, limit = 25 } = req.query;

    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 25, 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // ✅ Count total rows
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbkhoomkhotsheb
      WHERE status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);
    const totalPages = Math.ceil(total / validLimit);

    // ✅ Fetch data
    const query = `
      SELECT 
        id,
        name,
        "Price1",
        "Price2",
        tel,
        detail,
        donation,
        image
      FROM public.tbkhoomkhotsheb
      WHERE status = '1'
      ORDER BY cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    let rows = (await dbExecution(query, [validLimit, offset]))?.rows || [];

    // ✅ Safely parse images
    rows = rows.map((r) => {
      let images = [];
      if (r.image) {
        if (Array.isArray(r.image)) {
          images = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
          images = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }
      return {
        ...r,
        images: images.map((img) => baseUrl + img),
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
    console.error("Error in queryKhoomKhoTshebDataAll:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};
 
export const searchKhoomKhoTshebData = async (req, res) => {
  try {
    const { name = "", page = 0, limit = 25 } = req.params;

    // ✅ Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).send({
        status: false,
        aaa:name,
        message: "Invalid or missing name",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 25, 1);
    const offset = validPage * validLimit;
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

    // ✅ Fetch paginated matching data
    const query = `
      SELECT 
        id,
        name,
        "Price1",
        "Price2",
        tel,
        detail,
        donation,
        image
      FROM public.tbkhoomkhotsheb
      WHERE status = '1' AND name ILIKE $1
      ORDER BY cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    let rows = (await dbExecution(query, [`%${name}%`, validLimit, offset]))?.rows || [];

    // ✅ Safely parse images from Postgres array
    rows = rows.map((r) => {
      let images = [];
      if (r.image) {
        if (Array.isArray(r.image)) {
          images = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
          images = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }
      return {
        ...r,
        images: images.map((img) => baseUrl + img),
      };
    });

    // ✅ Send final response
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
    console.error("Error in searchKhoomKhoTshebData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};


// query khoomkho_tsheb data by id
export const queryKhoomKhoTshebDataOne = async (req, res) => {
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
        k.id,
        k.name,
        k."Price1",
        k."Price2",
        k.tel,
        k.detail,
        k.donation,
        k.image
      FROM public.tbkhoomkhotsheb k where k.id= $1
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
export const insertKhoomKhoTshebData = async (req, res) => {
  const { id, name, price1, price2, tel, detail, donation } = req.body;

  // ✅ Validate required fields
  if (!id || !name || !price1 || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id, name, price1, and detail are required",
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
