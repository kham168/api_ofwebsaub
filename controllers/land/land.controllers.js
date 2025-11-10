import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

export const queryLandDataAll = async (req, res) => {
  try {
    //const { page = 0, limit = 20 } = req.params;

    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // ✅ Count total land records
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) AS total
      FROM public.tbland l
      WHERE l.status = '1';
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // ✅ Main land query with pagination
    const landQuery = `
      SELECT 
        l.id,
        l.productname,
        l.type,
        l.squaremeters,
        l.area,
        l.price,
        l.tel,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.moredetail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        l.image,
        l.cdate
      FROM public.tbland l
      INNER JOIN public.tbprovince p ON p.provinceid = l.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE l.status = '1'
      GROUP BY 
        l.id, l.productname,l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
        l.locationurl, l.locationvideo, l.moredetail, 
        p.province, d.district, l.image, l.cdate
      ORDER BY l.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    // const landResult = await dbExecution(landQuery, [validLimit, offset]);

    let rows = (await dbExecution(landQuery, [validLimit, offset]))?.rows || [];

    // ✅ Safely parse images from Postgres array
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

    // ✅ Pagination info
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
        const topResult = await QueryTopup.getAllProductB(); // must return data in JS object, not Express res
        topData = topResult?.data || topResult; // handle both formats
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    // ✅ Build combined response
    // const responseData = {
    //   data: rows,
    //   pagination,
    //   ...(validPage === 0 && { topData }), // only include if page === 0
    // };

    // // ✅ Send success response
    // res.status(200).send({
    //   status: true,
    //   message: rows.length > 0 ? "Query successful" : "No data found",
    //   data: responseData,
    // });

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
      ...(validPage === 0 && { topData }),
    });
  } catch (error) {
    console.error("Error in queryLandDataAll:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const queryLandDataOne = async (req, res) => {
  //const { id } = req.params;

  const id = req.query.id ?? 0;

  const baseUrl = "http://localhost:5151/";

  try {
    const query = `
      SELECT 
        l.id,
        l.productname,
        l.type,l.squaremeters, 
        l.area,
        l.price,
        l.tel,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.moredetail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        l.image,
        l.cdate
      FROM public.tbland l
      INNER JOIN public.tbprovince p ON p.provinceid = l.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE l.status = '1' AND l.id = $1
      GROUP BY 
        l.id, l.productname, l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
        l.locationurl, l.locationvideo, l.moredetail, 
        p.province, d.district, l.image, l.cdate
      ORDER BY l.cdate DESC;
    `;

    let rows = (await dbExecution(query, [id]))?.rows || [];

    // ✅ Safely parse images from Postgres array
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

    // ✅ Build combined response
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error in query_land_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const queryLandDataByDistrictId = async (req, res) => {
  try {
    //   const { districtId, page = 0, limit = 20 } = req.params;

    const districtId = req.query.districtId ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    if (!districtId) {
      return res.status(400).send({
        status: false,
        message: "Missing district ID",
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
      WHERE l.status = '1' AND l.districtid = $1;
    `;
    const countResult = await dbExecution(countQuery, [districtId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // Main query
    const query = `
      SELECT 
        l.id,
        l.productname,
        l.type,l.squaremeters, 
        l.area,
        l.price,
        l.tel,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.moredetail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        l.image,
        l.cdate
      FROM public.tbland l
      INNER JOIN public.tbprovince p ON p.provinceid = l.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE l.status = '1' AND l.districtid = $1
      GROUP BY 
        l.id, l.productname,l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
        l.locationurl, l.locationvideo, l.moredetail, 
        p.province, d.district, l.image, l.cdate
      ORDER BY l.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [districtId, validLimit, offset]);
    let rows = result?.rows || [];

    // ✅ Parse image arrays like before
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
    console.error("Error in query_land_data_by_districtid:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const queryLandDataByVillageId = async (req, res) => {
  try {
    //  const { villageId, page = 0, limit = 20 } = req.params;

    const villageId = req.query.villageId ?? 0;
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    if (!villageId) {
      return res.status(400).send({
        status: false,
        message: "Missing village ID",
        data: [],
      });
    }

    const validPage = Math.max(parseInt(page, 10), 0);
    const validLimit = Math.max(parseInt(limit, 10), 1);
    const offset = validPage * validLimit;
    const baseUrl = "http://localhost:5151/";

    // ✅ Count total records for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) AS total
      FROM public.tbland l
      WHERE l.status = '1'
      AND $1 = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[]);
    `;
    const countResult = await dbExecution(countQuery, [villageId]);
    const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

    // ✅ Main query with LIMIT and OFFSET
    const query = `
      SELECT 
        l.id,
        l.productname,
        l.type,l.squaremeters, 
        l.area,
        l.price,
        l.tel,
        l.contactnumber,
        l.locationurl,
        l.locationvideo,
        l.moredetail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        l.image,
        l.cdate
      FROM public.tbland l
      INNER JOIN public.tbprovince p ON p.provinceid = l.provinceid
      INNER JOIN public.tbdistrict d ON d.districtid = l.districtid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE l.status = '1'
      AND $1 = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[])
      GROUP BY 
        l.id, l.productname, l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
        l.locationurl, l.locationvideo, l.moredetail, 
        p.province, d.district, l.image, l.cdate
      ORDER BY l.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [villageId, validLimit, offset]);
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
    console.error("Error in query_land_data_by_villageid:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// insert data //    kho lawm
export const insertLandData = async (req, res) => {
  const {
    id,
    ownername,
    productname,
    type,
    squaremeters,
    area,
    price,
    tel,
    contactnumber,
    locationurl,
    locationvideo,
    moredetail,
    province,
    district,
    village,
  } = req.body;

  try {
    // ✅ Validate required fields
    if (!id || !ownername || !productname || !price || !tel) {
      return res.status(400).send({
        status: false,
        message: "Missing required fields",
        data: [],
      });
    }

    // 🏘️ Parse village into array
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
          } catch {
            // fallback if JSON.parse fails
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

    // 🖼️ Collect uploaded image filenames
    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename)
        : [];

    // ✅ Build SQL Query
    const query = `
      INSERT INTO public.tbland(
        id, ownername, productname, type, squaremeters, area, price, tel, contactnumber,
        locationurl, locationvideo, moredetail,
        province, district, village, image,
        status, cdate
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12,$13,$14, $15::text[], $16::text[],
        $17, NOW()
      )
      RETURNING *;
    `;

    const values = [
      id,
      ownername,
      productname,
      type,
      squaremeters,
      area,
      price,
      tel,
      contactnumber,
      locationurl,
      locationvideo,
      moredetail,
      province,
      district,
      villageArray, // array of villages
      imageArray, // array of images
      "1", // active status
    ];

    // ✅ Execute Insert
    const result = await dbExecution(query, values);

    if (result && result.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert land successful",
        data: result.rows,
      });
    }

    return res.status(400).send({
      status: false,
      message: "Insert land failed",
      data: [],
    });
  } catch (error) {
    console.error("Error in insert_land_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

///kho lawm

export const updateActiveStatusLandData = async (req, res) => {
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
export const updateSideAndPriceLandData = async (req, res) => {
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
export const updateNewLinkAndDetailLandData = async (req, res) => {
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
