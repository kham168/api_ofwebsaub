import { dbExecution } from "../../config/dbConfig.js";




// query khoomkho_tsheb data all or select top 15 

export const query_khoomkho_tsheb_dataall = async (req, res) => {
  try {
    const query = `SELECT a.id, name, "Price1", "Price2", detail, cdate,d.url
	FROM public.tbkhoomkho_tsheb a inner join public.tbkhoomkho_tshebimage d on a.id=d.id
	where status='1' order by id asc limit 15`;
    const resultSingle = await dbExecution(query, []); 
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



 // query khoomkho_tsheb data by id

export const query_khoomkho_tsheb_dataone = async (req, res) => {
  
  const id = req.body.id;

  try {

    const query = `SELECT a.id, name, "Price1", "Price2", detail, cdate,d.url
	FROM public.tbkhoomkho_tsheb a inner join public.tbkhoomkho_tshebimage d on a.id=d.id where a.id=$1`;
    const resultSingle = await dbExecution(query, [id]);
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



// insert khoomkho_tsheb data


//INSERT INTO public.tbkhoomkho_tshebimage(
	//id, url)
	//VALUES (?, ?);

export const insert_khoomkho_tsheb_data = async (req, res) => {
  const { id, name, price1, price2, detail } = req.body;
  try {
    const query = `INSERT INTO public.tbkhoomkho_tsheb(
	id, name, "Price1", "Price2", detail, cdate, status)
	VALUES ($1, $2, $3, $4, $5, $6, $7); RETURNING *`;
    const values = [id, name, price1, price2, detail,'NEW()','1'];
    const resultSingle = await dbExecution(query, values);
 
    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "insert data successfull",
        data: resultSingle?.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "insert data fail",
        data: null,
      });
    }
    
  } catch (error) {
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};

 

  // delete khoomkho_tsheb data

export const delete_khoomkho_tsheb_data = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbkhoomkho_tsheb SET status='0' WHERE id =$1 RETURNING *`;
    const values = [id];
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
 

  // re-open khoomkho_tsheb data status 0 to 1

export const reopen_khoomkho_tsheb_data_status_0_to_1 = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbkhoomkho_tsheb SET status='1' WHERE id =$1 RETURNING *`;
    const values = [id];
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