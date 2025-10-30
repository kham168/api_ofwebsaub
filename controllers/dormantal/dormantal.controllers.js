import { dbExecution } from "../../config/dbConfig.js";

// kho lawm  qhob no with image lawm nawb muas
export const query_dormantal_dataall = async (req, res) => {
  try {
    // Get query params for pagination
    const { page = 0, limit = 15 } = req.query;
    const validPage = Math.max(parseInt(page), 0);
    const validLimit = Math.max(parseInt(limit), 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // 🧮 Count total records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormantalroom d
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
        d.cdate,
        d.moredetail,
        d.status,
        d.plan_on_next_month,
        p.province,
        dis.district,
        COALESCE(vs.villages, '{}') AS villages,
        COALESCE(img.images, '{}')   AS images
      FROM public.tbdormantalroom d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN (
        SELECT jtb.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid jtb
        JOIN public.tbvillage v ON v.villageid = jtb.villageid
        GROUP BY jtb.transactionid
      ) vs ON vs.transactionid = d.id
      LEFT JOIN (
        SELECT di.id,
               ARRAY_AGG(di.url) AS images
        FROM public.tbdormantalimage di
        GROUP BY di.id
      ) img ON img.id = d.id
      WHERE d.status = '1'
      ORDER BY d.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    let rows = result?.rows || [];

    // Map image URLs to full paths
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    const responseData = {
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    res.status(200).send({
      status: true,
      message: "Query data successful",
      ...responseData,
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

export const search_dormantal_data = async (req, res) => {
  try {
    const { name } = req.body;
    const { page = 0, limit = 15 } = req.query;

    // 🧩 Validate name input
    if (!name || typeof name !== "string") {
      return res.status(400).send({
        status: false,
        message: "Missing or invalid dormantal name",
        data: [],
      });
    }

    // 🧮 Pagination setup
    const validPage = Math.max(parseInt(page), 0);
    const validLimit = Math.max(parseInt(limit), 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // 🧮 Count query (for pagination metadata)
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormantalroom d
      WHERE d.status = '1' AND d.dormantalname ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // 📦 Main search query
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
        d.cdate,
        d.moredetail,
        d.status,
        d.plan_on_next_month,
        p.province,
        dis.district,
        COALESCE(vs.villages, '{}') AS villages,
        COALESCE(img.images, '{}')   AS images
      FROM public.tbdormantalroom d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN (
        SELECT jtb.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid jtb
        JOIN public.tbvillage v ON v.villageid = jtb.villageid
        GROUP BY jtb.transactionid
      ) vs ON vs.transactionid = d.id
      LEFT JOIN (
        SELECT di.id,
               ARRAY_AGG(di.url) AS images
        FROM public.tbdormantalimage di
        GROUP BY di.id
      ) img ON img.id = d.id
      WHERE d.status = '1' AND d.dormantalname ILIKE $1
      ORDER BY d.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // 🖼️ Map image URLs to full paths
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    // 📦 Response with pagination
    const responseData = {
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    res.status(200).send({
      status: true,
      message: "Query data successful",
      ...responseData,
    });
  } catch (error) {
    console.error("Error in search_dormantal_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// select data by provinceid and districtid   // kho lawm query_dormantal_data_by_provinceid_and_districtid

export const query_dormantal_data_by_provinceid_and_districtid = async (
  req,
  res
) => {
  try {
    const { provinceid, districtid } = req.body;
    const { page = 0, limit = 15 } = req.query;

    // 🧩 Validate input
    if (!provinceid && !districtid) {
      return res.status(400).send({
        status: false,
        message: "Missing province or district ID",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page), 0);
    const validLimit = Math.max(parseInt(limit), 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // 🧮 Count query for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormantalroom d
      WHERE d.status = '1' AND d.provinceid = $1 AND d.districtid = $2;
    `;
    const countResult = await dbExecution(countQuery, [provinceid, districtid]);
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
        d.cdate,
        d.moredetail,
        d.status,
        d.plan_on_next_month,
        p.province,
        dis.district,
        COALESCE(vs.villages, '{}') AS villages,
        COALESCE(img.images, '{}') AS images
      FROM public.tbdormantalroom d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN (
        SELECT jtb.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid jtb
        JOIN public.tbvillage v ON v.villageid = jtb.villageid
        GROUP BY jtb.transactionid
      ) vs ON vs.transactionid = d.id
      LEFT JOIN (
        SELECT di.id,
               ARRAY_AGG(di.url) AS images
        FROM public.tbdormantalimage di
        GROUP BY di.id
      ) img ON img.id = d.id
      WHERE d.status = '1' AND d.provinceid = $1 AND d.districtid = $2
      ORDER BY d.cdate DESC
      LIMIT $3 OFFSET $4;
    `;

    const result = await dbExecution(query, [
      provinceid,
      districtid,
      validLimit,
      offset,
    ]);
    let rows = result?.rows || [];

    // 🖼 Map images to full URLs
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    // 📦 Response with pagination
    const responseData = {
      data: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    res.status(200).send({
      status: true,
      message: "Query data success",
      ...responseData,
    });
  } catch (error) {
    console.error(
      "Error in query_dormantal_data_by_provinceid_and_districtid:",
      error
    );
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

//   ==> qhov no g tau kho and g tau rub mu siv query_dormantal_data_by_district_or_villageid
export const query_dormantal_data_by_district_or_villageid = async (
  req,
  res
) => {
  try {
    const { districtid, villageid, page = 0, limit = 20 } = req.body;

    // Validate input
    if (!districtid && !villageid) {
      return res.status(400).send({
        status: false,
        message: "Missing district or village ID",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // Count total rows for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdormantalroom d
      WHERE d.status = '1'
        AND ($1::varchar IS NULL OR d.districtid = $1::varchar)
        AND ($2::varchar IS NULL OR EXISTS (
          SELECT 1 FROM public.tb_join_villageid j
          WHERE j.transactionid = d.id AND j.villageid = $2::varchar
        ));
    `;
    const countResult = await dbExecution(countQuery, [districtid, villageid]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query with LIMIT and OFFSET
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
        d.cdate,
        d.moredetail,
        d.status,
        d.plan_on_next_month,
        p.province,
        dis.district,
        COALESCE(vs.villages, '{}') AS villages,
        COALESCE(img.images, '{}') AS images
      FROM public.tbdormantalroom d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN (
        SELECT jtb.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid jtb
        JOIN public.tbvillage v ON v.villageid = jtb.villageid
        GROUP BY jtb.transactionid
      ) vs ON vs.transactionid = d.id
      LEFT JOIN (
        SELECT di.id,
               ARRAY_AGG(di.url) AS images
        FROM public.tbdormantalimage di
        GROUP BY di.id
      ) img ON img.id = d.id
      WHERE d.status = '1'
        AND ($1::varchar IS NULL OR d.districtid = $1::varchar)
        AND ($2::varchar IS NULL OR EXISTS (
          SELECT 1 FROM public.tb_join_villageid j
          WHERE j.transactionid = d.id AND j.villageid = $2::varchar
        ))
      ORDER BY d.cdate DESC
      LIMIT $3 OFFSET $4;
    `;

    let rows =
      (await dbExecution(query, [districtid, villageid, validLimit, offset]))
        ?.rows || [];

    // Map images to full URLs
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    const result = {
      dormantals: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    res.status(200).send({
      status: true,
      message: "Query data success",
      data: result,
    });
  } catch (error) {
    console.error(
      "Error in query_dormantal_data_by_district_or_villageid:",
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

export const query_dormantal_dataone = async (req, res) => {
  const id = req.body.id;

  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Missing dormantal id",
      data: [],
    });
  }

  try {
    const query = ` SELECT 
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
  d.cdate,
  d.moredetail,
  d.status,
  d.plan_on_next_month,
  p.province,
  dis.district,
  COALESCE(vs.villages, '{}') AS villages,
  COALESCE(img.images, '{}')   AS images
FROM public.tbdormantalroom d
INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid

LEFT JOIN (
  SELECT jtb.transactionid,
         ARRAY_AGG(DISTINCT v.village) AS villages
  FROM public.tb_join_villageid jtb
  JOIN public.tbvillage v ON v.villageid = jtb.villageid
  GROUP BY jtb.transactionid
) vs ON vs.transactionid = d.id

LEFT JOIN (
  SELECT di.id,
         ARRAY_AGG(di.url) AS images
  FROM public.tbdormantalimage di
  GROUP BY di.id
) img ON img.id = d.id

WHERE d.status = '1' and d.id=$1
ORDER BY d.cdate DESC
LIMIT 50;
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
    console.error("Error in query_dormantal_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const query_dormantal_data_by_districtid_and_area = async (req, res) => {
  try {
    const { districtid, area, page = 0, limit = 20 } = req.body;

    // Validate input
    if (!districtid || !area) {
      return res.status(400).send({
        status: false,
        message: "Missing district ID or area",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // Count total rows for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT d.id) AS total
      FROM public.tbdormantalroom d
      LEFT JOIN public.tb_join_villageid jtb ON jtb.transactionid = d.id
      LEFT JOIN public.tbvillage v ON v.villageid = jtb.villageid
      WHERE d.status = '1' 
        AND d.districtid = $1
        AND v.village ILIKE $2;
    `;
    const countResult = await dbExecution(countQuery, [
      districtid,
      `%${area}%`,
    ]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query with LIMIT and OFFSET
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
        d.cdate,
        d.moredetail,
        d.status,
        d.plan_on_next_month,
        p.province,
        dis.district,
        COALESCE(vs.villages, '{}') AS villages,
        COALESCE(img.images, '{}') AS images
      FROM public.tbdormantalroom d
      INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
      INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
      LEFT JOIN (
        SELECT jtb.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid jtb
        JOIN public.tbvillage v ON v.villageid = jtb.villageid
        WHERE v.village ILIKE $2
        GROUP BY jtb.transactionid
      ) vs ON vs.transactionid = d.id
      LEFT JOIN (
        SELECT di.id,
               ARRAY_AGG(di.url) AS images
        FROM public.tbdormantalimage di
        GROUP BY di.id
      ) img ON img.id = d.id
      WHERE d.status = '1' 
        AND d.districtid = $1
      ORDER BY d.cdate DESC
      LIMIT $3 OFFSET $4;
    `;

    const result = await dbExecution(query, [
      districtid,
      `%${area}%`,
      validLimit,
      offset,
    ]);
    let rows = result?.rows || [];

    // Map images to full URLs
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    const response = {
      dormantals: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    res.status(200).send({
      status: true,
      message: "Query data success",
      data: response,
    });
  } catch (error) {
    console.error(
      "Error in query_dormantal_data_by_districtid_and_area:",
      error
    );
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert data   // kho lawm

export const insert_dormantal_data = async (req, res) => {
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
    provinceid,
    districtid,
    villagelistid, // can be array, JSON-string, comma-separated string, or single id
  } = req.body;

  // simple required-field check
  if (!id || !type || !totalroom || !dormantalname) {
    return res.status(400).send({
      status: false,
      message:
        "Missing required fields: id, type, totalroom, dormantalname are required",
      data: null,
    });
  }

  // helper to normalize villagelistid into an array of ids
  const parseVillageList = (v) => {
    if (!v) return [];
    // already an array
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);

    // if submitted as JSON string like '["1","2"]' or '[1,2]'
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed)
            ? parsed.map((x) => String(x).trim()).filter(Boolean)
            : [];
        } catch (e) {
          // fallthrough to comma-split
        }
      }
      // comma separated "1,2,3"
      return trimmed
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }

    // fallback: single value
    return [String(v).trim()];
  };

  const imageFiles = req.files && req.files.length ? req.files : [];

  try {
    // START TRANSACTION
    await dbExecution("BEGIN", []);

    // 1) Insert images first (if any)
    if (imageFiles.length > 0) {
      const insertImageQuery = `INSERT INTO public.tbdormantalimage(id, url) VALUES ($1, $2)`;
      for (const file of imageFiles) {
        // file.filename assumed provided by multer
        if (!file || !file.filename) continue;
        await dbExecution(insertImageQuery, [id, file.filename]);
      }
    }

    // 2) Insert tb_join_villageid entries (one by one)
    const villageIds = parseVillageList(villagelistid);
    if (villageIds.length > 0) {
      // Use ON CONFLICT DO NOTHING to avoid duplicate errors if unique constraint exists.
      // If your table has no unique constraint, this still works but won't dedupe.
      const insertJoinQuery = `
        INSERT INTO public.tb_join_villageid(transactionid, villageid)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING *
      `;
      for (const vid of villageIds) {
        // skip empty values
        if (!vid) continue;
        await dbExecution(insertJoinQuery, [id, vid]);
      }
    }

    // 3) Insert the dormantal room record
    const queryRoom = `
      INSERT INTO public.tbdormantalroom(
        id, dormantalname, price1, price2, price3, type, totalroom, activeroom,
        locationvideo,tel, contactnumber, cdate, moredetail, provinceid, districtid, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),$12,$13,$14,$15
      ) RETURNING *
    `;
    const valuesRoom = [
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
      provinceid || null,
      districtid || null,
      "1",
    ];

    const resultRoom = await dbExecution(queryRoom, valuesRoom);

    // COMMIT
    await dbExecution("COMMIT", []);

    // success response
    if (resultRoom && resultRoom.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert dormantal data successful",
        data: resultRoom.rows,
      });
    } else {
      // unlikely, but handle gracefully
      return res.status(400).send({
        status: false,
        message: "Insert dormantal data failed",
        data: null,
      });
    }
  } catch (error) {
    // ROLLBACK on any error
    try {
      await dbExecution("ROLLBACK", []);
    } catch (rbErr) {
      console.error("Rollback failed:", rbErr);
    }
    console.error("Error in insert_dormantal_data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// kho lawm

export const Update_active_Status_dormantal_data = async (req, res) => {
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

export const Update_type_and_totalroom_and_active_room_dormantal_data = async (
  req,
  res
) => {
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

// kho lawm

export const Update_contactinform_and_detailinform_and_plan_in_next_month_dormantal_data =
  async (req, res) => {
    // done

    const { id, contactinform, detail, plan_in_next_month } = req.body;

    try {
      const query = `update public.tbdormantalroom set contactnumber=$1, moredetail=$2,plan_on_next_month=$3 where id=$4 RETURNING *`;

      let values = [contactinform, detail, plan_in_next_month, id];

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

export const Update_price_dormantal_data = async (req, res) => {
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

export const Update_view_number_of_this_id = async (req, res) => {
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

//router.post('/register',upload,register);

//exports.upload = multer({ storage: storage }).single('file')

//    var express = require('express');
//     var router = express.Router();
//     const {register,login} = require('../controller/register')
//     const {upload} = require('../middleware/upload')

//exports.register = async(req,res)=>{
// try {

/// <<<<========    nw yeej comment cia ua ntej no lawm.
//     const {email,fname,password}= req.body
//     const user = await User.findOne({where:{fname}})
//     if(user){ return res.send("Email already Exists !!!").status(400)
//     }   const salt= await bcrypt.genSalt(10)
//     const adduser = new User({ email, fname, password })
//     adduser.password = await bcrypt.hash(password,salt)

//    await adduser.save()    res.send("Register Success")     console.log(adduser)
/// =========>>>

//const data= req.body;
// if(req.file){
//   data.file= req.file.filenamek
// }
//console.log(data)
// const user=await Ownerstore({data})
//await user.save()
// res.send(user)
// } catch (error) {  console.log(error);  res.status(500).send("server error")  } },

// const {Ownerstore} = require('../config/db');
//const bcrypt= require('bcryptjs');
//const { where } = require('sequelize');
//const jwt = require('jsonwebtoken');
