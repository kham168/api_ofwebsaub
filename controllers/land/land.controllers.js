import { dbExecution } from "../../config/dbConfig.js";
 
  


  export const query_land_dataall = async (req, res) => {
  try {
    const { page = 0, limit = 20 } = req.body;

    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // Count total records for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) AS total
      FROM public.tbland l
      WHERE l.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query with LIMIT and OFFSET
    const query = `
      SELECT 
        l.id,
        l.ownername,
        l.productname,
        l.area,
        l.price,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.tel,
        l.moredetail,
        l.status,
        l.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT li.url) FILTER (WHERE li.url IS NOT NULL), '{}') AS images
      FROM public.tbland l
      LEFT JOIN public.tbprovince p ON p.provinceid = l.provinceid
      LEFT JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = l.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tblandimage li ON li.id = l.id
      WHERE l.status = '1'
      GROUP BY
        l.id, l.ownername, l.productname, l.area, l.price,
        l.contactnumber, l.locationurl, l.locationvideo, l.tel, l.moredetail,
        l.status, l.cdate, p.province, d.district
      ORDER BY l.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(query, [validLimit, offset]);
    let rows = result?.rows || [];

    // Map images to full URLs
    rows = rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
    }));

    const response = {
      lands: rows,
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
      data: response,
    });
  } catch (error) {
    console.error("Error in query_land_dataall:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};


// kho lawm

export const query_land_dataone = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `
   SELECT 
  l.id,
  l.ownername,
  l.productname,
  l.area,
  l.price,
  l.contactnumber,
  l.locationurl,
  l.locationvideo,
  l.tel,
  l.moredetail,
  l.status,
  l.cdate,
  p.province,
  d.district,
  COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
  COALESCE(ARRAY_AGG(DISTINCT li.url)    FILTER (WHERE li.url IS NOT NULL),    '{}') AS images
FROM public.tbland l
LEFT JOIN public.tbprovince p ON p.provinceid = l.provinceid
LEFT JOIN public.tbdistrict d ON d.districtid = l.districtid
LEFT JOIN public.tb_join_villageid j ON j.transactionid = l.id
LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
LEFT JOIN public.tblandimage li ON li.id = l.id
WHERE l.id=$1
GROUP BY
  l.id, l.ownername, l.productname, l.area, l.price,
  l.contactnumber, l.locationurl, l.locationvideo,l.tel, l.moredetail,
  l.status, l.cdate, p.province, d.district
ORDER BY l.cdate DESC
LIMIT 50;
    `;

    const result = await dbExecution(query, [id]);

    if (result && result.rowCount > 0) {
      res.status(200).send({
        status: true,
        message: "Query data successful",
        data: result.rows,
      });
    } else {
      res.status(404).send({
        status: false,
        message: "No record found with the given ID",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in query_land_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};




export const query_land_data_by_province_and_districtid = async (req, res) => {
  try {
    const { provinceid, districtid, page = 0, limit = 20 } = req.body;

    if (!provinceid || !districtid) {
      return res.status(400).send({
        status: false,
        message: "Missing province ID or district ID",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // Count total records for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) AS total
      FROM public.tbland l
      LEFT JOIN public.tbdistrict d ON d.districtid = l.districtid
      WHERE l.status = '1' AND l.provinceid = $1 AND d.districtid = $2;
    `;
    const countResult = await dbExecution(countQuery, [provinceid, districtid]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query with LIMIT and OFFSET
    const query = `
      SELECT 
        l.id,
        l.ownername,
        l.productname,
        l.area,
        l.price,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.tel,
        l.moredetail,
        l.status,
        l.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT li.url) FILTER (WHERE li.url IS NOT NULL), '{}') AS images
      FROM public.tbland l
      LEFT JOIN public.tbprovince p ON p.provinceid = l.provinceid
      LEFT JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = l.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tblandimage li ON li.id = l.id
      WHERE l.status = '1' AND l.provinceid = $1 AND d.districtid = $2
      GROUP BY
        l.id, l.ownername, l.productname, l.area, l.price,
        l.contactnumber, l.locationurl, l.locationvideo, l.tel, l.moredetail,
        l.status, l.cdate, p.province, d.district
      ORDER BY l.cdate DESC
      LIMIT $3 OFFSET $4;
    `;

    const result = await dbExecution(query, [provinceid, districtid, validLimit, offset]);
    let rows = result?.rows || [];

    // Map images to full URLs
    rows = rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
    }));

    const response = {
      lands: rows,
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
      data: response,
    });
  } catch (error) {
    console.error("Error in query_land_data_by_province_and_districtid:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};




 export const query_land_data_by_district_and_villageid = async (req, res) => {
  try {
    const { districtid, villageid, page = 0, limit = 20 } = req.body;

    if (!districtid || !villageid) {
      return res.status(400).send({
        status: false,
        message: "Missing district ID or village ID",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // Count total records for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) AS total
      FROM public.tbland l
      LEFT JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = l.id
      WHERE l.status = '1' AND d.districtid = $1 AND j.villageid = $2;
    `;
    const countResult = await dbExecution(countQuery, [districtid, villageid]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query with LIMIT and OFFSET
    const query = `
      SELECT 
        l.id,
        l.ownername,
        l.productname,
        l.area,
        l.price,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.tel,
        l.moredetail,
        l.status,
        l.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT li.url) FILTER (WHERE li.url IS NOT NULL), '{}') AS images
      FROM public.tbland l
      LEFT JOIN public.tbprovince p ON p.provinceid = l.provinceid
      LEFT JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = l.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tblandimage li ON li.id = l.id
      WHERE l.status = '1' AND d.districtid = $1 AND j.villageid = $2
      GROUP BY
        l.id, l.ownername, l.productname, l.area, l.price,
        l.contactnumber, l.locationurl, l.locationvideo, l.tel, l.moredetail,
        l.status, l.cdate, p.province, d.district
      ORDER BY l.cdate DESC
      LIMIT $3 OFFSET $4;
    `;

    const result = await dbExecution(query, [districtid, villageid, validLimit, offset]);
    let rows = result?.rows || [];

    // Map images to full URLs
    rows = rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
    }));

    const response = {
      lands: rows,
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
      data: response,
    });
  } catch (error) {
    console.error("Error in query_land_data_by_district_and_villageid:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};


export const query_land_data_by_district_or_arean = async (req, res) => {
  try {
    const { districtid, area, page = 0, limit = 20 } = req.body;

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

    // Count total records for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) AS total
      FROM public.tbland l
      LEFT JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = l.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      WHERE l.status = '1' AND d.districtid = $1 AND v.arean ILIKE $2;
    `;
    const countResult = await dbExecution(countQuery, [districtid, `%${area}%`]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query with LIMIT and OFFSET
    const query = `
      SELECT 
        l.id,
        l.ownername,
        l.productname,
        l.area,
        l.price,
        l.tel,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.moredetail,
        l.status,
        l.cdate,
        p.province,
        d.district,
        COALESCE(ARRAY_AGG(DISTINCT v.arean) FILTER (WHERE v.arean IS NOT NULL), '{}') AS villages,
        COALESCE(ARRAY_AGG(DISTINCT li.url) FILTER (WHERE li.url IS NOT NULL), '{}') AS images
      FROM public.tbland l
      LEFT JOIN public.tbprovince p ON p.provinceid = l.provinceid
      LEFT JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tb_join_villageid j ON j.transactionid = l.id
      LEFT JOIN public.tbvillage v ON v.villageid = j.villageid
      LEFT JOIN public.tblandimage li ON li.id = l.id
      WHERE l.status = '1' AND d.districtid = $1 AND v.arean ILIKE $2
      GROUP BY
        l.id, l.ownername, l.productname, l.area, l.price,
        l.contactnumber, l.locationurl, l.locationvideo, l.tel, l.moredetail,
        l.status, l.cdate, p.province, d.district
      ORDER BY l.cdate DESC
      LIMIT $3 OFFSET $4;
    `;

    const result = await dbExecution(query, [districtid, `%${area}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // Map images to full URLs
    rows = rows.map(r => ({
      ...r,
      images: r.images.map(img => baseUrl + img),
    }));

    const response = {
      lands: rows,
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
      data: response,
    });
  } catch (error) {
    console.error("Error in query_land_data_by_district_or_arean:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};
 

  // insert data //    kho lawm
export const insert_land_data = async (req, res) => {
  const {
    id, ownername, productname, area, price, tel,contactnumber,
    locationurl, locationvideo, moredetail,
    provinceid, districtid, villagelistid
  } = req.body;

  // helper to normalize villagelistid into an array
  const parseVillageList = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed.map(x => String(x).trim()).filter(Boolean) : [];
        } catch {}
      }
      return trimmed.split(",").map(x => x.trim()).filter(Boolean);
    }
    return [String(v).trim()];
  };

  const imageFiles = (req.files && req.files.length) ? req.files : [];

  try {
    await dbExecution("BEGIN", []);

    // 1) Insert images first
    if (imageFiles.length > 0) {
      const insertImageQuery = `
        INSERT INTO public.tblandimage(id, url)
        VALUES ($1, $2)
      `;
      for (const file of imageFiles) {
        if (!file?.filename) continue;
        await dbExecution(insertImageQuery, [id, file.filename]);
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

    // 3) Insert land info
    const landQuery = `
      INSERT INTO public.tbland(
        id, ownername, productname, area, price, tel, contactnumber,
        locationurl, locationvideo, moredetail,
        status, cdate, provinceid, districtid
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),$12,$13)
      RETURNING *;
    `;
 
    const landValues = [
      id, ownername, productname, area, price,tel, contactnumber,
      locationurl, locationvideo, moredetail,
      '1', provinceid, districtid
    ];
    const landResult = await dbExecution(landQuery, landValues);

    if (!landResult || landResult.rowCount === 0) {
      await dbExecution("ROLLBACK", []);
      return res.status(400).send({ status: false, message: "Insert tbland failed" });
    }

    await dbExecution("COMMIT", []);

    return res.status(200).send({
      status: true,
      message: "Insert land successful",
      data: landResult.rows,
    });

  } catch (error) {
    await dbExecution("ROLLBACK", []);
    console.error("Error in insert_land_data:", error);
    res.status(500).send("Internal Server Error");
  }
};


///kho lawm
  
export const update_active_status_land_data = async (req, res) => {
  const { id, ownername, status } = req.body;

  try {
    const query = `
      UPDATE public.tbland
      SET status = $1
      WHERE id = $2 AND ownername = $3
      RETURNING *;
    `;

    const values = [status, id, ownername];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(404).send({
        status: false,
        message: "No record found to update",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in update_active_status_land_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};


  // kho lawm
export const update_side_and_price_land_data = async (req, res) => {
  const { id, ownername, side, price } = req.body;

  try {
    const query = `
      UPDATE public.tbland
      SET area = $1,
          price = $2
      WHERE id = $3 AND ownername = $4
      RETURNING *;
    `;

    const values = [side, price, id, ownername];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(404).send({
        status: false,
        message: "No record found to update",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in update_side_and_price_land_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// kho lawm
export const update_new_link_and_detail_land_data = async (req, res) => {
  const { id, ownername, new_link, detail } = req.body;

  try {
    const query = `
      UPDATE public.tbland
      SET locationurl = $1,
          moredetail = $2
      WHERE id = $3 AND ownername = $4
      RETURNING *;
    `;

    const values = [new_link, detail, id, ownername];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(404).send({
        status: false,
        message: "No record found to update",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in update_new_link_and_detail_land_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};
