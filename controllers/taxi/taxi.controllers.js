import { dbExecution } from "../../config/dbConfig.js";


 
// query taxi data all or select top 15 

export const query_taxi_dataall = async (req, res) => {
  try {
    const query = `SELECT a.id, name, "Price1", "Price2", detail, cdate, d.url
	FROM public.tbtaxi a inner join public.tbtaxiimage d on a.id=d.id where status='1'
	 order by a.id asc limit 15`;
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



 // query taxi data by id

export const query_taxi_dataone = async (req, res) => {
  
  const id = req.body.id;

  try {

    const query = `SELECT a.id, name, "Price1", "Price2", detail, cdate, d.url
	FROM public.tbtaxi a inner join public.tbtaxiimage d on a.id=d.id where a.id=$1`;
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
 

// insert taxi data

//INSERT INTO public.tbtaxiimage(
	//id, url)
	//VALUES (?, ?);

export const insert_taxi_data = async (req, res) => {
  const { id, name, Price1,Price2,detail  } = req.body;
  try {
    const query = `INSERT INTO public.tbtaxi(
	id, name, "Price1", "Price2", detail, cdate, status)
	VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const values = [id, name, Price1,Price2,detail,'NEW()','1'];
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

   

    // delete taxi data || Update data status 1 to 0

export const delete_taxi_data = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbtaxi SET status='0' WHERE id =$1 RETURNING *`;
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

// re-open taxi data status 1 to 0

export const reopen_taxi_data_status_0_to_1 = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbtaxi SET status='1' WHERE id =$1 RETURNING *`;
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



