import { dbExecution } from "../../config/dbConfig.js";

class queryTopData {
  async getAllProductAData() {
    try {
      const baseUrl = "http://localhost:5151/";

      const tbcream = `
      SELECT 
        c.id,
        c.creamname AS name,
        c."Price1",
        c."Price2",
        c."Price3",
        c.tel,
        c.detail,
        c.donation,
        c.image,
        'cream/selectAll' AS path
      FROM public.tbcream c
      WHERE c.status = '1'
      ORDER BY c.cdate DESC
      LIMIT 1;
    `;

      const tbkhoomkhotsheb = `
      SELECT 
        id,
        name,
        "Price1",
        "Price2",
        tel,
        detail,
        donation,
        image,
        'khoomKhoTsheb/selectAll' AS path
      FROM public.tbkhoomkhotsheb
      WHERE status = '1'
      ORDER BY cdate DESC
      LIMIT 1;
    `;

      const tbmuas = `
      SELECT 
        m.id,
        m.name,
        m.price AS "Price1",
        NULL AS "Price2",
        NULL AS "Price3",
        m.tel,
        m.detail,
        m.donation,
        m.image,
        'muas/selectAll' AS path
      FROM public.tbmuas m
      WHERE m.status = '1'
      ORDER BY m.id DESC
      LIMIT 1;
    `;

      const tbtshuaj = `
      SELECT 
        t.id,
        t.name,
        t."Price1",
        t."Price2",
        t.tel,
        t.detail,
        t.donation,
        t.image,
        'tshuaj/selectAll' AS path
      FROM public.tbtshuaj t
      WHERE t.status = '1'
      ORDER BY t.id DESC
      LIMIT 1;
    `;

      // Execute all queries in parallel
      const [creamRes, khoomRes, muasRes, tshuajRes] = await Promise.all([
        dbExecution(tbcream, []),
        dbExecution(tbkhoomkhotsheb, []),
        dbExecution(tbmuas, []),
        dbExecution(tbtshuaj, []),
      ]);

      const formatImage = (rows) =>
        (rows || []).map((r) => ({
          ...r,
          image: r.image
            ? r.image
                .replace(/[{}]/g, "") // remove { and }
                .split(",")
                .map((img) => `${baseUrl}${img.trim()}`)
            : [],
        }));

      return {
        status: true,
        data: {
          Dormitory: formatImage(creamRes?.rows),
          House: formatImage(khoomRes?.rows),
          Land: formatImage(muasRes?.rows),
          Taxi: formatImage(tshuajRes?.rows),
        },
      };
    } catch (error) {
      console.error("Error in getAllProductAData:", error);
      throw error;
    }
  }

 


  async getAllProductB(req, res) {
    try {
      const baseUrl = "http://localhost:5151/";
      const limit = 1; // 🔹 Change to 2 if you want top 2 per category

      // 🏘️ 1. Dormitory
      const tbdormitory = `
        SELECT 
          d.id,
          d.dormantalname AS name,
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
          'dormitory/selectAll' AS path,
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
        LIMIT $1;
      `;

      // 🏠 2. House
      const tbhouse = `
        SELECT 
          h.id,
          h.housename AS name,
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
          'house/selectAll' AS path,
          h.cdate
        FROM public.tbhouse h
        INNER JOIN public.tbprovince p ON p.provinceid = h.provinceid
        INNER JOIN public.tbdistrict d ON d.districtid = h.districtid
        LEFT JOIN public.tbvillage v 
          ON v.villageid = ANY(string_to_array(replace(replace(h.villageid, '{', ''), '}', ''), ',')::int[])
        WHERE h.status = '1'
        GROUP BY 
          h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
          h.contactnumber, h.locationvideo, h.moredetail,
          p.province, d.district, h.image, h.cdate
        ORDER BY h.cdate DESC
        LIMIT $1;
      `;

      // 🏞️ 3. Land
      const tbland = `
        SELECT 
          l.id,
          l.productname AS name,
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
          'land/selectAll' AS path,
          l.cdate
        FROM public.tbland l
        INNER JOIN public.tbprovince p ON p.provinceid = l.provinceid
        INNER JOIN public.tbdistrict d ON d.districtid = l.districtid
        LEFT JOIN public.tbvillage v 
          ON v.villageid = ANY(string_to_array(replace(replace(l.villageid, '{', ''), '}', ''), ',')::int[])
        WHERE l.status = '1'
        GROUP BY 
          l.id, l.productname, l.area, l.price, l.tel, l.contactnumber, 
          l.locationurl, l.locationvideo, l.moredetail, 
          p.province, d.district, l.image, l.cdate
        ORDER BY l.cdate DESC
        LIMIT $1;
      `;

      // 🚕 4. Taxi
      const tbtaxi = `
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
          t.image,
          'taxi/selectAll' AS path,
          t.cdate
        FROM public.tbtaxi t
        INNER JOIN public.tbdistrict d ON d.districtid = t.districtid
        INNER JOIN public.tbprovince p ON p.provinceid = t.provinceid
        LEFT JOIN public.tbvillage v 
          ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
        WHERE t.status = '1'
        GROUP BY 
          t.id, t.name, t."Price1", t."Price2", t.tel, t.detail,
          p.province, d.district, t.image, t.cdate
        ORDER BY t.cdate DESC
        LIMIT $1;
      `;

      // ⚙️ Execute all queries in parallel
      const [dormitoryRes, houseRes, landRes, taxiRes] = await Promise.all([
        dbExecution(tbdormitory, [limit]),
        dbExecution(tbhouse, [limit]),
        dbExecution(tbland, [limit]),
        dbExecution(tbtaxi, [limit]),
      ]);

      const formatImage = (rows) =>
        (rows || []).map((r) => ({
          ...r,
          image: r.image
            ? r.image
                .replace(/[{}]/g, "") // remove { and }
                .split(",")
                .map((img) => `${baseUrl}${img.trim()}`)
            : [],
        }));

      return {
        status: true,
        data: {
          Dormitory: formatImage(dormitoryRes?.rows),
          House: formatImage(houseRes?.rows),
          Land: formatImage(landRes?.rows),
          Taxi: formatImage(taxiRes?.rows),
        },
      };
    } catch (error) {
      console.error("Error in getAllProductBData:", error);
      return {
        status: false,
        message: "Internal Server Error",
        data: {},
      };
    }
  }
}

export const QueryTopup = new queryTopData();
