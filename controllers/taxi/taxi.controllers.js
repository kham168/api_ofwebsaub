import { dbExecution } from "../../config/dbConfig.js";
 export const query_taxi_dataall = async (req, res) => {
  const { name = "", provinceid = "", districtid = "", villageid = "", page = 0, limit = 20 } = req.body;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = t.id
      WHERE t.status = '1'
        AND ($1 = '' OR t.name ILIKE $1)
        AND ($2 = '' OR t.provinceid::text ILIKE $2)
        AND ($3 = '' OR t.districtid::text ILIKE $3)
        AND ($4 = '' OR j.villageid::text ILIKE $4)
    `;
    const countValues = [`%${name}%`, `%${provinceid}%`, `%${districtid}%`, `%${villageid}%`];
    const countResult = await dbExecution(countQuery, countValues);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: { page: validPage, limit: validLimit, total, totalPages: 0 },
      });
    }

    // Main query with pagination
    const query = `
      SELECT t.id,
             t.name,
             t."Price1",
             t."Price2",
             t.tel,
             t.detail,
             t.cdate,
             t.status,
             t.provinceid,
             t.districtid,
             COALESCE(vs.villages, '{}') AS village,
             COALESCE(img.images, '{}') AS images
      FROM public.tbtaxi t
      LEFT JOIN (
        SELECT j.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid j
        JOIN public.tbvillage v ON v.villageid = j.villageid
        GROUP BY j.transactionid
      ) vs ON vs.transactionid = t.id
      LEFT JOIN (
        SELECT ti.id,
               ARRAY_AGG(ti.url) AS images
        FROM public.tbtaxiimage ti
        GROUP BY ti.id
      ) img ON img.id = t.id
      WHERE t.status = '1'
        AND ($1 = '' OR t.name ILIKE $1)
        AND ($2 = '' OR t.provinceid::text ILIKE $2)
        AND ($3 = '' OR t.districtid::text ILIKE $3)
        AND ($4 = '' OR vs.villages @> ARRAY[$4])
      ORDER BY t.id ASC
      LIMIT $5 OFFSET $6
    `;
    const queryValues = [...countValues, validLimit, offset];
    const result = await dbExecution(query, queryValues);

    // Map images to full URLs
    const rows = result.rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
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
export const search_taxi_data = async (req, res) => {
  const { name = "", provinceid = "", districtid = "", villageid = "", page = 0, limit = 20 } = req.body;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = t.id
      WHERE t.status = '1'
        AND ($1 = '' OR t.name ILIKE $1)
        AND ($2 = '' OR t.provinceid::text ILIKE $2)
        AND ($3 = '' OR t.districtid::text ILIKE $3)
        AND ($4 = '' OR j.villageid::text ILIKE $4)
    `;
    const countValues = [`%${name}%`, `%${provinceid}%`, `%${districtid}%`, `%${villageid}%`];
    const countResult = await dbExecution(countQuery, countValues);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: { page: validPage, limit: validLimit, total, totalPages: 0 },
      });
    }

    // Main query with pagination
    const query = `
      SELECT t.id,
             t.name,
             t."Price1",
             t."Price2",
             t.tel,
             t.detail,
             t.cdate,
             t.status,
             t.provinceid,
             t.districtid,
             COALESCE(vs.villages, '{}') AS village,
             COALESCE(img.images, '{}') AS images
      FROM public.tbtaxi t
      LEFT JOIN (
        SELECT j.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid j
        JOIN public.tbvillage v ON v.villageid = j.villageid
        GROUP BY j.transactionid
      ) vs ON vs.transactionid = t.id
      LEFT JOIN (
        SELECT ti.id,
               ARRAY_AGG(ti.url) AS images
        FROM public.tbtaxiimage ti
        GROUP BY ti.id
      ) img ON img.id = t.id
      WHERE t.status = '1'
        AND ($1 = '' OR t.name ILIKE $1)
        AND ($2 = '' OR t.provinceid::text ILIKE $2)
        AND ($3 = '' OR t.districtid::text ILIKE $3)
        AND ($4 = '' OR vs.villages @> ARRAY[$4])
      ORDER BY t.id ASC
      LIMIT $5 OFFSET $6
    `;
    const queryValues = [...countValues, validLimit, offset];
    const result = await dbExecution(query, queryValues);

    // Map images to full URLs
    const rows = result.rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
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
    console.error("Error in search_taxi_data:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: { page: validPage, limit: validLimit, total: 0, totalPages: 0 },
    });
  }
};


export const query_taxi_by_provinceid_and_districtid = async (req, res) => {
  const {
    provinceid = "",
    districtid = "",
    villageid = "",
    page = 0,
    limit = 20
  } = req.body;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = t.id
      WHERE t.status = '1'
        AND ($1 = '' OR t.provinceid::text = $1)
        AND ($2 = '' OR t.districtid::text = $2)
        AND ($3 = '' OR j.villageid::text = $3)
    `;
    const countValues = [provinceid, districtid, villageid];
    const countResult = await dbExecution(countQuery, countValues);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: { page: validPage, limit: validLimit, total, totalPages: 0 },
      });
    }

    // Main query with pagination
    const query = `
      SELECT t.id,
             t.name,
             t."Price1",
             t."Price2",
             t.tel,
             t.detail,
             t.cdate,
             t.status,
             t.provinceid,
             t.districtid,
             COALESCE(vs.villages, '{}') AS village,
             COALESCE(img.images, '{}') AS images
      FROM public.tbtaxi t
      LEFT JOIN (
        SELECT j.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid j
        JOIN public.tbvillage v ON v.villageid = j.villageid
        GROUP BY j.transactionid
      ) vs ON vs.transactionid = t.id
      LEFT JOIN (
        SELECT ti.id,
               ARRAY_AGG(ti.url) AS images
        FROM public.tbtaxiimage ti
        GROUP BY ti.id
      ) img ON img.id = t.id
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = t.id
      WHERE t.status = '1'
        AND ($1 = '' OR t.provinceid::text = $1)
        AND ($2 = '' OR t.districtid::text = $2)
        AND ($3 = '' OR vs.villages @> ARRAY[$3])
      ORDER BY t.id ASC
      LIMIT $4 OFFSET $5
    `;
    const queryValues = [provinceid, districtid, villageid, validLimit, offset];
    const result = await dbExecution(query, queryValues);

    // Map images to full URLs
    const rows = result.rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
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
    console.error("Error in query_taxi_by_provinceid_and_districtid:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: { page: validPage, limit: validLimit, total: 0, totalPages: 0 },
    });
  }
};

export const query_taxi_by_districtid_and_villageid = async (req, res) => {
  const {
    villageid = "",
    page = 0,
    limit = 20
  } = req.body;

  const validPage = Math.max(parseInt(page, 10), 0);
  const validLimit = Math.max(parseInt(limit, 10), 1);
  const offset = validPage * validLimit;
  const baseUrl = "http://localhost:5151/";

  try {
    // Count total matching records
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      LEFT JOIN (
        SELECT j.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid j
        JOIN public.tbvillage v ON v.villageid = j.villageid
        GROUP BY j.transactionid
      ) vs ON vs.transactionid = t.id
      WHERE t.status = '1'
        AND ($1 = '' OR $1 = ANY (vs.villages))
    `;
    const countResult = await dbExecution(countQuery, [villageid]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    if (total === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
        data: [],
        pagination: { page: validPage, limit: validLimit, total, totalPages: 0 },
      });
    }

    // Main query with pagination
    const query = `
      SELECT t.id,
             t.name,
             t."Price1",
             t."Price2",
             t.tel,
             t.detail,
             t.cdate,
             t.status,
             t.provinceid,
             t.districtid,
             COALESCE(vs.villages, '{}') AS village,
             COALESCE(img.images, '{}') AS images
      FROM public.tbtaxi t
      LEFT JOIN (
        SELECT j.transactionid,
               ARRAY_AGG(DISTINCT v.village) AS villages
        FROM public.tb_join_villageid j
        JOIN public.tbvillage v ON v.villageid = j.villageid
        GROUP BY j.transactionid
      ) vs ON vs.transactionid = t.id
      LEFT JOIN (
        SELECT ti.id,
               ARRAY_AGG(ti.url) AS images
        FROM public.tbtaxiimage ti
        GROUP BY ti.id
      ) img ON img.id = t.id
      WHERE t.status = '1'
        AND ($1 = '' OR $1 = ANY (vs.villages))
      ORDER BY t.id ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await dbExecution(query, [villageid, validLimit, offset]);

    const rows = result.rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
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
    console.error("Error in query_taxi_by_districtid_and_villageid:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
      pagination: { page: validPage, limit: validLimit, total: 0, totalPages: 0 },
    });
  }
};


 // query taxi data by id
export const query_taxi_dataone = async (req, res) => {
  const id = req.body.id;

  try {
    const query = `SELECT t.id,
       t.name,
       t."Price1",
       t."Price2",t.tel,
       t.detail,
       t.cdate,
       t.status,
       t.provinceid,
       t.districtid,
       COALESCE(vs.villages, '{}') AS village,
       COALESCE(img.images,  '{}') AS images
FROM public.tbtaxi t
LEFT JOIN (
  SELECT j.transactionid,
         ARRAY_AGG(DISTINCT v.village) AS villages
  FROM public.tb_join_villageid j
  JOIN public.tbvillage v ON v.villageid = j.villageid
  GROUP BY j.transactionid
) vs ON vs.transactionid = t.id
LEFT JOIN (
  SELECT ti.id,
         ARRAY_AGG(ti.url) AS images
  FROM public.tbtaxiimage ti
  GROUP BY ti.id
) img ON img.id = t.id
WHERE t.status = '1' and t.id= $1
ORDER BY t.id ASC
LIMIT 15;
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
  const { id, name, price1, price2,tel, detail, provinceid, districtid, villagelistid } = req.body;

  try {
    // 1️⃣ Insert images first
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const queryImage = `
          INSERT INTO public.tbtaxiimage(id, url) 
          VALUES ($1, $2)
        `;
        await dbExecution(queryImage, [id, file.filename]);
      }
    }

    // 2️⃣ Insert village joins — parse villagelistid inline
     const parseVillageList = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed)
            ? parsed.map(x => String(x).trim()).filter(Boolean)
            : [];
        } catch (e) {}
      }
      return trimmed.split(",").map(x => x.trim()).filter(Boolean);
    }
    return [String(v).trim()];
  };
 
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

    // 3️⃣ Insert main taxi data
    const query = `
      INSERT INTO public.tbtaxi(
        id, name, "Price1", "Price2", tel, detail, provinceid, 
	districtid, status, cdate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `;
    const values = [id, name, price1, price2,tel, detail, provinceid, districtid,'1'];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert data successful",
        data: resultSingle.rows,
      });
    }

    return res.status(400).send({
      status: false,
      message: "Insert data failed",
      data: null,
    });

  } catch (error) {
    console.error("Error in insert_taxi_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
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



