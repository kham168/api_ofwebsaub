 
import { dbExecution } from "../../config/dbConfig.js";
 

// search order data by tel

 
export const query_search_order_data = async (req, res) => {
  const custtel = req.body.custtel;

  try {
    const query = `
      SELECT orderid, custtel, custname, cdate
      FROM public.tboder
      WHERE custtel ILIKE $1
      ORDER BY cdate DESC
      LIMIT 5
    `;

    const resultSingle = await dbExecution(query, [`%${custtel}%`]);

    if (resultSingle) {
      res.status(200).send({
        status: true,
        message: "query data success",
        data: resultSingle?.rows,
      });
    } else {
      res.status(400).send({
        status: false,
        message: "query data fail",
        data: resultSingle?.rows,
      });
    }
  } catch (error) {
    console.error("Error in query_search_order_data:", error);
    res.status(500).send("Internal Server Error");
  }
};



// insert order data

 export const insert_order_data = async (req, res) => {
  const { id, custtel, custname } = req.body;
  const now = new Date();
  const Date8 = now.toISOString().slice(0,10).replace(/-/g, ""); 

  try {
    const query = `INSERT INTO public.tboder(orderid, custtel, custname, cdate) 
                   VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [id, custtel, custname, Date8];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      // ✅ Call function B logic here
      await insert_orderdetail_data(req, res, true); // pass flag so it doesn’t send res twice
    } else {
      return res.status(400).send({
        status: false,
        message: "insert data fail",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in insert_order_data:", error);
    res.status(500).send("Internal Server Error");
  }
};

 
export const insert_orderdetail_data = async (req, res, fromA = false) => {
  const { id, channel, productid, productname, price, custtel, custcomment } = req.body;

  try {
    const query = `INSERT INTO public.tboder_detail(orderid, channel, productid, productname, price, custtel, custcomment, cdate)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`;
    const values = [id, channel, productid, productname, price, custtel, custcomment];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      if (!fromA) { // only send response if called directly
        return res.status(200).send({
          status: true,
          message: "insert data successfull",
          data: resultSingle?.rows,
        });
      }
      return res.status(200).send({
        status: true,
        message: "insert order + orderdetail successfull",
        data: {
          order: req.body, // you can merge results if needed
          orderdetail: resultSingle?.rows,
        },
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "insert data fail",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in insert_orderdetail_data:", error);
    if (!fromA) res.status(500).send("Internal Server Error");
  }
};
