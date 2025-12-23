import { dbExecution } from "../../config/dbConfig.js";
export const queryProvinceDataAll = async (req, res) => {
  try {
    const query = `
      SELECT provinceid, province
      FROM public.tbprovince;
    `;

    const resultSingle = await dbExecution(query, []);
    const rows = resultSingle?.rows || [];

    return res.status(200).json({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });

  } catch (error) {
    console.error("Error in queryProvinceDataAll:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

  
export const queryProvinceDataOne = async (req, res) => {
  // done
  const id = req.body.id;
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
