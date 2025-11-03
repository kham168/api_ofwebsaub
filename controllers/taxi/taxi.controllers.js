import { dbExecution } from "../../config/dbConfig.js";

export const queryTaxiDataAll = async (req, res) => {
  const { page = 0, limit = 20 } = req.params;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
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
        pagination: { page: validPage, limit: validLimit, total: 0, totalPages: 0 },
      });
    }

    // ✅ Fixed JOIN — cast text to integer array
    const query = `
      SELECT 
        t.id,
        t.name,
        t."Price1",
        t."Price2",
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
        t.id, t.name, t."Price1", t."Price2", t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(query, [validLimit, offset]);

    if (!result || !result.rows) {
      return res.status(500).json({
        status: false,
        message: "Database query failed",
        data: [],
      });
    }

    const rows = result.rows.map((r) => {
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
        images: imgs.map((img) => baseUrl + img),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Query data successful",
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    });
  } catch (error) {
    console.error("Error in query_taxi_dataall:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: { page: validPage, limit: validLimit, total: 0, totalPages: 0 },
    });
  }
};



// search taxi data all or select top 15
export const searchTaxiData = async (req, res) => {
  const { name , page = 0, limit = 20 } = req.params;

  const validPage = Math.max(parseInt(page, 10) || 0, 0);
  const validLimit = Math.max(parseInt(limit, 10) || 1, 1);
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
        t."Price1",
        t."Price2",
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
        t.id, t.name, t."Price1", t."Price2", t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $2 OFFSET $3;
    `;
    const queryValues = [`%${name}%`, validLimit, offset];
    const result = await dbExecution(query, queryValues);

    // ✅ Map images to full URLs
    const rows = result.rows.map((r) => {
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
        images: imgs.map((img) => baseUrl + img),
      };
    });

    // ✅ Return successful result
    return res.status(200).json({
      status: true,
      message: "Query data successful",
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
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
  const { districtId = "", page = 0, limit = 20 } = req.params;

  const validPage = Math.max(parseInt(page, 10) || 0, 0);
  const validLimit = Math.max(parseInt(limit, 10) || 1, 1);
  const offset = validPage * validLimit;
  const baseUrl = process.env.BASE_URL || "http://localhost:5151/";

  try {
    // ✅ Count total records
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      WHERE t.status = '1'
        AND ($1 = '' OR t.districtid::text = $1);
    `;
    const countResult = await dbExecution(countQuery, [districtId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: { page: validPage, limit: validLimit, total, totalPages: 0 },
      });
    }

    // ✅ Main query
    const query = `
     SELECT 
        t.id,
        t.name,
        t."Price1",
        t."Price2",
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
        t.id, t.name, t."Price1", t."Price2", t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await dbExecution(query, [districtId, validLimit, offset]);

    // ✅ Format rows
    const rows = result.rows.map((r) => {
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
        images: imgs.map((img) => baseUrl + img),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Query data successful",
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    });

  } catch (error) {
    console.error("Error in queryTaxiByDistrictId:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: { page: validPage, limit: validLimit, total: 0, totalPages: 0 },
    });
  }
};


export const queryTaxiByDistrictIdAndVillageId = async (req, res) => {
  const { villageId, page = 0, limit = 20 } = req.params;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
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
        t."Price1",
        t."Price2",
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
        t.id, t.name, t."Price1", t."Price2", t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [villageId, validLimit, offset]);

    // ✅ Add full image URLs
     const rows = result.rows.map((r) => {
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
        images: imgs.map((img) => baseUrl + img),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Query data successful",
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
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

  const id = req.params.id;

  try {
    const query = `
       SELECT 
        t.id,
        t.name,
        t."Price1",
        t."Price2",
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
        t.id, t.name, t."Price1", t."Price2", t.tel, t.detail,
        p.province, d.district, t.image 
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
    const imageArray = req.files && req.files.length > 0
      ? req.files.map(file => file.filename)
      : [];

    // 🏘️ Parse village input into array
    const parseVillageList = (v) => {
      if (!v) return [];
      if (Array.isArray(v))
        return v.map(x => String(x).trim()).filter(Boolean);
      if (typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed.startsWith("[")) {
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed)
              ? parsed.map(x => String(x).trim()).filter(Boolean)
              : [];
          } catch (e) {
            // fallback if JSON parse fails
          }
        }
        return trimmed.split(",").map(x => x.trim()).filter(Boolean);
      }
      return [String(v).trim()];
    };

    const villageArray = parseVillageList(village);

    // 🧠 Insert main data
    const query = `
      INSERT INTO public.tbtaxi(
        id, name, "Price1", "Price2", tel, detail, province, district, village, image, 
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
      villageArray,   // 👈 array of villages
      imageArray,     // 👈 array of images
      "1",            // status
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


// delete taxi data || Update data status 1 to 0

export const delete_taxi_data = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbtaxi SET status='0' WHERE id =$1 RETURNING *`;
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

// re-open taxi data status 1 to 0

export const reopen_taxi_data_status_0_to_1 = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbtaxi SET status='1' WHERE id =$1 RETURNING *`;
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
