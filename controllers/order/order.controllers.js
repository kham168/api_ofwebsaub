import { dbExecution } from "../../config/dbConfig.js";

// search order data by tel
export const querySearchOrderData = async (req, res) => {
  const tel = req.query.tel ?? "";
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 5;

  if (!tel || typeof tel !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid telephone",
      data: [],
    });
  }

  const validPage = Math.max(page, 0);
  const validLimit = Math.max(limit, 1);
  const offset = validPage * validLimit;

  const baseUrl = "http://localhost:5151/";

  try {
    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tborder_detail 
      WHERE custtel LIKE $1
    `;
    const countResult = await dbExecution(countQuery, [`%${tel}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Main query
    const query = `
      SELECT orderid, channel, productid, productname, price, qty, custtel,
             custcomment, paymentimage, cdate, staffconfirm,
             confirmdate, sellcomment, sellstatus, sellname, selldate
      FROM public.tborder_detail 
      WHERE custtel LIKE $1
      ORDER BY cdate DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await dbExecution(query, [
      `%${tel}%`,
      validLimit,
      offset,
    ]);

    const rows = result?.rows || [];

    // Fix/format payment image
    const formattedRows = rows.map((item) => {
      let img = item.paymentimage;

      if (!img) {
        item.paymentimage = null;
        return item;
      }

      // Remove { }, quotes
      img = img.replace(/[\{\}]/g, "").replace(/"/g, "");

      const imgList = img.split(",").map((i) => i.trim());

      if (imgList.length === 1) {
        item.paymentimage = baseUrl + imgList[0];
      } else {
        item.paymentimage = imgList.map((i) => baseUrl + i);
      }

      return item;
    });

    return res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: formattedRows,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    });

  } catch (error) {
    console.error("Error in querySearchOrderData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
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
  
  try {
    const query = `
      INSERT INTO public.tborder(orderid, custtel, custname, cdate)
      VALUES ($1, $2, $3, NOW()) RETURNING *
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
    qty,
    custTel,
    custComment,
  } = req.body;

  if (!id || !channel || !productId || !productName || !price || !custTel) {
    if (!fromA)
      return res.status(400).send({ status: false, message: "Missing required fields" });
    throw new Error("Missing required fields");
  }

  try {
    
      const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename)
        : [];

    const query = `
      INSERT INTO public.tborder_detail(
        orderid, channel, productid, productname, price, qty, custtel, custcomment, paymentimage, cdate, staffconfirm, sellstatus
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(),'0','0')  RETURNING *
    `;
    const values = [
      id,
      channel,
      productId,
      productName,
      price,
      qty,
      custTel,
      custComment,
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

