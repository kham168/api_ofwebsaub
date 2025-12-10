import { dbExecution } from "../../config/dbConfig.js";

class queryTopData {
  async getAllProductAData() {
    try {
      const baseUrl = "http://localhost:5151/";

      const tbcream = `
        SELECT channel, id, creamname AS name, tel, detail, donation, image
        FROM public.tbcream
        WHERE status = '1'
        ORDER BY cdate DESC
        LIMIT 1;
      `;

      const tbkhoomkhotsheb = `
        SELECT channel,id, name, tel, detail, donation, image
        FROM public.tbkhoomkhotsheb
        WHERE status = '1'
        ORDER BY cdate DESC
        LIMIT 1;
      `;

      const tbmuas = `
        SELECT channel, id, name, tel, detail, donation, image
        FROM public.tbmuas
        WHERE status = '1'
        ORDER BY id DESC
        LIMIT 1;
      `;

      const tbtshuaj = `
        SELECT channel, id, name, tel, detail, donation, image
        FROM public.tbtshuaj
        WHERE status = '1'
        ORDER BY id DESC
        LIMIT 1;
      `;

      // Run queries in parallel
      const [creamRes, khoomRes, muasRes, tshuajRes] = await Promise.all([
        dbExecution(tbcream, []),
        dbExecution(tbkhoomkhotsheb, []),
        dbExecution(tbmuas, []),
        dbExecution(tbtshuaj, []),
      ]);

      // Format images using async cleanImageArray
      const formatImage = async (rows) =>
        Promise.all(
          (rows || []).map(async (r) => ({
            ...r,
            image: (await this.cleanImageArray(r.image)).map(
              (img) => `${baseUrl}${img}`
            ),
          }))
        );

      // Combine into one array
      const mergedTopData = [
        ...(await formatImage(creamRes?.rows)),
        ...(await formatImage(khoomRes?.rows)),
        ...(await formatImage(muasRes?.rows)),
        ...(await formatImage(tshuajRes?.rows)),
      ];

      return {
        topData: mergedTopData,
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
          d.channel,
          d.id,
          d.dormantalname AS name,
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
         d.channel, d.id, d.dormantalname, d.type,
          d.totalroom, d.activeroom, d.locationvideo, d.tel, 
          d.contactnumber, d.moredetail,
          p.province, dis.district, d.image, d.plan_on_next_month, d.cdate
        ORDER BY d.cdate DESC
        LIMIT $1;
      `;

      // 🏠 2. House
      const tbhouse = `
        SELECT 
          h.channel,
          h.id,
          h.housename AS name,
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
        GROUP BY 
        h.channel,  h.id, h.housename, h.price1, h.price2, h.price3, h.tel, 
          h.contactnumber, h.locationvideo, h.moredetail,
          p.province, d.district, h.image, h.cdate
        ORDER BY h.cdate DESC
        LIMIT $1;
      `;

      // 🏞️ 3. Land
      const tbland = `
        SELECT 
          l.channel,
          l.id,
          l.productname AS name,
          l.area,
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
        l.channel, l.id, l.productname, l.area, l.tel, l.contactnumber, 
          l.locationurl, l.locationvideo, l.moredetail, 
          p.province, d.district, l.image, l.cdate
        ORDER BY l.cdate DESC
        LIMIT $1;
      `;

      // 🚕 4. Taxi
      const tbtaxi = `
        SELECT 
          t.channel,
          t.id,
          t.name,
          t.tel,
          t.detail,
          p.province,
          d.district,
          ARRAY_AGG(v.village ORDER BY v.village) AS villages,
          t.image,
          t.cdate
        FROM public.tbtaxi t
        INNER JOIN public.tbdistrict d ON d.districtid = t.districtid
        INNER JOIN public.tbprovince p ON p.provinceid = t.provinceid
        LEFT JOIN public.tbvillage v 
          ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
        WHERE t.status = '1'
        GROUP BY 
        t.channel, t.id, t.name, t.tel, t.detail,
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

      // Format images using async cleanImageArray
      const formatImage = async (rows) =>
        Promise.all(
          (rows || []).map(async (r) => ({
            ...r,
            image: (await this.cleanImageArray(r.image)).map(
              (img) => `${baseUrl}${img}`
            ),
          }))
        );

      const mergedTopData = [
        ...(await formatImage(dormitoryRes?.rows)),
        ...(await formatImage(houseRes?.rows)),
        ...(await formatImage(landRes?.rows)),
        ...(await formatImage(taxiRes?.rows)),
      ];

      return {
        topData: mergedTopData,
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

export const QueryTopup = new queryTopData();
