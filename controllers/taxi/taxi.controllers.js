import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

export const queryTaxiDataAll = async (req, res) => {
  //const { page = 0, limit = 20 } = req.params;

  const page = req.query.page ?? 0;
  const limit = req.query.limit ?? 15;

  // ✅ sanitize & convert
  const validPage = Math.max(parseInt(page, 10) || 0, 0);
  const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
  const offset = validPage * validLimit;

  const baseUrl = "http://localhost:5151/";

  try {
    // Count total records
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      WHERE t.status = '1';
    `;
    const countResult = await dbExecution(countQuery);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: {
          page: validPage,
          limit: validLimit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // ✅ Fixed JOIN — cast text to integer array
    const query = `
      SELECT 
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        t.image
      FROM public.tbtaxi t
      INNER JOIN public.tbdistrict d ON d.districtid = t.districtid
      INNER JOIN public.tbprovince p ON p.provinceid = t.provinceid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE t.status = '1'
      GROUP BY 
        t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(query, [validLimit, offset]);
    let rows = result?.rows || [];

    // ✅ Proper image parsing
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

    let topData = null;

    if (validPage === 0) {
      try {
        const topResult = await QueryTopup.getAllProductB();

        topData = topResult?.topData || topResult;
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    const response = {
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

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
      ...(validPage === 0 && { topData }),
    });
  } catch (error) {
    console.error("Error in query_taxi_dataall:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total: 0,
        totalPages: 0,
      },
    });
  }
};

// search taxi data all or select top 15
export const searchTaxiData = async (req, res) => {
  //const { name , page = 0, limit = 20 } = req.params;
  const name = req.query.name ?? 0;
  const page = req.query.page ?? 0;
  const limit = req.query.limit ?? 15;

  // ✅ sanitize & convert
  const validPage = Math.max(parseInt(page, 10) || 0, 0);
  const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
  const offset = validPage * validLimit;

  const baseUrl = "http://localhost:5151/";

  try {
    // ✅ Count total matching records (with ILIKE for case-insensitive search)
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      WHERE t.status = '1'
      AND t.name ILIKE $1
    `;
    const countValues = [`%${name}%`];
    const countResult = await dbExecution(countQuery, countValues);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages: 0,
        },
      });
    }

    // ✅ Main query with search + pagination
    const query = `
      SELECT 
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        t.image
      FROM public.tbtaxi t
      INNER JOIN public.tbdistrict d ON d.districtid = t.districtid
      INNER JOIN public.tbprovince p ON p.provinceid = t.provinceid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE t.status = '1' and t.name ILIKE $1
      GROUP BY 
        t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $2 OFFSET $3;
    `;
    // const queryValues = [`%${name}%`, validLimit, offset];
    const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // ✅ Proper image parsing
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
    console.error("Error in searchTaxiData:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total: 0,
        totalPages: 0,
      },
    });
  }
};

export const queryTaxiByProvinceIdAndDistrictId = async (req, res) => {
  //const { districtId = "", page = 0, limit = 20 } = req.params;

  const districtId = req.query.districtId ?? 0;
  const page = req.query.page ?? 0;
  const limit = req.query.limit ?? 15;

  // ✅ sanitize & convert
  const validPage = Math.max(parseInt(page, 10) || 0, 0);
  const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
  const offset = validPage * validLimit;

  const baseUrl = process.env.BASE_URL || "http://localhost:5151/";

  try {
    // ✅ Count total records
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t  WHERE t.status = '1'
        AND ($1 = '' OR t.districtid::text = $1);
    `;
    const countResult = await dbExecution(countQuery, [districtId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages: 0,
        },
      });
    }

    // ✅ Main query
    const query = `
     SELECT 
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        t.image
      FROM public.tbtaxi t
      INNER JOIN public.tbdistrict d ON d.districtid = t.districtid
      INNER JOIN public.tbprovince p ON p.provinceid = t.provinceid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE t.status = '1' and t.districtid = $1
      GROUP BY 
        t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await dbExecution(query, [districtId, validLimit, offset]);

    // const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // ✅ Proper image parsing
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
    console.error("Error in queryTaxiByDistrictId:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total: 0,
        totalPages: 0,
      },
    });
  }
};

export const queryTaxiByDistrictIdAndVillageId = async (req, res) => {
  //const { villageId, page = 0, limit = 20 } = req.params;

  const villageId = req.query.villageId ?? 0;
  const page = req.query.page ?? 0;
  const limit = req.query.limit ?? 15;

  // ✅ sanitize & convert
  const validPage = Math.max(parseInt(page, 10) || 0, 0);
  const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
  const offset = validPage * validLimit;

  const baseUrl = "http://localhost:5151/";

  try {
    // ✅ Count total records
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      WHERE t.status = '1' and $1 = ANY( string_to_array(t.villageid, ',') );
    `;
    const countResult = await dbExecution(countQuery, [villageId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages: 0,
        },
      });
    }

    // ✅ Main query
    const query = `
       SELECT 
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        t.image
      FROM public.tbtaxi t
      INNER JOIN public.tbdistrict d ON d.districtid = t.districtid
      INNER JOIN public.tbprovince p ON p.provinceid = t.provinceid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE t.status = '1' and $1 = ANY( string_to_array(t.villageid, ',') )
      GROUP BY 
        t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [villageId, validLimit, offset]);

    // ✅ Add full image URLs
    let rows = result?.rows || [];

    // ✅ Proper image parsing
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
    console.error("Error in queryTaxiByDistrictIdAndVillageId:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total: 0,
        totalPages: 0,
      },
    });
  }
};

// query taxi data by id
export const queryTaxiDataOne = async (req, res) => {
  //const id = req.params.id;

  const id = req.query.id ?? 0;

  const baseUrl = "http://localhost:5151/";

  try {
    const query = `
       SELECT 
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        t.image
      FROM public.tbtaxi t
      INNER JOIN public.tbdistrict d ON d.districtid = t.districtid
      INNER JOIN public.tbprovince p ON p.provinceid = t.provinceid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE t.status = '1' and t.id= $1
      GROUP BY 
        t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image 
    `;
    // const resultSingle = await dbExecution(query, [id]);
    const result = await dbExecution(query, [id]);

    let rows = result?.rows || [];

    // ✅ Proper image parsing
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

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error in query_taxi_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert taxi data
export const insert_taxi_data = async (req, res) => {
  const {
    id,
    name,
    price1,
    price2,
    tel,
    detail,
    province,
    district,
    village,
    peopleid,
    turnofreason,
  } = req.body;

  try {
    // 🧾 Validate required fields
    if (!id || !name || !tel || !detail) {
      return res.status(400).send({
        status: false,
        message: "Missing required fields",
        data: [],
      });
    }

    // 🖼️ Collect uploaded images as an array
    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename)
        : [];

    // 🏘️ Parse village input into array
    const parseVillageList = (v) => {
      if (!v) return [];
      if (Array.isArray(v))
        return v.map((x) => String(x).trim()).filter(Boolean);
      if (typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed.startsWith("[")) {
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed)
              ? parsed.map((x) => String(x).trim()).filter(Boolean)
              : [];
          } catch (e) {
            // fallback if JSON parse fails
          }
        }
        return trimmed
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      }
      return [String(v).trim()];
    };

    const villageArray = parseVillageList(village);

    // 🧠 Insert main data
    const query = `
      INSERT INTO public.tbtaxi(
        id, name, price1, price2, tel, detail, province, district, village, image, 
        status, peopleid, turnofreason, cdate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10::text[], $11, $12, $13, NOW())
      RETURNING *;
    `;

    const values = [
      id,
      name,
      price1,
      price2,
      tel,
      detail,
      province,
      district,
      villageArray, // 👈 array of villages
      imageArray, // 👈 array of images
      "1", // status
      peopleid || null,
      turnofreason || null,
    ];

    const result = await dbExecution(query, values);

    if (result && result.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert data successful",
        data: result.rows,
      });
    }

    return res.status(400).send({
      status: false,
      message: "Insert data failed",
      data: [],
    });
  } catch (error) {
    console.error("Error in insert_taxi_data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const updateProductData = async (req, res) => {
  try {
    const {
      id,
      name,
      Price1,
      Price2,
      tel,
      detail,
      provinceId,
      districtId,
      villageId,
      peopleId,
    } = req.body;

    if (!id) {
      return res.status(400).send({
        status: false,
        message: "Missing product ID",
        data: null,
      });
    }
    // Handle village ID array
    let villageIdArray = null;
    if (Array.isArray(villageId) && villageId.length > 0) {
      villageIdArray = `{${villageId.join(",")}}`;
    }
    let updateFields = [];
    let values = [];
    let index = 1;

    // Helper for adding fields
    const addField = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    // Add all updatable fields
    addField("name", name);
    addField('price1', Price1);
    addField('price2', Price2);
    addField("tel", tel);
    addField("detail", detail);
    addField("provinceid", provinceId);
    addField("districtid", districtId);
    addField("villageid", villageIdArray);
    addField("peopleid", peopleId);

    // If nothing to update
    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No fields provided to update",
        data: null,
      });
    }

    // ID last
    values.push(id);

    const query = `
      UPDATE public.tbtaxi
      SET ${updateFields.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await dbExecution(query, values);

    if (result?.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update successful",
        data: result.rows,
      });
    }

    return res.status(404).send({
      status: false,
      message: "Product not found",
      data: null,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
