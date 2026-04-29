import { de } from "date-fns/locale";
import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "./class.controller.js";

class searchDataAll {
  // Cream search  ID is 1

  SearchCreamData = async (detail) => {
    try {
      detail = detail;

      const safeDetail = (detail || "").trim();

      if (!safeDetail) {
        return {
          status: false,
          message: "Invalid or missing detail",
          data: [],
        };
      }

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
      // Query QR image
      const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '1' LIMIT 1;
    `;
      const qrResult = await dbExecution(qrQuery, []);
      const qrRaw = qrResult.rows[0]?.qr || null;
      const qr = qrRaw ? baseUrl + qrRaw : null;

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
      LIMIT 30;
    `;

      const result = await dbExecution(query, [`%${detail}%`]);
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

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        qr: qr,
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  // Dormitory, ID is 2

  searchDormitoryData = async (detail, dId, vId) => {
    try {
      detail = detail;
      dId = dId;
      vId = vId;

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

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
          ON v.villageid = ANY(d.villageid)
        WHERE d.status = '1'
        AND d.dormantalname ILIKE $1
AND ($2::text IS NULL OR d.districtid = $2)
AND ($3::int IS NULL OR $3 = ANY(d.villageid)) -- ✅ FIX
        GROUP BY 
        d.channel,  d.id, d.dormantalname, d.price1, d.price2, d.price3, d.type,
          d.totalroom, d.activeroom, d.locationvideo, d.tel, 
          d.contactnumber, d.moredetail,
          p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
        ORDER BY d.cdate DESC
        LIMIT 50;
      `;

      const result = await dbExecution(query, [
        `%${detail}%`,
        dId ? String(dId) : null, // district = text
        vId ? parseInt(vId) : null,
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

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  // house ID is 3

  searchHouseData = async (detail, dId, vId) => {
    detail = detail;
    dId = dId;
    vId = vId;

    const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
    try {
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
  ON v.villageid = ANY(h.villageid) 
WHERE h.status = '1'
AND h.housename ILIKE $1
AND ($2::text IS NULL OR h.districtid = $2)
AND ($3::int IS NULL OR $3 = ANY(h.villageid)) -- ✅ FIX
GROUP BY h.channel, h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
  h.contactnumber, h.locationvideo, h.moredetail,
  p.province, d.district, h.image, h.cdate
ORDER BY h.cdate DESC
LIMIT 50;
      `;

      const result = await dbExecution(query, [
        `%${detail}%`,
        dId ? String(dId) : null, // district = text
        vId ? parseInt(vId) : null,
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

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  // khoom khotsheb ID is 4

  searchOtherService = async (detail, dId, vId) => {
    try {
      detail = detail;
      dId = dId;
      vId = vId;

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

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
      WHERE
status = '1'
AND name ILIKE $1
AND ($2::text IS NULL OR districtid = $2)
AND ($3::int IS NULL OR $3 = ANY(villageid))
      ORDER BY cdate DESC
      LIMIT 50;
    `;

      let rows =
        (
          await dbExecution(query, [
            `%${detail}%`, // ✔️ name
            dId ? String(dId) : null, // district = text
            vId ? parseInt(vId) : null,
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

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        qr: qr,
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  // Land ID is 5

  searchLandData = async (dId, vId) => {
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

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

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
          ON v.villageid = ANY(l.villageid)
        WHERE l.status = '1'
AND ($1::text IS NULL OR l.districtid = $1)
AND ($2::int IS NULL OR $2 = ANY(l.villageid))
        GROUP BY 
         l.channel, l.id, l.productname,l.type,l.squaremeters, l.area, l.price, l.tel, l.contactnumber, 
          l.locationurl, l.locationvideo, l.moredetail, 
          p.province, d.district, l.image, l.cdate
        ORDER BY l.cdate DESC
        LIMIT 50;
      `;

      const result = await dbExecution(query, [
        dId ? String(dId) : null, // district = text
        vId ? parseInt(vId) : null,
      ]);
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

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  // tshsuaj ID is 6

  searchTshuajData = async (detail) => {
    try {
      detail = detail;

      const baseUrl = "https://service.tsheb.la/" || process.env.BASE_URL;
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
        WHERE status = '1' AND name ILIKE $1
        ORDER BY cdate DESC
        LIMIT 30;
      `;

      let rows = (await dbExecution(dataQuery, [`%${detail}%`]))?.rows || [];

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

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        qr: qr,
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  // Taxi ID is 7

  searchTaxiData = async (detail, dId, vId) => {
    detail = detail;
    dId = dId;
    vId = vId;

    //  console.log("Received searchTaxiData with:", { detail, dId, vId }); return

    const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
    try {
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
      ON v.villageid = ANY(t.villageid)
WHERE t.status = '1'
AND t.name ILIKE $1
AND ($2::text IS NULL OR d.districtid = $2)
AND ($3::int IS NULL OR $3 = ANY(t.villageid)) -- ✅ FIX
      GROUP BY 
       t.channel, t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image
      ORDER BY t.id DESC
      LIMIT 50;
    `;
      // const queryValues = [`%${name}%`, validLimit, offset];
      const result = await dbExecution(query, [
        `%${detail}%`, // ✔️ name
        dId ? String(dId) : null, // district = text
        vId ? parseInt(vId) : null,
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
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
      };
    } catch (error) {
      console.error("Error in queryCreamDataAll:", error);
      console.log(error);
      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };
}

export const searchAllData = new searchDataAll();
