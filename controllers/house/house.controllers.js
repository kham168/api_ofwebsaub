import { dbExecution } from "../../config/dbConfig.js";

export const insert_house_data = async (req, res) => {
  const {
    id,
    housename,
    price1,
    price2,
    price3,
    tel,
    contactnumber,
    locationvideo,
    moredetail,
    provinceid,
    districtid,
    villagelistid,
  } = req.body;

  // normalize village list
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
        } catch (e) {}
      }
      return trimmed
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return [String(v).trim()];
  };

  // Multer files
  const imageFiles = Array.isArray(req.files) ? req.files : [];

  try {
    await dbExecution("BEGIN");

    // 1) Insert images (2,3,4… no problem)
    if (imageFiles.length > 0) {
      const insertImageQuery = `
        INSERT INTO public.tbhouseimage(id, url)
        VALUES ($1, $2)
      `;
      for (const file of imageFiles) {
        if (!file || !file.filename) continue;
        // save filename or path
        await dbExecution(insertImageQuery, [id, file.filename]);
        console.log("Inserted image:", file.filename);
      }
    }

    // 2) Insert village joins
    const villageIds = parseVillageList(villagelistid);
    if (villageIds.length > 0) {
      const insertJoinQuery = `
        INSERT INTO public.tb_join_villageid(transactionid, villageid)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `;
      for (const vid of villageIds) {
        if (!vid) continue;
        await dbExecution(insertJoinQuery, [id, vid]);
      }
    }

    // 3) Insert house
    const queryHouse = `
      INSERT INTO public.tbhouse(
        id, housename, price1, price2, price3,tel, contactnumber, locationvideo,
        status, moredetail, cdate, provinceid, districtid
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '1',$9, NOW(), $10, $11)
      RETURNING *
    `;

    const valuesHouse = [
      id,
      housename,
      price1,
      price2,
      price3,
      tel,
      contactnumber,
      locationvideo,
      moredetail,
      provinceid,
      districtid,
    ];
    const resultHouse = await dbExecution(queryHouse, valuesHouse);

    await dbExecution("COMMIT");

    return res.status(200).send({
      status: true,
      message: "insert data successful",
      data: resultHouse.rows,
    });
  } catch (error) {
    await dbExecution("ROLLBACK");
    console.error("Error in insert_house_data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const query_house_dataall = async (req, res) => {
  try {
    const { page = 0, limit = 20 } = req.body;

    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // Count total records for pagination
    const countQuery = `SELECT COUNT(DISTINCT h.id) AS total
      FROM public.tbhouse h
      WHERE h.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query with LIMIT and OFFSET
    const query = `
      SELECT 
        h.id,
        h.housename,
        h.price1,
        h.price2,
        h.price3,
        h.tel,
        h.contactnumber,
        h.locationvideo,
        h.status,
        h.moredetail,
        h.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT hi.url) FILTER (WHERE hi.url IS NOT NULL), '{}') AS images
      FROM public.tbhouse h
      INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = h.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tbhouseimage hi ON hi.id = h.id
      WHERE h.status = '1'
      GROUP BY 
        h.id, h.housename, h.price1, h.price2, h.price3, h.tel, h.contactnumber,
        h.locationvideo, h.status, h.moredetail, h.cdate,
        p.province, d.district
      ORDER BY h.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(query, [validLimit, offset]);
    let rows = result?.rows || [];

    // Map images to full URLs
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    const response = {
      houses: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    return res.status(200).json({
      status: rows.length > 0,
      message: rows.length > 0 ? "Query data successful" : "No data found",
      data: response,
    });
  } catch (error) {
    console.error("Error in query_house_dataall:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// search by name

export const search_house_data = async (req, res) => {
  try {
    const { name = "", page = 0, limit = 20 } = req.body;
    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // Count total matching records
    const countQuery = `SELECT COUNT(DISTINCT h.id) AS total
      FROM public.tbhouse h
      WHERE h.status = '1' AND h.housename ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query
    const query = `
      SELECT 
        h.id,
        h.housename,
        h.price1,
        h.price2,
        h.price3,
        h.tel,
        h.contactnumber,
        h.locationvideo,
        h.status,
        h.moredetail,
        h.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT hi.url) FILTER (WHERE hi.url IS NOT NULL), '{}') AS images
      FROM public.tbhouse h
      INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = h.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tbhouseimage hi ON hi.id = h.id
      WHERE h.status = '1' AND h.housename ILIKE $1
      GROUP BY 
        h.id, h.housename, h.price1, h.price2, h.price3, h.tel, h.contactnumber,
        h.locationvideo, h.status, h.moredetail, h.cdate,
        p.province, d.district
      ORDER BY h.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [`%${name}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // Map images to full URLs
    rows = rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

    const response = {
      houses: rows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    return res.status(200).json({
      status: rows.length > 0,
      message: rows.length > 0 ? "Query data successful" : "No data found",
      data: response,
    });
  } catch (error) {
    console.error("Error in search_house_data:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// query by provice id and district id

export const query_house_data_byprovinceid_and_districtid = async (
  req,
  res
) => {
  const { provinceid, districtid, name = "", page = 0, limit = 20 } = req.body;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT h.id) AS total
      FROM public.tbhouse h
      WHERE h.status = '1' 
        AND h.provinceid = $1 
        AND h.districtid = $2 
        AND h.housename ILIKE $3
    `;
    const countResult = await dbExecution(countQuery, [
      provinceid,
      districtid,
      `%${name}%`,
    ]);
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

    // Main query with pagination
    const query = `
      SELECT 
        h.id,
        h.housename,
        h.price1,
        h.price2,
        h.price3,
        h.tel,
        h.contactnumber,
        h.locationvideo,
        h.status,
        h.moredetail,
        h.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT hi.url) FILTER (WHERE hi.url IS NOT NULL), '{}') AS images
      FROM public.tbhouse h
      INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = h.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tbhouseimage hi ON hi.id = h.id
      WHERE h.status = '1' 
        AND h.provinceid = $1 
        AND h.districtid = $2 
        AND h.housename ILIKE $3
      GROUP BY 
        h.id, h.housename, h.price1, h.price2, h.price3, h.tel, h.contactnumber,
        h.locationvideo, h.status, h.moredetail, h.cdate,
        p.province, d.district
      ORDER BY h.cdate DESC
      LIMIT $4 OFFSET $5
    `;

    const result = await dbExecution(query, [
      provinceid,
      districtid,
      `%${name}%`,
      validLimit,
      offset,
    ]);

    // Map images to full URLs
    const rows = result.rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

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
    console.error(
      "Error in query_house_data_byprovinceid_and_districtid:",
      error
    );
    return res.status(500).json({
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

// query by district id and village id
export const query_house_data_districtid_and_villageid = async (req, res) => {
  const { districtid, villageid, name = "", page = 0, limit = 20 } = req.body;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT h.id) AS total
      FROM public.tbhouse h
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = h.id
      WHERE h.status = '1' 
        AND h.districtid = $1 
        AND j.villageid = $2
        AND h.housename ILIKE $3
    `;
    const countResult = await dbExecution(countQuery, [
      districtid,
      villageid,
      `%${name}%`,
    ]);
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

    // Main query with pagination
    const query = `
      SELECT 
        h.id,
        h.housename,
        h.price1,
        h.price2,
        h.price3,
        h.tel,
        h.contactnumber,
        h.locationvideo,
        h.status,
        h.moredetail,
        h.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT hi.url) FILTER (WHERE hi.url IS NOT NULL), '{}') AS images
      FROM public.tbhouse h
      INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = h.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tbhouseimage hi ON hi.id = h.id
      WHERE h.status = '1' 
        AND h.districtid = $1 
        AND j.villageid = $2
        AND h.housename ILIKE $3
      GROUP BY 
        h.id, h.housename, h.price1, h.price2, h.price3, h.tel, h.contactnumber,
        h.locationvideo, h.status, h.moredetail, h.cdate,
        p.province, d.district
      ORDER BY h.cdate DESC
      LIMIT $4 OFFSET $5
    `;

    const result = await dbExecution(query, [
      districtid,
      villageid,
      `%${name}%`,
      validLimit,
      offset,
    ]);

    // Map images to full URLs
    const rows = result.rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

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
    console.error("Error in query_house_data_districtid_and_villageid:", error);
    return res.status(500).json({
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

// query by id

export const query_house_dataone = async (req, res) => {
  const id = req.body.id;

  try {
    const query = `SELECT 
  h.id,
  h.housename,
  h.price1,
  h.price2,
  h.price3,
  h.tel,
  h.contactnumber,
  h.locationvideo,
  h.status,
  h.moredetail,
  h.cdate,
  p.province,
  d.district,
  -- ✅ aggregate villages
  COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
  -- ✅ aggregate images
  COALESCE(ARRAY_AGG(DISTINCT hi.url) FILTER (WHERE hi.url IS NOT NULL), '{}') AS images
FROM public.tbhouse h
INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
LEFT JOIN public.tb_join_villageid j ON j.transactionid = h.id
LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
LEFT JOIN public.tbhouseimage hi ON hi.id = h.id
WHERE h.status = '1' and h.id=$1
GROUP BY 
  h.id, h.housename, h.price1, h.price2, h.price3,h.tel,h.contactnumber,
  h.locationvideo, h.status, h.moredetail, h.cdate,
  p.province, d.district
ORDER BY h.cdate DESC
LIMIT 50;
    `;

    const result = await dbExecution(query, [id]);

    if (result?.rows?.length) {
      return res.status(200).json({
        status: true,
        message: "Query data successful",
        data: result.rows,
      });
    }

    return res.status(404).json({
      status: false,
      message: "No data found",
      data: [],
    });
  } catch (error) {
    console.error("Error in query_house_dataone:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// query house data by district_or_arean_or_village
export const query_house_data_by_district_or_arean = async (req, res) => {
  const {
    province = "",
    district = "",
    arean = "",
    village = "",
    name = "",
    page = 0,
    limit = 20,
  } = req.body;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT h.id) AS total
      FROM public.tbhouse h
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = h.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
      WHERE h.status = '1'
        AND ($1 = '' OR p.province ILIKE $1)
        AND ($2 = '' OR d.district ILIKE $2)
        AND ($3 = '' OR v.arean ILIKE $3)
        AND ($4 = '' OR j.villageid::text ILIKE $4)
        AND ($5 = '' OR h.housename ILIKE $5)
    `;
    const countValues = [
      `%${province}%`,
      `%${district}%`,
      `%${arean}%`,
      `%${village}%`,
      `%${name}%`,
    ];
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

    // Main query with pagination
    const query = `
      SELECT 
        h.id,
        h.housename,
        h.price1,
        h.price2,
        h.price3,
        h.tel,
        h.contactnumber,
        h.locationvideo,
        h.status,
        h.moredetail,
        h.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT hi.url) FILTER (WHERE hi.url IS NOT NULL), '{}') AS images
      FROM public.tbhouse h
      INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = h.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tbhouseimage hi ON hi.id = h.id
      WHERE h.status = '1'
        AND ($1 = '' OR p.province ILIKE $1)
        AND ($2 = '' OR d.district ILIKE $2)
        AND ($3 = '' OR v.arean ILIKE $3)
        AND ($4 = '' OR j.villageid::text ILIKE $4)
        AND ($5 = '' OR h.housename ILIKE $5)
      GROUP BY 
        h.id, h.housename, h.price1, h.price2, h.price3, h.tel, h.contactnumber,
        h.locationvideo, h.status, h.moredetail, h.cdate,
        p.province, d.district
      ORDER BY h.cdate DESC
      LIMIT $6 OFFSET $7
    `;

    const queryValues = [...countValues, validLimit, offset];
    const result = await dbExecution(query, queryValues);

    // Map images to full URLs
    const rows = result.rows.map((r) => ({
      ...r,
      images: r.images.map((img) => baseUrl + img),
    }));

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
    console.error(
      "Error in query_house_data_by_district_or_arean_or_village:",
      error
    );
    return res.status(500).json({
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

export const update_active_status_house_data = async (req, res) => {
  // done
  const { id, status } = req.body;
  try {
    const query = `UPDATE public.tbhouse SET status=$1 WHERE id=$2 RETURNING *`;
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

export const update_price_house_data = async (req, res) => {
  // done

  const { id, price } = req.body;

  try {
    const query = `UPDATE public.tbhouse SET  price1=$1 WHERE id=$2 RETURNING *`;
    let values = [price, id];
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

export const update_location_and_detail_house_data = async (req, res) => {
  // done
  const { id, number, new_link, detail } = req.body;
  try {
    const query = `UPDATE public.tbhouse SET contactnumber=$1, locationvideo=$2, moredetail=$3 WHERE id=$4 RETURNING *`;
    let values = [number, new_link, detail, id];
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
