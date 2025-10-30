import { dbExecution } from "../../config/dbConfig.js";
 
export const quer_province_dataall = async (req, res) => { // done
  
  try {
    const query = `SELECT provinceid, province
	FROM public.tbprovince;`;
    const resultSingle = await dbExecution(query, []);
    console.log("Query result:", resultSingle?.rows);
    return res.json(resultSingle?.rows);
  } catch (error) {
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const quer_province_dataone = async (req, res) => {  // done
  const id=req.body.id;
  try {
    const query = `SELECT id, province FROM public.tbprovince where id='${id}'`;
    const resultSingle = await dbExecution(query, []);
    console.log("Query result:", resultSingle?.rows);
    return res.json(resultSingle?.rows);
  } catch (error) {
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};
 