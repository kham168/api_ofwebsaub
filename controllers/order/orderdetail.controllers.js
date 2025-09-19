 
import { dbExecution } from "../../config/dbConfig.js";
 

// query all order data by channel


export const query_orderdetail_dataall_by_channel = async (req, res) => {

     const channel = req.body.channel;

  try {
    const query = `SELECT orderid, productid, productname, price, custtel, custcomment, cdate, staffconfirm, confirmdate, sellstatus, sellname, selldate
	 FROM public.tboder_detail where channel=$1 order by cdate desc limit 25`;
    const resultSingle = await dbExecution(query, [channel]); 
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
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};


// wuery order data by orderid


 
export const query_orderdetail_dataone = async (req, res) => {
  
  const orderid = req.body.orderid;

  try {

    const query = `SELECT orderid, productid, productname, price, custtel, custcomment, cdate, staffconfirm, confirmdate, sellstatus, selldate
	 FROM public.tboder_detail where orderid=$1`;
    const resultSingle = await dbExecution(query, [orderid]);
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
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};

 

//for when staff update or confirm for customer knwo that we are seeing order 


export const update_staffconfirm_data = async (req, res) => {
  const { orderid, staffconfirm } = req.body;

  try {
    const query = `UPDATE public.tboder_detail SET staffconfirm=$2, confirmdate=$3 WHERE orderid =$1 RETURNING *`;
    const values = [orderid, staffconfirm,'NOW()'];
    const resultSingle = await dbExecution(query, values);
 
    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "updadte data successfull",
        data: resultSingle?.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "updadte data fail",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};


// for when sell confrim selling done 100%



export const update_sellstatus_data = async (req, res) => {
  const { orderid, sellstatus, sellname } = req.body;

  try {
    const query = `UPDATE public.tboder_detail SET sellstatus=$2,sellname=$3, selldate=$4 WHERE orderid=$1 RETURNING *`;
    const values = [orderid, sellstatus,sellname,'NEW()'];
    const resultSingle = await dbExecution(query, values);
 
    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "updadte data successfull",
        data: resultSingle?.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "updadte data fail",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};

