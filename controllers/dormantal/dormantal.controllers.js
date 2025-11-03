import { dbExecution } from "../../config/dbConfig.js";

// kho lawm  qhob no with image lawm nawb muas

export const queryDormitoryDataAll = async (req, res) => {
  try {
    const { page = 0, limit = 25 } = req.query;
    const validPage = Math.max(parseInt(page), 0);
    const validLimit = Math.max(parseInt(limit), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // 🧮 Count total records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormitory d
      WHERE d.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // 📦 Main query with pagination
    const dataQuery = `
      SELECT 
        d.id,
        d.dormantalname,
        d.price1,
        d.price2,
        d.price3,
        d.type,
        d.totalroom,
        d.activeroom,
        d.locationvideo,
        d.tel,
        d.contactnumber,
        d.moredetail,
        p.province,
        dis.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        d.image,
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.status = '1'
      GROUP BY 
        d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    let rows = result?.rows || [];

    // 🖼️ Map image URLs to full paths
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
        images: imgs.map((img) => baseUrl + img),
      };
    });

    // 📤 Send response
    res.status(200).send({
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
    console.error("Error in query_dormantal_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// search ny name. // kho lawm
export const searchDormitoryData = async (req, res) => {
  try {
    const { name } = req.params;
    const { page = 0, limit = 25 } = req.query;

    if (!name || typeof name !== "string") {
      return res.status(400).send({
        status: false,
        message: "Missing or invalid dormitory name",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 25, 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormitory d
      WHERE d.status = '1' AND d.dormantalname ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    const query = `
      SELECT 
        d.id,
        d.dormantalname,
        d.price1,
        d.price2,
        d.price3,
        d.type,
        d.totalroom,
        d.activeroom,
        d.locationvideo,
        d.tel,
        d.contactnumber,
        d.moredetail,
        p.province,
        dis.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        d.image,
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.status = '1' AND d.dormantalname ILIKE $1
      GROUP BY 
        d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

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
        } else if (typeof r.image === "string" && r.image.trim() !== "") {
          imgs = [r.image];
        }
      }

      return {
        ...r,
        images: imgs.map((img) => `${baseUrl}${img}`),
      };
    });

    res.status(200).send({
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
    console.error("Error in searchDormitoryData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// select data by provinceid and districtid   // kho lawm query_dormantal_data_by_provinceid_and_districtid
export const queryDormitoryDataByDistrictId = async (req, res) => {
  try {
    const { districtId, page = 0, limit = 25 } = req.params;

    // 🧩 Validate input
    if (!districtId) {
      return res.status(400).send({
        status: false,
        message: "Missing province or district ID",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page) || 0, 0);
    const validLimit = Math.max(parseInt(limit) || 15, 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // 🧮 Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormitory d
      WHERE d.status = '1' AND d.districtid = $2;
    `;
    const countResult = await dbExecution(countQuery, [districtId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // 📦 Main query
    const query = `
      SELECT 
        d.id,
        d.dormantalname,
        d.price1,
        d.price2,
        d.price3,
        d.type,
        d.totalroom,
        d.activeroom,
        d.locationvideo,
        d.tel,
        d.contactnumber,
        d.moredetail,
        p.province,
        dis.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        d.image,
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.status = '1' AND d.districtid = $1
      GROUP BY 
        d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [districtId, validLimit, offset]);
    let rows = result?.rows || [];

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
        } else if (typeof r.image === "string" && r.image.trim() !== "") {
          imgs = [r.image];
        }
      }

      return {
        ...r,
        images: imgs.map((img) => `${baseUrl}${img}`),
      };
    });

    res.status(200).send({
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
    console.error("Error in query_dormitory_data_by_districtid:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const queryDormitoryDataByVillageId = async (req, res) => {
  try {
    const { villageId, page = 0, limit = 20 } = req.params;

    // 🧩 Validate input
    if (!villageId) {
      return res.status(400).send({
        status: false,
        message: "Missing district or village ID",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page) || 0, 0);
    const validLimit = Math.max(parseInt(limit) || 20, 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // 🧮 Count query for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormitory d
      WHERE d.status = '1' 
        AND ($1::varchar IS NULL OR $1::int = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[]));
    `;
    const countResult = await dbExecution(countQuery, [villageId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // 📦 Main query with joins
    const query = `
        SELECT 
        d.id,
        d.dormantalname,
        d.price1,
        d.price2,
        d.price3,
        d.type,
        d.totalroom,
        d.activeroom,
        d.locationvideo,
        d.tel,
        d.contactnumber,
        d.moredetail,
        p.province,
        dis.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        d.image,
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.status = '1' AND $1 = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      GROUP BY 
        d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [villageId, validLimit, offset]);
    let rows = result?.rows || [];

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
        } else if (typeof r.image === "string" && r.image.trim() !== "") {
          imgs = [r.image];
        }
      }

      return {
        ...r,
        images: imgs.map((img) => `${baseUrl}${img}`),
      };
    });

    res.status(200).send({
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
    console.error(
      "Error in query_dormitory_data_by_district_or_villageid:",
      error
    );
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// tsi tau rub mu siv
export const queryDormitoryDataOne = async (req, res) => {
  try {
    const { id } = req.params;

    // 🧩 Validate input
    if (!id) {
      return res.status(400).send({
        status: false,
        message: "Missing dormitory ID",
        data: [],
      });
    }

    const baseUrl = "http://localhost:5151/";

    // 📦 Main query (no LIMIT/OFFSET)
    const query = `
      SELECT 
        d.id,
        d.dormantalname,
        d.price1,
        d.price2,
        d.price3,
        d.type,
        d.totalroom,
        d.activeroom,
        d.locationvideo,
        d.tel,
        d.contactnumber,
        d.moredetail,
        p.province,
        dis.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        d.image,
        d.plan_on_next_month,
        d.cdate
      FROM public.tbdormitory d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE d.id = $1
      GROUP BY 
        d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
        d.totalroom, d.activeroom, d.locationvideo, d.tel, 
        d.contactnumber, d.moredetail,
        p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
      ORDER BY d.cdate DESC;
    `;

    // 🧮 Execute query
    const result = await dbExecution(query, [id]);
    let rows = result?.rows || [];

    // 🖼️ Process images
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
        } else if (typeof r.image === "string" && r.image.trim() !== "") {
          imgs = [r.image];
        }
      }

      return {
        ...r,
        images: imgs.map((img) => `${baseUrl}${img}`),
      };
    });

    // ✅ Response
    res.status(200).send({
      status: true,
      message: "Query data successful",
      data: rows,
    });
  } catch (error) {
    console.error("Error in queryDormitoryDataOne:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert data   // kho lawm
export const insertDormitoryData = async (req, res) => {
  const {
    id,
    dormantalname,
    price1,
    price2,
    price3,
    type,
    totalroom,
    activeroom,
    locationvideo,
    tel,
    contactnumber,
    moredetail,
    province,
    district,
    village,
    plan_on_next_month,
  } = req.body;

  // ✅ Required field validation
  if (!id || !type || !totalroom || !dormantalname) {
    return res.status(400).send({
      status: false,
      message:
        "Missing required fields: id, type, totalroom, dormantalname are required",
      data: null,
    });
  }

  // ✅ Normalize village input into array
  const parseVillageList = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed)
            ? parsed.map((x) => String(x).trim()).filter(Boolean)
            : [];
        } catch {}
      }
      return trimmed
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return [String(v).trim()];
  };

  // ✅ Extract uploaded images from multer
  const imageArray =
    req.files && req.files.length > 0
      ? req.files.map((file) => file.filename)
      : [];

  // ✅ Parse villages
  const villageArray = parseVillageList(village);

  try {
    const query = `
      INSERT INTO public.tbdormantal(
        id, dormantalname, price1, price2, price3, type, totalroom, activeroom,
        locationvideo, tel, contactnumber, moredetail,
        province, district, village, image, status, plan_on_next_month, cdate
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15::text[], $16::text[], '1', $17, NOW()
      )
      RETURNING *;
    `;

    const values = [
      id,
      dormantalname,
      price1 || null,
      price2 || null,
      price3 || null,
      type,
      totalroom,
      activeroom || 0,
      locationvideo || "",
      tel || "",
      contactnumber || "",
      moredetail || "",
      province || null,
      district || null,
      villageArray,
      imageArray,
      plan_on_next_month || "",
    ];

    const result = await dbExecution(query, values);

    if (result && result.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert dormantal data successful",
        data: result.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "Insert dormantal data failed",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in insert_dormantal_data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// kho lawm

export const UpdateActiveStatusDormitoryData = async (req, res) => {
  // done

  const { id, status } = req.body;

  try {
    const query = `update public.tbdormantalroom set status=$1 where id=$2 RETURNING *`;
    let values = [status, id];
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

// kho lawm

export const UpdateDormitoryRoomAndActiveRoomData = async (req, res) => {
  // done

  const { id, dormantal_type, totalroom, number_roomactive } = req.body;

  try {
    const query = `update public.tbdormantalroom set type=$1, totalroom=$2, activeroom=$3 where id=$4 RETURNING *`;
    let values = [dormantal_type, totalroom, number_roomactive, id];
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

export const UpdateDormitoryPricePerRoomData = async (req, res) => {
  // done

  const { id, price1, price2, price3 } = req.body;

  try {
    const query = `update public.tbdormantalroom set price1=$1, price2=$2, price3=$3 where id=$4 RETURNING *`;
    let values = [price1, price2, price3, id];
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

// kho lawm // hai dormantal ce tsi ua lo yog tsi muaj viewnumber lawm

export const UpdateViewNumberOfThisId = async (req, res) => {
  // done

  const id = req.body.id;

  try {
    const query_v = `SELECT viewnumber FROM public.tbdormantalroom where id=$1`;

    const result = await dbExecution(query_v, [id]);
    let viewnumber = result.rows[0].viewnumber;
    viewnumber += 1;

    const query = `update public.tbdormantalroom set viewnumber= $1 where id= $2 RETURNING *`;
    let values = [viewnumber, id];
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
