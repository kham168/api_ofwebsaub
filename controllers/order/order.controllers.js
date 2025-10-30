 
import { dbExecution } from "../../config/dbConfig.js";
 

// search order data by tel

export const query_search_order_data = async (req, res) => {
  const custtel = req.body.custtel;

  if (!custtel || typeof custtel !== "string") {
    return res.status(400).send({ status: false, message: "Invalid custtel" });
  }

  try {
    const query = `
      SELECT orderid, custtel, custname, cdate
      FROM public.tboder
      WHERE custtel ILIKE $1
      ORDER BY cdate DESC
      LIMIT 5
    `;

    const resultSingle = await dbExecution(query, [`%${custtel}%`]);

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
    console.error("Error in query_search_order_data:", error);
    res.status(500).send({ status: false, message: "Internal Server Error" });
  }
};




// insert order data


export const insert_order_data = async (req, res) => {
  const { id, custtel, custname } = req.body;

  if (!id || !custtel || !custname) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
    });
  }

  const now = new Date();
  const Date8 = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD string

  try {
    const query = `
      INSERT INTO public.tboder(orderid, custtel, custname, cdate)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [id, custtel, custname, Date8];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      // Call insert_orderdetail_data but don’t send res inside it
      await insert_orderdetail_data(req, res, true);

      // ✅ Send success response here
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
    console.error("Error in insert_order_data:", error);
    return res.status(500).send({ status: false, message: "Internal Server Error" });
  }
};

export const insert_orderdetail_data = async (req, res, fromA = false) => {
  const { id, channel, productid, productname, price, custtel, custcomment } = req.body;

  // Input validation
  if (!id || !channel || !productid || !productname || !price || !custtel) {
    if (!fromA) return res.status(400).send({ status: false, message: "Missing required fields" });
    throw new Error("Missing required fields");
  }

  try {
    const query = `
      INSERT INTO public.tboder_detail(orderid, channel, productid, productname, price, custtel, custcomment, cdate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const values = [id, channel, productid, productname, price, custtel, custcomment];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      if (!fromA) { // called directly
        return res.status(200).send({
          status: true,
          message: "Insert data successful",
          data: resultSingle.rows,
        });
      }
      // called from insert_order_data, just return the result
      return resultSingle.rows;
    } else {
      if (!fromA) return res.status(400).send({ status: false, message: "Insert data failed", data: null });
      throw new Error("Insert data failed");
    }
  } catch (error) {
    console.error("Error in insert_orderdetail_data:", error);
    if (!fromA) return res.status(500).send({ status: false, message: "Internal Server Error" });
    throw error; // propagate error to caller
  }
};
