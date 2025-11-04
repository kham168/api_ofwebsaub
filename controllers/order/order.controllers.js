import { dbExecution } from "../../config/dbConfig.js";

// search order data by tel

export const querySearchOrderData = async (req, res) => {
  //const custTel = req.params.custTel;

   const custTel = req.query.custTel ?? 0;
  
  if (!custTel || typeof custTel !== "string") {
    return res.status(400).send({ status: false, message: "Invalid custtel" });
  }

  try {
    const query = `
      SELECT orderid, custtel, custname, cdate
      FROM public.tborder
      WHERE custtel ILIKE $1
      ORDER BY cdate DESC
      LIMIT 5
    `;

    const resultSingle = await dbExecution(query, [`%${custTel}%`]);

    const rows = resultSingle?.rows || [];

    if (rows.length > 0) {
      res.status(200).send({
        status: true,
        message: "Query data success",
        data: rows,
      });
    } else {
      res.status(200).send({
        status: false,
        message: "No data found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in query search order data:", error);
    res.status(500).send({ status: false, message: "Internal Server Error" });
  }
};

// insert order data

export const insertOrderData = async (req, res) => {
  const { id, custTel, custName } = req.body;
 
  if (!id || !custTel || !custName) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
    });
  }

  //const now = new Date();
  //const Date8 = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD string

  try {
    const query = `
      INSERT INTO public.tborder(orderid, custtel, custname, cdate)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const values = [id, custTel, custName];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      await insertOrderDetailData(req, res, true);

      return res.status(200).send({
        status: true,
        message: "Insert order data success",
        data: resultSingle.rows[0],
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "Insert data failed",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in insert order data:", error);
    return res
      .status(500)
      .send({ status: false, message: "Internal Server Error" });
  }
};

export const insertOrderDetailData = async (req, res, fromA = false) => {
  const {
    id,
    channel,
    productId,
    productName,
    price,
    custTel,
    custComment,
    donationId,
  } = req.body;

  if (!id || !channel || !productId || !productName || !price || !custTel) {
    if (!fromA)
      return res.status(400).send({ status: false, message: "Missing required fields" });
    throw new Error("Missing required fields");
  }

  try {
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
          } catch {}
        }
        return trimmed.split(",").map((x) => x.trim()).filter(Boolean);
      }
      return [String(v).trim()];
    };

    // ✅ Format donationIdArray as a Postgres array string: {5,3,4}
    const donationIdArray = `{${parseVillageList(donationId).join(",")}}`;

    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename || file.path || "").filter(Boolean)
        : [];

    const query = `
      INSERT INTO public.tborder_detail(
        orderid, channel, productid, productname, price, custtel, custcomment, donationid, paymentimage, cdate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    const values = [
      id,
      channel,
      productId,
      productName,
      price,
      custTel,
      custComment,
      donationIdArray,
      imageArray,
    ];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      if (!fromA) {
        return res.status(200).send({
          status: true,
          message: "Insert data successful",
          data: resultSingle.rows,
        });
      }
      return resultSingle.rows;
    } else {
      if (!fromA)
        return res.status(400).send({ status: false, message: "Insert data failed", data: null });
      throw new Error("Insert data failed");
    }
  } catch (error) {
    console.error("Error in insert order detail data:", error);
    if (!fromA)
      return res.status(500).send({ status: false, message: "Internal Server Error" });
    throw error;
  }
};

