import { de } from "date-fns/locale";
import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "./class.controller.js";

class searchDataAll {
  // Cream search  ID is 1

  SearchCreamData = async (detail, page, limit) => {
    try {
      detail = detail;
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      const safeDetail = (detail || "").trim();

      if (!safeDetail) {
        return {
          status: false,
          message: "Invalid or missing detail",
          data: [],
        };
      }

      // Count total
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbcream c
      WHERE c.status = '1' AND c.creamname ILIKE $1;
    `;
      const countResult = await dbExecution(countQuery, [`%${detail}%`]);
      const total = parseInt(countResult.rows[0]?.total || 0, 10);

      // Base URL for images + QR
      //  const baseUrl = "http://localhost:5151/";
      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // Query QR image
      const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '1' LIMIT 1;
    `;
      const qrResult = await dbExecution(qrQuery, []);
      const qrRaw = qrResult.rows[0]?.qr || null;
      const qr = qrRaw ? baseUrl + qrRaw : null;

      // Main search query
      const query = `
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
      AND c.creamname ILIKE $1
      ORDER BY c.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

      const result = await dbExecution(query, [
        `%${detail}%`,
        validLimit,
        offset,
      ]);
      let rows = result?.rows || [];

      // Format image URLs
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

      // Final response (with qrimage)
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  // Dormitory, ID is 2

  searchDormitoryDataByDistrictId = async (detail, dId, vId, page, limit) => {
    try {
      // ✅ sanitize & convert
      detail = detail;
      dId = dId;
      vId = vId;
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // 🧩 Validate input
      if (!dId) {
        return res.status(400).send({
          status: false,
          message: "Missing province or district ID",
          data: [],
        });
      }

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // 🧮 Count total
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM public.tbdormitory d
        WHERE d.status = '1' AND d.districtid = $1;
      `;
      const countResult = await dbExecution(countQuery, [detail, dId, vId]);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

      // 📦 Main query
      const query = `
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
          ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
        WHERE d.status = '1' AND d.districtid = $1
        GROUP BY 
         d.channel, d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
          d.totalroom, d.activeroom, d.locationvideo, d.tel, 
          d.contactnumber, d.moredetail,
          p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
        ORDER BY d.cdate DESC
        LIMIT $2 OFFSET $3;
      `;

      const result = await dbExecution(query, [
        detail,
        dId,
        vId,
        validLimit,
        offset,
      ]);
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

      // ✅ Send success response
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  searchDormitoryDataByVillageId = async (detail, dId, vId, page, limit) => {
    try {
      detail = detail;
      dId = dId;
      vId = vId;

      // ✅ sanitize & convert
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;
      // 🧩 Validate input
      if (!vId) {
        return res.status(400).send({
          status: false,
          message: "Missing district or village ID",
          data: [],
        });
      }

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // 🧮 Count query for pagination
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM public.tbdormitory d
        WHERE d.status = '1' 
          AND ($1::varchar IS NULL OR $1::int = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[]));
      `;
      const countResult = await dbExecution(countQuery, [detail, dId, vId]);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

      // 📦 Main query with joins
      const query = `
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
          ON v.villageid = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
        WHERE d.status = '1' AND $1 = ANY(string_to_array(replace(replace(d.villageid, '{', ''), '}', ''), ',')::int[])
        GROUP BY 
        d.channel,  d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
          d.totalroom, d.activeroom, d.locationvideo, d.tel, 
          d.contactnumber, d.moredetail,
          p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
        ORDER BY d.cdate DESC
        LIMIT $2 OFFSET $3;
      `;

      const result = await dbExecution(query, [
        detail,
        dId,
        vId,
        validLimit,
        offset,
      ]);
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  // house ID is 3

  searchHouseDataByDistrictId = async (detail, dId, vId, page, limit) => {
    detail = detail;
    dId = dId;
    vId = vId;
    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
    try {
      // Count total matching records
      const countQuery = `
        SELECT COUNT(DISTINCT h.id) AS total
        FROM public.tbhouse h
        WHERE h.status = '1'  
          AND h.districtid = $1
      `;
      const countResult = await dbExecution(countQuery, [detail, dId, vId]);
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
          ON v.villageid = ANY(string_to_array(replace(replace(h.villageid, '{', ''), '}', ''), ',')::int[])
        WHERE h.status = '1' AND h.districtid = $1
        GROUP BY 
         h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
          h.contactnumber, h.locationvideo, h.moredetail,
          p.province, d.district, h.image, h.cdate
        ORDER BY h.cdate DESC
        LIMIT $2 OFFSET $3;
      `;

      const result = await dbExecution(query, [
        detail,
        dId,
        vId,
        validLimit,
        offset,
      ]);
      let rows = result?.rows || [];

      // Map images to full URLs
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  searchHouseDataByVillageId = async (detail, dId, vId, page, limit) => {
    detail = detail;
    dId = dId;
    vId = vId;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
    try {
      // Count total matching records
      const countQuery = `
        SELECT COUNT(DISTINCT h.id) AS total
        FROM public.tbhouse h 
        WHERE h.status = '1'  
          AND $1 = ANY(string_to_array(replace(replace(h.villageid, '{', ''), '}', ''), ',')::int[]);
      `;
      const countResult = await dbExecution(countQuery, [detail, dId, vId]);
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
          ON v.villageid = ANY(string_to_array(replace(replace(h.villageid, '{', ''), '}', ''), ',')::int[])
        WHERE h.status = '1' 
          AND $1 = ANY(string_to_array(replace(replace(h.villageid, '{', ''), '}', ''), ',')::int[])
        GROUP BY 
         h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
          h.contactnumber, h.locationvideo, h.moredetail,
          p.province, d.district, h.image, h.cdate
        ORDER BY h.cdate DESC
        LIMIT $2 OFFSET $3;
      `;

      const result = await dbExecution(query, [
        detail,
        dId,
        vId,
        validLimit,
        offset,
      ]);
      let rows = result?.rows || [];

      // Map images to full URLs
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  // khoom khotsheb ID is 4

  searchOtherServiceDataAll = async (detail, dId, vId, page, limit) => {
    try {
      detail = detail;
      dId = dId;
      vId = vId;

      // ✅ sanitize & convert
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // ✅ Validate name
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).send({
          status: false,
          aaa: name,
          message: "Invalid or missing name",
          data: [],
        });
      }

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      // ✅ Count total matches (for pagination)
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbkhoomkhotsheb
      WHERE status = '1' AND name ILIKE $1;
    `;
      const countResult = await dbExecution(countQuery, [
        `%${detail}%`,
        `%${dId}%`,
        `%${vId}%`,
      ]);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);
      const totalPages = Math.ceil(total / validLimit);

      // Query QR image
      const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '4' LIMIT 1;
    `;
      const qrResult = await dbExecution(qrQuery, []);
      const qrRaw = qrResult.rows[0]?.qr || null;
      const qr = qrRaw ? baseUrl + qrRaw : null;

      // ✅ Fetch paginated matching data
      const query = `
      SELECT 
       channel, id,type,
        name,
        price1,
        price2,
        tel,
        detail,
        locationgps,
        image,
        donation
      FROM public.tbkhoomkhotsheb
      WHERE status = '1' AND name ILIKE $1
      ORDER BY cdate DESC
      LIMIT $2 OFFSET $3;
    `;

      let rows =
        (
          await dbExecution(query, [
            `%${detail}%`,
            `%${dId}%`,
            `%${vId}%`,
            validLimit,
            offset,
          ])
        )?.rows || [];

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

      // ✅ Send final response
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  // Land ID is 5

  searchLandDataByDistrictId = async (dId, vId, page, limit) => {
    try {
      dId = dId;
      vId = vId;

      if (!dId) {
        return res.status(400).send({
          status: false,
          message: "Missing district ID",
          data: [],
        });
      }

      const validPage = Math.max(parseInt(page, 10), 0);
      const validLimit = Math.max(parseInt(limit, 10), 1);
      const offset = validPage * validLimit;

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // Count total records for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT l.id) AS total
        FROM public.tbland l 
        WHERE l.status = '1' AND l.districtid = $1;
      `;
      const countResult = await dbExecution(countQuery, [dId, vId]);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

      // Main query
      const query = `
        SELECT 
        l.channel, l.id,
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
         l.channel, l.id, l.productname,l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
          l.locationurl, l.locationvideo, l.moredetail, 
          p.province, d.district, l.image, l.cdate
        ORDER BY l.cdate DESC
        LIMIT $2 OFFSET $3;
      `;

      const result = await dbExecution(query, [dId, vId, validLimit, offset]);
      let rows = result?.rows || [];

      // ✅ Parse image arrays like before
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  searchLandDataByVillageId = async (dId, vId, page, limit) => {
    try {
      dId = dId;
      vId = vId;

      if (!vId) {
        return res.status(400).send({
          status: false,
          message: "Missing village ID",
          data: [],
        });
      }

      const validPage = Math.max(parseInt(page, 10), 0);
      const validLimit = Math.max(parseInt(limit, 10), 1);
      const offset = validPage * validLimit;

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // ✅ Count total records for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT l.id) AS total
        FROM public.tbland l
        WHERE l.status = '1'
        AND $1 = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[]);
      `;
      const countResult = await dbExecution(countQuery, [dId, vId]);
      const total = parseInt(countResult?.rows?.[0]?.total || "0", 10);

      // ✅ Main query with LIMIT and OFFSET
      const query = `
        SELECT 
        l.channel, l.id,
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
         l.channel, l.id, l.productname, l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
          l.locationurl, l.locationvideo, l.moredetail, 
          p.province, d.district, l.image, l.cdate
        ORDER BY l.cdate DESC
        LIMIT $2 OFFSET $3;
      `;

      const result = await dbExecution(query, [dId, vId, validLimit, offset]);
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  // tshsuaj ID is 6

  searchTshuajData = async (detail, dId, vId, page, limit) => {
    try {
      detail = detail;
      dId = dId;
      vId = vId;

      // ✅ sanitize & convert
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // Count total results first
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM public.tbtshuaj t
        WHERE t.status = '1' AND t.name ILIKE $1;
      `;
      const countResult = await dbExecution(countQuery, [
        `%${detail}%`,
        `%${dId}%`,
        `%${vId}%`,
      ]);
      const total = parseInt(countResult.rows[0]?.total || 0, 10);
      const totalPages = Math.ceil(total / validLimit);

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // Query QR image
      const qrQuery = `
        SELECT qr FROM public.tbchanneldetail 
        WHERE id = '6' LIMIT 1;
      `;
      const qrResult = await dbExecution(qrQuery, []);
      const qrRaw = qrResult.rows[0]?.qr || null;
      const qr = qrRaw ? baseUrl + qrRaw : null;

      // Query paginated search results
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
        WHERE t.status = '1' AND t.name ILIKE $1
        ORDER BY t.cdate DESC
        LIMIT $2 OFFSET $3;
      `;

      let rows =
        (
          await dbExecution(dataQuery, [
            `%${detail}%`,
            `%${dId}%`,
            ,
            `%${vId}%`,
            validLimit,
            offset,
          ])
        )?.rows || [];

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

      // ✅ Send final response
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  // Taxi ID is 7

  searchTaxiData = async (detail, dId, vId, page, limit) => {
    detail = detail;
    dId = dId;
    vId = vId;

    // ✅ sanitize & convert
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
    try {
      // ✅ Count total matching records (with ILIKE for case-insensitive search)
      const countQuery = `
      SELECT COUNT(DISTINCT t.id) AS total
      FROM public.tbtaxi t
      WHERE t.status = '1'
      AND t.name ILIKE $1
    `;
      const countValues = [`%${detail}%`, `%${dId}%`, `%${vId}%`];
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
        ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE t.status = '1' and t.name ILIKE $1
      GROUP BY 
       t.channel, t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT $2 OFFSET $3;
    `;
      // const queryValues = [`%${name}%`, validLimit, offset];
      const result = await dbExecution(query, [
        `%${detail}%`,
        `%${dId}%`,
        `%${vId}%`,
        validLimit,
        offset,
      ]);
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
        //...(validPage === 0 && channelData ? { ...channelData, topData } : {}),
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
        // channelData: null,
        //  topData: null,
      };
    }
  };

  // Clean image array from PostgreSQL (handles all bad formats)
  async cleanImageArray(dbValue) {
    if (!dbValue) return [];

    let str = dbValue;

    // Convert array to string if needed
    if (Array.isArray(str)) {
      str = str.join(",");
    }

    // Remove { } and all quotes inside
    str = str.replace(/[{}"]/g, "");

    // Split into array
    const arr = str
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    return arr;
  }
}

export const searchAllData = new searchDataAll();
