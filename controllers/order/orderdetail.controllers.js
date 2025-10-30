 
import { dbExecution } from "../../config/dbConfig.js";
 

// query all order data by channel

export const query_orderdetail_dataall_by_channel = async (req, res) => {
  const channel = req.body.channel;

  if (!channel || typeof channel !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid channel",
      data: [],
    });
  }

  try {
    const query = `
      SELECT orderid, productid, productname, price, custtel, custcomment, cdate, staffconfirm, confirmdate, sellstatus, sellname, selldate
      FROM public.tboder_detail
      WHERE channel = $1
      ORDER BY cdate DESC
      LIMIT 25
    `;
    const resultSingle = await dbExecution(query, [channel]);

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
    console.error("Error in query_orderdetail_dataall_by_channel:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};



// wuery order data by orderid


 export const query_orderdetail_dataone = async (req, res) => {
  const orderid = req.body.orderid;

  if (!orderid || typeof orderid !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid orderid",
      data: [],
    });
  }

  try {
    const query = `
      SELECT orderid, productid, productname, price, custtel, custcomment, cdate, staffconfirm, confirmdate, sellstatus, selldate
      FROM public.tboder_detail
      WHERE orderid = $1
    `;
    const resultSingle = await dbExecution(query, [orderid]);

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

export const update_staffconfirm_data = async (req, res) => {
  const { orderid, staffconfirm } = req.body;

  if (!orderid || !staffconfirm) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    const query = `
      UPDATE public.tboder_detail
      SET staffconfirm = $2,
          confirmdate = NOW()
      WHERE orderid = $1
      RETURNING *
    `;
    const values = [orderid, staffconfirm];

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
    console.error("Error in update_staffconfirm_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// for when sell confrim selling done 100%


export const update_sellstatus_data = async (req, res) => {
  const { orderid, sellstatus, sellname } = req.body;

  if (!orderid || !sellstatus || !sellname) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    const query = `
      UPDATE public.tboder_detail
      SET sellstatus = $2,
          sellname = $3,
          selldate = NOW()
      WHERE orderid = $1
      RETURNING *
    `;
    const values = [orderid, sellstatus, sellname];

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
    console.error("Error in update_sellstatus_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};
