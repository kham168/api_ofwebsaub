import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "./class.controller.js";

class selectDataAll {
  //// Cream  ID is ==> 1

  queryCreamDataAll = async (page, limit) => {
    try {
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // Count total
      const countQuery = `
         SELECT COUNT(*) AS total
         FROM public.tbcream c
         WHERE c.status = '1';
       `;
      const countResult = await dbExecution(countQuery, []);
      const total = parseInt(countResult.rows[0]?.total || 0, 10);

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // ----------------------------------------
      // ✅ Query QR ONLY on first page
      // ----------------------------------------
      let channelData = null;
      let topData = null;

      if (validPage === 0) {
        const qrQuery = `
       SELECT qr,
         imageadvert,
         video1,
         video2,
         guidelinevideo
       FROM public.tbchanneldetail
       WHERE id = '1'
       LIMIT 1;
     `;

        const qrResult = await dbExecution(qrQuery, []);
        const raw = qrResult.rows[0] || null;

        if (raw) {
          // Helper: convert "a.png,b.png" → ["url/a.png", "url/b.png"]
          const convertToUrlArray = (str) => {
            if (!str) return [];
            return str
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => baseUrl + x);
          };

          channelData = {
            // Keep baseUrl for files stored on your server (QR and Images)
            qr: raw.qr ? baseUrl + raw.qr : null,
            imageadvert: raw.imageadvert ? baseUrl + raw.imageadvert : null,

            // No baseUrl for YouTube/External links
            video1: raw.video1 || null,
            video2: raw.video2 || null,
            guidelinevideo: raw.guidelinevideo || null,
          };
        }

        try {
          const topResult = await QueryTopData.getAllProductAData();
          topData = topResult?.topData || topResult;
        } catch (e) {
          console.warn("Failed to load top data:", e.message);
        }
      }

      // Fetch paginated cream data
      const dataQuery = `
         SELECT 
           c.channel,
           c.id,
           c.creamname,
           c.price1,
           c.price2,
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

      rows = await Promise.all(
        rows.map(async (r) => {
          const imgs = await QueryTopData.cleanImageArray(r.image);
          return {
            ...r,
            image: imgs.map((img) => baseUrl + img),
          };
        }),
      );

      // Pagination data
      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      };

      // Response
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
        ...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        channelData: null,
        topData: null,
      };
    }
  };

  /// dormentory id is ==> 2

  queryDormitoryDataAll = async (page, limit) => {
    try {
      // ✅ sanitize & convert
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // 🧮 Count total records
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM public.tbdormitory d
        WHERE d.status = '1';
      `;
      const countResult = await dbExecution(countQuery, []);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

      let channelData = null;
      let topData = null;
      // ----------------------------------------
      // ✅ Query QR + channel images ONLY on first page
      // ----------------------------------------

      if (validPage === 0) {
        const qrQuery = `
      SELECT qr,
        imageadvert,
        video1,
        video2,
        guidelinevideo
      FROM public.tbchanneldetail
      WHERE id = '2'
      LIMIT 1;
    `;

        const qrResult = await dbExecution(qrQuery, []);
        const raw = qrResult.rows[0] || null;

        if (raw) {
          // Helper: convert "a.png,b.png" → ["url/a.png", "url/b.png"]
          const convertToUrlArray = (str) => {
            if (!str) return [];
            return str
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => baseUrl + x);
          };

          channelData = {
            // Keep baseUrl for files stored on your server (QR and Images)
            qr: raw.qr ? baseUrl + raw.qr : null,
            imageadvert: raw.imageadvert ? baseUrl + raw.imageadvert : null,

            // No baseUrl for YouTube/External links
            video1: raw.video1 || null,
            video2: raw.video2 || null,
            guidelinevideo: raw.guidelinevideo || null,
          };
        }

        try {
          const topResult = await QueryTopData.getAllProductB();

          topData = topResult?.topData || topResult;
        } catch (e) {
          console.warn("Failed to load top data:", e.message);
        }
      }

      // 📦 Main query with pagination
      const dataQuery = `
        SELECT 
          d.channel,
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
          d.cdate
        FROM public.tbdormitory d
        INNER JOIN public.tbprovince p ON p.provinceid = d.provinceid
        INNER JOIN public.tbdistrict dis ON dis.districtid = d.districtid
        LEFT JOIN public.tbvillage v 
          ON v.villageid = ANY(d.villageid)
        WHERE d.status = '1'
        GROUP BY 
         d.channel, d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
          d.totalroom, d.activeroom, d.locationvideo, d.tel, 
          d.contactnumber, d.moredetail,
          p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
        ORDER BY d.cdate DESC
        LIMIT $1 OFFSET $2;
      `;

      const result = await dbExecution(dataQuery, [validLimit, offset]);
      let rows = result?.rows || [];

      // 🖼️ Map image URLs to full paths
      // 🖼️ Map image URLs to full paths
      rows = await Promise.all(
        rows.map(async (r) => {
          const imgs = await QueryTopData.cleanImageArray(r.image);

          return {
            ...r,
            image: imgs.map((img) => baseUrl + img),
          };
        }),
      );

      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      };

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
        ...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        channelData: null,
        topData: null,
      };
    }
  };

  // house id is ==> 3

  queryHouseDataAll = async (page, limit) => {
    try {
      // ✅ sanitize & convert
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // const baseUrl = "http://localhost:5151/";
      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // ✅ Count total records
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM public.tbhouse
        WHERE status = '1';
      `;
      const countResult = await dbExecution(countQuery, []);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

      let channelData = null;
      let topData = null;
      // ----------------------------------------
      // ✅ Query QR + channel images ONLY on first page
      // ----------------------------------------

      if (validPage === 0) {
        const qrQuery = `
      SELECT qr,
        imageadvert,
        video1,
        video2,
        guidelinevideo
      FROM public.tbchanneldetail
      WHERE id = '3'
      LIMIT 1;
    `;

        const qrResult = await dbExecution(qrQuery, []);
        const raw = qrResult.rows[0] || null;

        if (raw) {
          // Helper: convert "a.png,b.png" → ["url/a.png", "url/b.png"]
          const convertToUrlArray = (str) => {
            if (!str) return [];
            return str
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => baseUrl + x);
          };

          channelData = {
            // Keep baseUrl for files stored on your server (QR and Images)
            qr: raw.qr ? baseUrl + raw.qr : null,
            imageadvert: raw.imageadvert ? baseUrl + raw.imageadvert : null,

            // No baseUrl for YouTube/External links
            video1: raw.video1 || null,
            video2: raw.video2 || null,
            guidelinevideo: raw.guidelinevideo || null,
          };
        }

        try {
          const topResult = await QueryTopData.getAllProductB();

          topData = topResult?.topData || topResult;
        } catch (e) {
          console.warn("Failed to load top data:", e.message);
        }
      }

      // ✅ Main query
      const query = `
        SELECT 
          h.channel,
          h.id,
          h.housename,
          h.price1,
          h.price2,
          h.price3,
          h.tel,
          h.contactnumber,
          h.locationvideo,
          h.moredetail,
          p.province,
          d.district,
          ARRAY_AGG(v.village ORDER BY v.village) AS villages,
          h.image,
          h.cdate
        FROM public.tbhouse h
        INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
        INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
        LEFT JOIN public.tbvillage v 
          ON v.villageid = ANY(h.villageid)
        WHERE h.status = '1'
        GROUP BY 
        h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
          h.contactnumber, h.locationvideo, h.moredetail,
          p.province, d.district, h.image, h.cdate
        ORDER BY h.cdate DESC
        LIMIT $1 OFFSET $2;
      `;

      const result = await dbExecution(query, [validLimit, offset]);
      let rows = result?.rows || [];

      // ✅ Image parsing & full URLs
      rows = await Promise.all(
        rows.map(async (r) => {
          const imgs = await QueryTopData.cleanImageArray(r.image);

          return {
            ...r,
            image: imgs.map((img) => baseUrl + img),
          };
        }),
      );

      // ✅ If page === 0 → also call top data function

      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      };

      return {ເຮະ 
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
        ...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        channelData: null,
        topData: null,
      };
    }
  };

  // Other Service id is ==> 4

  queryOtherServiceDataAll = async (page, limit) => {
    try {
      // sanitize numbers
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      //const baseUrl = "http://localhost:5151/";
      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      // Count total
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM public.tbkhoomkhotsheb
        WHERE status = '1';
      `;
      const countResult = await dbExecution(countQuery, []);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);
      const totalPages = Math.ceil(total / validLimit);

      // Query QR image
      let channelData = null;
      let topData = null;

      if (validPage === 0) {
        const qrQuery = `
      SELECT qr,
        imageadvert,
        video1,
        video2,
        guidelinevideo
      FROM public.tbchanneldetail
      WHERE id = '4'
      LIMIT 1;
    `;

        const qrResult = await dbExecution(qrQuery, []);
        const raw = qrResult.rows[0] || null;

        if (raw) {
          // Helper: convert "a.png,b.png" → ["url/a.png", "url/b.png"]
          const convertToUrlArray = (str) => {
            if (!str) return [];
            return str
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => baseUrl + x);
          };

          channelData = {
            // Keep baseUrl for files stored on your server (QR and Images)
            qr: raw.qr ? baseUrl + raw.qr : null,
            imageadvert: raw.imageadvert ? baseUrl + raw.imageadvert : null,

            // No baseUrl for YouTube/External links
            video1: raw.video1 || null,
            video2: raw.video2 || null,
            guidelinevideo: raw.guidelinevideo || null,
          };
        }

        try {
          const topResult = await QueryTopData.getAllProductAData();
          topData = topResult?.topData || topResult;
        } catch (e) {
          console.warn("Failed to load top data:", e.message);
        }
      }
      // Query paginated data
      const query = `
        SELECT 
        channel, id,
          type,
          name,
          price1,
          price2,
          tel,
          detail,
          locationgps,
          image,
          donation
        FROM public.tbkhoomkhotsheb
        WHERE status = '1'
        ORDER BY cdate DESC
        LIMIT $1 OFFSET $2;
      `;

      let rows = (await dbExecution(query, [validLimit, offset]))?.rows || [];

      // Convert image array
      rows = await Promise.all(
        rows.map(async (r) => {
          const imgs = await QueryTopData.cleanImageArray(r.image);
          return {
            ...r,
            image: imgs.map((img) => baseUrl + img),
          };
        }),
      );

      // Pagination object
      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
      };

      // FINAL RESPONSE
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
        ...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        channelData: null,
        topData: null,
      };
    }
  };

  /// land id is ==> 5
  queryLandDataAll = async (page, limit) => {
    try {
      // ✅ sanitize & convert
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      // ✅ Count total land records
      const countQuery = `
        SELECT COUNT(DISTINCT l.id) AS total
        FROM public.tbland l
        WHERE l.status = '1';
      `;
      const countResult = await dbExecution(countQuery, []);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

      let channelData = null;
      let topData = null;
      // ----------------------------------------
      // ✅ Query QR + channel images ONLY on first page
      // ----------------------------------------

      if (validPage === 0) {
        const qrQuery = `
      SELECT qr,
         imageadvert,
        video1,
        video2,
        guidelinevideo
      FROM public.tbchanneldetail
      WHERE id = '5'
      LIMIT 1;
    `;

        const qrResult = await dbExecution(qrQuery, []);
        const raw = qrResult.rows[0] || null;

        if (raw) {
          // Helper: convert "a.png,b.png" → ["url/a.png", "url/b.png"]
          const convertToUrlArray = (str) => {
            if (!str) return [];
            return str
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => baseUrl + x);
          };

          channelData = {
            // Keep baseUrl for files stored on your server (QR and Images)
            qr: raw.qr ? baseUrl + raw.qr : null,
            imageadvert: raw.imageadvert ? baseUrl + raw.imageadvert : null,

            // No baseUrl for YouTube/External links
            video1: raw.video1 || null,
            video2: raw.video2 || null,
            guidelinevideo: raw.guidelinevideo || null,
          };
        }

        try {
          const topResult = await QueryTopData.getAllProductB();

          topData = topResult?.topData || topResult;
        } catch (e) {
          console.warn("Failed to load top data:", e.message);
        }
      }

      // ✅ Main land query with pagination
      const landQuery = `
        SELECT 
         l.channel, l.id,
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
          ON v.villageid = ANY(l.villageid)
        WHERE l.status = '1'
        GROUP BY 
        l.channel, l.id, l.productname,l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
          l.locationurl, l.locationvideo, l.moredetail, 
          p.province, d.district, l.image, l.cdate
        ORDER BY l.cdate DESC
        LIMIT $1 OFFSET $2;
      `;

      // const landResult = await dbExecution(landQuery, [validLimit, offset]);

      let rows =
        (await dbExecution(landQuery, [validLimit, offset]))?.rows || [];

      // ✅ Safely parse images from Postgres array
      rows = await Promise.all(
        rows.map(async (r) => {
          const imgs = await QueryTopData.cleanImageArray(r.image);

          return {
            ...r,
            image: imgs.map((img) => baseUrl + img),
          };
        }),
      );

      // ✅ Pagination info
      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      };

      // ✅ If page === 0 → also call top data function

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
        ...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        channelData: null,
        topData: null,
      };
    }
  };

  /// tshuaj id is ==> 6

  queryTshuajDataAll = async (page, limit) => {
    try {
      // ✅ sanitize & convert
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // Count total rows first
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbtshuaj t
      WHERE t.status = '1';
    `;

      const countResult = await dbExecution(countQuery, []);
      const total = parseInt(countResult.rows[0]?.total || 0, 10);
      const totalPages = Math.ceil(total / validLimit);

      // const baseUrl = "http://localhost:5151/";
      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // Query QR image
      // Query QR image
      let channelData = null;
      let topData = null;

      if (validPage === 0) {
        const qrQuery = `
    SELECT qr,
      imageadvert,
      video1,
      video2,
      guidelinevideo
    FROM public.tbchanneldetail
    WHERE id = '6'
    LIMIT 1;
  `;

        const qrResult = await dbExecution(qrQuery, []);
        const raw = qrResult.rows[0] || null;

        if (raw) {
          // Helper: convert "a.png,b.png" → ["url/a.png", "url/b.png"]
          const convertToUrlArray = (str) => {
            if (!str) return [];
            return str
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => baseUrl + x);
          };

          channelData = {
            // Keep baseUrl for files stored on your server (QR and Images)
            qr: raw.qr ? baseUrl + raw.qr : null,
            imageadvert: raw.imageadvert ? baseUrl + raw.imageadvert : null,

            // No baseUrl for YouTube/External links
            video1: raw.video1 || null,
            video2: raw.video2 || null,
            guidelinevideo: raw.guidelinevideo || null,
          };
        }

        try {
          const topResult = await QueryTopData.getAllProductAData();
          topData = topResult?.topData || topResult;
        } catch (e) {
          console.warn("Failed to load top data:", e.message);
        }
      }

      // Now get paginated results
      const dataQuery = `
      SELECT 
       t.channel,
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        t.donation,
        t.image
      FROM public.tbtshuaj t 
      WHERE t.status = '1'
      LIMIT $1 OFFSET $2;
    `;

      let rows =
        (await dbExecution(dataQuery, [validLimit, offset]))?.rows || [];

      // ✅ Safely parse images
      rows = await Promise.all(
        rows.map(async (r) => {
          const imgs = await QueryTopData.cleanImageArray(r.image);
          return {
            ...r,
            image: imgs.map((img) => baseUrl + img),
          };
        }),
      );

      // ✅ Send response
      // Unified API response
      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      };

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
        ...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        channelData: null,
        topData: null,
      };
    }
  };

  /// taxi id is ==> 7

  queryTaxiDataAll = async (page, limit) => {
    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    const baseUrl = "https://service.tsheb.la/" || process.env.BASE_URL;
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

      let channelData = null;
      let topData = null;
      // ----------------------------------------
      // ✅ Query QR + channel images ONLY on first page
      // ----------------------------------------

      if (validPage === 0) {
        const qrQuery = `
    SELECT qr,
      imageadvert,
      video1,
      video2,
      guidelinevideo
    FROM public.tbchanneldetail
    WHERE id = '7'
    LIMIT 1;
  `;

        const qrResult = await dbExecution(qrQuery, []);
        const raw = qrResult.rows[0] || null;

        if (raw) {
          // Helper: convert "a.png,b.png" → ["url/a.png", "url/b.png"]
          const convertToUrlArray = (str) => {
            if (!str) return [];
            return str
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .map((x) => baseUrl + x);
          };

          channelData = {
            // Keep baseUrl for files stored on your server (QR and Images)
            qr: raw.qr ? baseUrl + raw.qr : null,
            imageadvert: raw.imageadvert ? baseUrl + raw.imageadvert : null,

            // No baseUrl for YouTube/External links
            video1: raw.video1 || null,
            video2: raw.video2 || null,
            guidelinevideo: raw.guidelinevideo || null,
          };
        }

        try {
          const topResult = await QueryTopData.getAllProductB();

          topData = topResult?.topData || topResult;
        } catch (e) {
          console.warn("Failed to load top data:", e.message);
        }
      }

      // ✅ Fixed JOIN — cast text to integer array
      const query = `
      SELECT 
        t.channel,
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
        ON v.villageid = ANY(t.villageid)
      WHERE t.status = '1'
      GROUP BY 
       t.channel, t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $1 OFFSET $2;
    `;

      const result = await dbExecution(query, [validLimit, offset]);
      let rows = result?.rows || [];

      // ✅ Proper image parsing
      rows = await Promise.all(
        rows.map(async (r) => {
          const imgs = await QueryTopData.cleanImageArray(r.image);

          return {
            ...r,
            image: imgs.map((img) => baseUrl + img),
          };
        }),
      );

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

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
        ...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        channelData: null,
        topData: null,
      };
    }
  };
}

export const selectAllData = new selectDataAll();
