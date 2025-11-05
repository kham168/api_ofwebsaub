import { dbExecution } from "../../config/dbConfig.js";

// query all order data by channel

export const queryOrderDetailDataAllByChannel = async (req, res) => {
  //const [channel,status ]= req.params.channel;

  const channel = req.query.channel ?? 0;
  const status = req.query.status ?? 0;

  if (!channel || typeof channel !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid channel",
      data: [],
    });
  }

  try {
    const query = `
      SELECT orderid, channel, productid, productname, price, custtel, 
custcomment, donationid, paymentimage, cdate, staffconfirm,
confirmdate, sellstatus, sellname, selldate
      FROM public.tborder_detail
      WHERE channel = $1 and sellstatus=$2
      ORDER BY cdate DESC
      LIMIT 25
    `;
    const resultSingle = await dbExecution(query, [channel, status]);

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
    console.error("Error in query order detail data all by channel:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};

// wuery order data by orderid

export const queryOrderDetailDataOne = async (req, res) => {
  //const orderId = req.params.orderid;

  const orderId = req.query.orderId ?? 0;
  
  if (!orderId || typeof orderId !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid orderid",
      data: [],
    });
  }

  try {
    const query = `
      SELECT  orderid, channel, productid, productname, price, custtel, 
custcomment, donationid, paymentimage, cdate, staffconfirm, 
confirmdate, sellstatus, sellname, selldate
      FROM public.tborder_detail
      WHERE orderid = $1
    `;
    const resultSingle = await dbExecution(query, [orderId]);

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
    console.error("Error in query_orderdetail_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

//for when staff update or confirm for customer knwo that we are seeing order

export const updateStaffConfirmOrderData = async (req, res) => {
  const { orderId, staffConfirm } = req.body;

  if (!orderId || !staffConfirm) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    const query = `
      UPDATE public.tborder_detail
      SET staffconfirm = $2,
          confirmdate = NOW()
      WHERE orderid = $1
      RETURNING *
    `;
    const values = [orderId, staffConfirm];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(200).send({
        status: false,
        message: "No data updated",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in update staff confirm data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// for when sell confrim selling done 100%

export const updateSellStatusData = async (req, res) => {
  const { orderId, sellStatus, sellName } = req.body;

  if (!orderId || !sellStatus || !sellName) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    const query = `
      UPDATE public.tborder_detail
      SET sellstatus = $2,
          sellname = $3,
          selldate = NOW()
      WHERE orderid = $1
      RETURNING *
    `;
    const values = [orderId, sellStatus, sellName];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update data successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(200).send({
        status: false,
        message: "No data updated",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in update sell status data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};
