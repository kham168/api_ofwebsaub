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
      FROM public.tborder o 
      INNER JOIN public.tborder_detail d ON d.orderid = o.orderid
      WHERE o.custtel ILIKE $1
    `;
    const countResult = await dbExecution(countQuery, [`%${tel}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Main query
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

          jsonb_agg(
              jsonb_build_object(
                  'productid', d.productid,
                  'productname', d.productname,
                  'image', d.image,
                  'price', d.price,
                  'qty', d.qty
              )
          ) AS productDetail

      FROM public.tborder o
      INNER JOIN public.tborder_detail d ON d.orderid = o.orderid

      WHERE o.custtel ILIKE $1 

      GROUP BY
        o.orderid, o.shipping, o.delivery, o.channel,
        o.custtel, o.custname, o.custcomment,
        o.paymentimage, o.cdate, o.staffconfirm,
        o.confirmdate, o.sellstatus, o.sellcomment,
        o.sellname, o.selldate

      ORDER BY cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [`%${tel}%`, validLimit, offset]);
    const rows = result?.rows || [];

    // Format paymentimage + product images
    const formattedRows = rows.map((item) => {
      // ----- FORMAT PAYMENT IMAGE -----
      const img = item.paymentimage;

      if (!img) {
        item.paymentimage = null;
      } else {
        const cleaned = img.replace(/[{}"]/g, "").trim();
        if (!cleaned) {
          item.paymentimage = null;
        } else {
          const imgList = cleaned.split(",").map((i) => i.trim());
          item.paymentimage =
            imgList.length === 1
              ? baseUrl + imgList[0]
              : imgList.map((i) => baseUrl + i);
        }
      }

      // ----- FORMAT PRODUCT DETAIL IMAGES -----
      if (item.productdetail && Array.isArray(item.productdetail)) {
        item.productdetail = item.productdetail.map((p) => {
          if (p.image && typeof p.image === "string") {
            p.image = baseUrl + p.image;
          }
          return p;
        });
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

export const insertOrderDetailData = async (req, res) => {
  try {
    let { id, shipping, delivery, channel, custTel, custName, custComment } =
      req.body;

    // IMPORTANT: extract productDetail separately (NOT in destructuring)
    let productDetail = req.body.productDetail;

    // productDetail is a string when sent via form-data
    if (typeof productDetail === "string") {
      try {
        productDetail = JSON.parse(productDetail);
      } catch (err) {
        console.error("JSON parse error:", err);
        return res.status(400).json({
          status: false,
          message: "Invalid JSON in productDetail",
        });
      }
    }

    if (!Array.isArray(productDetail)) {
      return res.status(400).json({
        status: false,
        message: "productDetail must be array",
      });
    }

    // Validate required fields
    if (!id || !channel || !custTel) {
      return res.status(400).send({
        status: false,
        message: "Missing required fields",
      });
    }

    // Handle uploaded images
     const imageArray = req.files?.map((f) => f.filename) || [];
    
     // Insert into tborder
    const insertOrderQuery = `
      INSERT INTO public.tborder (
        orderid, shipping, delivery, channel,
        custtel, custname, custcomment,
        paymentimage, cdate, staffconfirm, sellstatus
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), '0', '0')
      RETURNING *;
    `;

    const orderValues = [
      id,
      shipping ?? "",
      delivery ?? "",
      channel,
      custTel,
      custName ?? "",
      custComment ?? "",
      imageArray.length > 0 ? imageArray.join(",") : null

    ];

    const orderResult = await dbExecution(insertOrderQuery, orderValues);

    if (!orderResult?.rowCount) {
      return res.status(400).send({
        status: false,
        message: "Insert order failed",
      });
    }

    // Insert product items
    const insertProductQuery = `
      INSERT INTO public.tborder_detail (
        orderid, productid, productname, image, price, qty
      ) VALUES ($1, $2, $3, $4, $5, $6);
    `;

    for (const item of productDetail) {
      if (!item.productid || !item.productname || !item.price || !item.qty) {
        return res.status(400).send({
          status: false,
          message:
            "Each product item must include productid, productname, image, price, qty",
        });
      }

      const values = [
        id,
        item.productid,
        item.productname,
        item.image,
        item.price,
        item.qty,
      ];

      await dbExecution(insertProductQuery, values);
    }

    return res.status(200).send({
      status: true,
      message: "Order and product details inserted successfully",
      order: orderResult.rows[0],
    });
  } catch (error) {
    console.error("Error in insert order detail data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};
