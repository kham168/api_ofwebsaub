import { dbExecution } from "../../config/dbConfig.js";




// query cream data all or select top 15 

export const query_cream_dataall = async (req, res) => {
  try {
    const query = `SELECT a.id, creamname, "Price1", "Price2", "Price3", detail, cdate, d.url
	FROM public.tbcream a inner join public.tbcreamimage d on a.id=d.id where status='1' order by a.id asc limit 15`;
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



 // query cream data by id

export const query_cream_dataone = async (req, res) => {
  
  const id = req.body.id;

  try {

    const query = `SELECT a.id, creamname, "Price1", "Price2", "Price3", detail, cdate, d.url
	FROM public.tbcream a inner join public.tbcreamimage d on a.id=d.id where a.id=$1`;
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



// insert cream data


//INSERT INTO public.tbcreamimage(
	//id, url)
	//VALUES (?, ?);

export const insert_cream_data = async (req, res) => {
  const { id, creamname, price1, price2, price3, detail } = req.body;
  try {
    const query = `INSERT INTO public.tbcream(
	id, creamname, "Price1", "Price2", "Price3", detail, cdate, status)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
    const values = [id, creamname, price1, price2, price3, detail, 'NEW()','1'];
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

 



    // delet cream data  ||  update status 1 to 0

export const delete_cream_data = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbcream SET status='0' WHERE <condition> WHERE id =$1 RETURNING *`;
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

// re-open cream data status 0 to 1

export const reopen_cream_data_status_0_to_1 = async (req, res) => {
  const { id } = req.body;

  try {
    const query = `UPDATE public.tbcream SET status='1' WHERE <condition> WHERE id =$1 RETURNING *`;
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


