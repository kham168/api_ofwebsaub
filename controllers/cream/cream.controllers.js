import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

export const queryCreamDataAll = async (req, res) => {
  try {
    // Extract pagination params from query
    //const { page = "0", limit = "25" } = req.params;

    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
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
        c.image
      FROM public.tbcream c
      WHERE c.status = '1' 
      ORDER BY c.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    let rows = result?.rows || [];

    // Base URL for image mapping
    const baseUrl = "http://localhost:5151/";

    // Append full URLs to images
    rows = rows.map((r) => {
      let imgs = [];
      if (r.image) {
        // PostgreSQL returns arrays as strings like "{a,b,c}"
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
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

    // ✅ Send success response

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
      ...(validPage === 0 && { topData }),
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

export const searchCreamData = async (req, res) => {
  try {
    // ✅ Get parameters from request
    //  const { name = "", page = 0, limit = 25 } = req.params;

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
        message: "Invalid or missing name",
        data: [],
      });
    }

    // ✅ Count total matching rows
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbcream c
      WHERE c.status = '1' AND c.creamname ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(total / validLimit);

    // ✅ Main data query (with pagination)
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
        c.image
      FROM public.tbcream c
      WHERE c.status = '1' AND c.creamname ILIKE $1
      ORDER BY c.cdate DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // ✅ Base URL for images
    const baseUrl = "http://localhost:5151/";

    // ✅ Parse image array safely
    rows = rows.map((r) => {
      let imgs = [];
      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
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
    console.error("Error in searchCreamData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const queryCreamDataOne = async (req, res) => {
  try {
    //const { id } = req.params; // ✅ fixed destructuring
    const id = req.query.id ?? 0;
    // ✅ Validate ID
    if (!id || typeof id !== "string") {
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
        c.image
      FROM public.tbcream c 
      WHERE c.id = $1 AND c.status = '1'
    `;

    const result = await dbExecution(query, [id]);
    let rows = result?.rows || [];

    // ✅ Base URL for image mapping
    const baseUrl = "http://localhost:5151/";

    // ✅ Parse images properly
    rows = rows.map((r) => {
      let imgs = [];
      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
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

    // ✅ Final response
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error in queryCreamDataOne:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert cream data
export const insertCreamData = async (req, res) => {
  const { id, creamName, price1, price2, price3, tel, detail, donation } =
    req.body;

  if (!id || !creamName || !price1 || !detail) {
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

    // 🧠 Insert into tbcream
    const query = `
      INSERT INTO public.tbcream (
        id, creamname, "Price1", "Price2", "Price3", 
        tel, detail, image, donation, status, cdate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, NOW())
      RETURNING *;
    `;

    const values = [
      id,
      creamName,
      price1,
      price2,
      price3,
      tel,
      detail,
      imageArray, // 👈 image array here
      donation || "",
      "1", // status = active
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
    console.error("Error in insertCreamData:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// delet cream data  ||  update status 1 to 0

export const deleteCreamData = async (req, res) => {
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

export const reopenCreamDataStatus0To1 = async (req, res) => {
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
