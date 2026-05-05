import { dbExecution } from "../../config/dbConfig.js";

class classInsertData {
  async insertAllServiceOder(req, res) {
    const { channel, fromed, toed, voice, detail, price, tel } = req.body;

    // ✅ Validate
    if (!channel || !fromed || !toed || !tel) {
      return res.status(400).send({
        status: false,
        message: "Missing required fields: channel, id, fromed, toed, tel",
        data: null,
      });
    }
    const generateId = () => {
      return (
        Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
      );
    };

    try {
      const id = generateId(); // Generate unique ID for the order

      const query = `
      INSERT INTO public.tbtaxicalling(
        channel, id, fromed, toed, voicedata, detail, price, tel, review, 
        cfstatus, description,cfvoicedata, cftel, chstatus, cdate
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,$8,0,
        0,'','','', 0, NOW()
      )
      RETURNING *;
    `;

      const values = [
        channel,
        id,
        fromed,
        toed,
        voice || "",
        detail || "",
        price || 0,
        tel,
      ];

      const result = await dbExecution(query, values);

      if (result.rowCount > 0) {
        return res.status(200).send({
          status: true,
          message: "Insert successful",
          data: result.rows,
        });
      }

      return res.status(400).send({
        status: false,
        message: "Insert failed",
        data: null,
      });
    } catch (error) {
      console.error("Error insertTaxiCalling:", error);

      return res.status(500).send({
        status: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }

  getTaxiCallingAll = async (channel, page, limit) => {
    channel = channel;
    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;
    try {
      const query = `
      SELECT * FROM public.tbtaxicalling where channel = $1
      ORDER BY cdate DESC
      LIMIT $2 OFFSET $3;
    `;

      const result = await dbExecution(query, [channel, validLimit, offset]);

      return {
        status: true,
        message: "Fetch success",
        data: result.rows,
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);
      return {
        status: false,
        message: "Internal Server Error",
        error: error.message,
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

  searchTaxiCallingAll = async (detail) => {
    detail = detail;

    try {
      // ✅ Clean input
      const keyword = (detail || "").trim();

      // ✅ Check length
      if (keyword.length < 4) {
        return {
          status: false,
          message: "Search must be at least 3 characters",
          data: [],
        };
      }

      const query = `
      SELECT * FROM public.tbtaxicalling where tel Ilike $1
      ORDER BY cdate DESC
      LIMIT 25;
    `;

      const result = await dbExecution(query, [`%${detail}%`]);

      return {
        status: true,
        message: "Fetch success",
        data: result.rows,
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);
      return {
        status: false,
        message: "Internal Server Error",
        error: error.message,
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

export const classInsertDataS = new classInsertData();
