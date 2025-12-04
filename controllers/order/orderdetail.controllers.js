import { dbExecution } from "../../config/dbConfig.js";

// query all order data by channel
export const queryOrderDetailDataAllByChannelAndSellStatus = async (
  req,
  res
) => {
  const channel = req.query.channel ?? "";
  const status = req.query.status ?? "";
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 15;

  if (!channel || typeof channel !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid channel",
      data: [],
    });
  }

  const validPage = Math.max(page, 0);
  const validLimit = Math.max(limit, 1);
  const offset = validPage * validLimit;

  const baseUrl = "http://localhost:5151/";

  try {
    // Count Query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tborder o inner join public.tborder_detail d on d.orderid=o.orderid
      WHERE channel = $1 AND staffconfirm='1' AND sellstatus = $2
    `;
    const countResult = await dbExecution(countQuery, [channel, status]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Main Query
    const query = ` 
SELECT 
    o.orderid,
    o.shipping,
    o.delivery,
    o.channel,
    o.custtel,
    o.custname,
    o.custcomment,
    o.paymentimage,
    o.cdate,
    o.staffconfirm,
    o.confirmdate,
    o.sellstatus,
    o.sellcomment,
    o.sellname,
    o.selldate,

    -- Group products into JSON array
    jsonb_agg(
        jsonb_build_object(
            'productid', d.productid,
            'productname', d.productname,
            'price', d.price,
            'qty', d.qty
        )
    ) AS productDetail

FROM public.tborder o
INNER JOIN public.tborder_detail d ON d.orderid = o.orderid

WHERE channel = $1 AND staffconfirm='1' AND sellstatus = $2
GROUP BY
    o.orderid, o.shipping, o.delivery, o.channel,
    o.custtel, o.custname, o.custcomment,
    o.paymentimage, o.cdate, o.staffconfirm,
    o.confirmdate, o.sellstatus, o.sellcomment,
    o.sellname, o.selldate ORDER BY cdate DESC
     LIMIT $3 OFFSET $4;
    `;

    const result = await dbExecution(query, [
      channel,
      status,
      validLimit,
      offset,
    ]);

    const rows = result?.rows || [];

    // Format image URLs properly
    const formattedRows = rows.map((item) => {
      let img = item.paymentimage;

      if (!img) {
        item.paymentimage = null;
        return item;
      }

      // Clean { } and quotes
      img = img.replace(/[\{\}]/g, "").replace(/"/g, "");

      const imgList = img.split(",").map((i) => i.trim());

      if (imgList.length === 1) {
        item.paymentimage = baseUrl + imgList[0];
      } else {
        item.paymentimage = imgList.map((i) => baseUrl + i);
      }

      return item;
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    return res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: formattedRows, // ← FIXED
      pagination,
    });
  } catch (error) {
    console.error("Error in query order detail data all by channel:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};

// query all order data by channel
export const queryOrderDetailDataAllByChannelAndStaffConfirmStatus = async (
  req,
  res
) => {
  const channel = req.query.channel ?? "";
  const status = req.query.status ?? "";
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 15;

  if (!channel || typeof channel !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid channel",
      data: [],
    });
  }

  const validPage = Math.max(page, 0);
  const validLimit = Math.max(limit, 1);
  const offset = validPage * validLimit;

  const baseUrl = "http://localhost:5151/";

  try {
    // Count Query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tborder o inner join public.tborder_detail d on d.orderid=o.orderid
     WHERE channel = $1 
      AND staffconfirm=$2
      AND sellstatus='0'
    `;
    const countResult = await dbExecution(countQuery, [channel, status]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Main Query
    const query = `
SELECT 
    o.orderid,
    o.shipping,
    o.delivery,
    o.channel,
    o.custtel,
    o.custname,
    o.custcomment,
    o.paymentimage,
    o.cdate,
    o.staffconfirm,
    o.confirmdate,
    o.sellstatus,
    o.sellcomment,
    o.sellname,
    o.selldate,

    -- Group products into JSON array
    jsonb_agg(
        jsonb_build_object(
            'productid', d.productid,
            'productname', d.productname,
            'price', d.price,
            'qty', d.qty
        )
    ) AS productDetail

FROM public.tborder o
INNER JOIN public.tborder_detail d ON d.orderid = o.orderid

WHERE channel = $1 AND staffconfirm=$2 AND sellstatus='0'
GROUP BY
    o.orderid, o.shipping, o.delivery, o.channel,
    o.custtel, o.custname, o.custcomment,
    o.paymentimage, o.cdate, o.staffconfirm,
    o.confirmdate, o.sellstatus, o.sellcomment,
    o.sellname, o.selldate ORDER BY cdate DESC
     LIMIT $3 OFFSET $4;
    `;

    const result = await dbExecution(query, [
      channel,
      status,
      validLimit,
      offset,
    ]);

    const rows = result?.rows || [];

    // Format image URLs properly
    const formattedRows = rows.map((item) => {
      let img = item.paymentimage;

      if (!img) {
        item.paymentimage = null;
        return item;
      }

      // Clean { } and quotes
      img = img.replace(/[\{\}]/g, "").replace(/"/g, "");

      const imgList = img.split(",").map((i) => i.trim());

      if (imgList.length === 1) {
        item.paymentimage = baseUrl + imgList[0];
      } else {
        item.paymentimage = imgList.map((i) => baseUrl + i);
      }

      return item;
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    return res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: formattedRows, // ← FIXED
      pagination,
    });
  } catch (error) {
    console.error("Error in query order detail data all by channel:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};

// wuery order data by orderid

export const queryOrderDetailDataOne = async (req, res) => {
  const orderId = req.query.orderId ?? 0;

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid orderId",
      data: [],
    });
  }

  const baseUrl = "http://localhost:5151/";

  try {
    const query = `
SELECT 
    o.orderid,
    o.shipping,
    o.delivery,
    o.channel,
    o.custtel,
    o.custname,
    o.custcomment,
    o.paymentimage,
    o.cdate,
    o.staffconfirm,
    o.confirmdate,
    o.sellstatus,
    o.sellcomment,
    o.sellname,
    o.selldate,

    -- Group products into JSON array
    jsonb_agg(
        jsonb_build_object(
            'productid', d.productid,
            'productname', d.productname,
            'price', d.price,
            'qty', d.qty
        )
    ) AS productDetail

FROM public.tborder o
INNER JOIN public.tborder_detail d ON d.orderid = o.orderid

WHERE o.orderid = $1
GROUP BY
    o.orderid, o.shipping, o.delivery, o.channel,
    o.custtel, o.custname, o.custcomment,
    o.paymentimage, o.cdate, o.staffconfirm,
    o.confirmdate, o.sellstatus, o.sellcomment,
    o.sellname, o.selldate;
    `;

    const resultSingle = await dbExecution(query, [orderId]);
    const rows = resultSingle?.rows || [];

    if (rows.length === 0) {
      return res.status(200).send({
        status: false,
        message: "No data found",
        data: [],
      });
    }

    // 🔥 FIXED: clean image format
    const formattedRows = rows.map((item) => {
      let img = item.paymentimage;

      if (!img) {
        item.paymentimage = null;
        return item;
      }

      // Remove wrapping braces and quotes → {"img.jpg"} → img.jpg
      img = img.replace(/[\{\}]/g, "").replace(/"/g, "");

      // If multiple: img1.jpg,img2.jpg
      const imgList = img.split(",").map((i) => i.trim());

      // Convert 1 image → string
      if (imgList.length === 1) {
        item.paymentimage = baseUrl + imgList[0];
      }
      // Convert multiple → array
      else {
        item.paymentimage = imgList.map((i) => baseUrl + i);
      }

      return item;
    });

    return res.status(200).send({
      status: true,
      message: "Query data success",
      data: formattedRows,
    });
  } catch (error) {
    console.error("Error in query order detail data", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const updateOrderListStatus = async (req, res) => {
  const { orderId, staffConfirm, sellStatus, sellComment, sellName } = req.body;

  if (!orderId) {
    return res.status(400).send({
      status: false,
      message: "Missing orderId",
    });
  }

  try {
    let query = "";
    let values = [];

    // 1️⃣ Seller updating sale result (must have BOTH fields)
    if (
      sellStatus &&
      sellName &&
      sellStatus.trim() !== "" &&
      sellName.trim() !== ""
    ) {
      query = `
        UPDATE public.tborder
        SET sellstatus  = $2, 
            sellcomment = $3,
            sellname    = $4,
            selldate    = NOW()
        WHERE orderid = $1 RETURNING *
      `;
      values = [orderId, sellStatus, sellComment, sellName];
    }

    // 2️⃣ Staff confirming sale
    else if (staffConfirm !== undefined && staffConfirm !== null) {
      query = `
        UPDATE public.tborder
        SET staffconfirm = $2,
            confirmdate = NOW()
        WHERE orderid = $1 RETURNING *
      `;
      values = [orderId, staffConfirm];
    } else {
      return res.status(400).send({
        status: false,
        message: "No valid fields provided",
      });
    }

    const result = await dbExecution(query, values);

    if (result.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update successful",
        data: result.rows,
      });
    }

    return res.status(200).send({
      status: false,
      message: "No rows updated",
      data: [],
    });
  } catch (error) {
    console.error("Error in updateOrderListStatus:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};
