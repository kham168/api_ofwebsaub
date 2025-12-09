import { dbExecution } from "../../config/dbConfig.js";

// queery vill data all

export const queryVillageDataAll = async (req, res) => {
  // done

  try {
    const query = `SELECT villageid, village,arean,districtid FROM public.tbprovince order by id asc limit 25`;
    const resultSingle = await dbExecution(query, []);
    console.log("Query result:", resultSingle?.rows);
    return res.json(resultSingle?.rows);
  } catch (error) {
    console.error("Error in testdda:", error);
    res.status(500).send("Internal Server Error");
  }
};

// query village by district id
export const queryVillageDataByDistrictId = async (req, res) => {
  const { districtId } = req.body;

  try {
    if (!districtId) {
      return res.status(400).json({ error: "districtid is required" });
    }

    const query = `
      SELECT villageid, village, arean
      FROM public.tbvillage
      WHERE districtid = $1 order by villageid asc
    `;
    const resultSingle = await dbExecution(query, [districtId]);

    return res.json(resultSingle?.rows);
  } catch (error) {
    console.error("Error in query_village_data_by_district_id:", error);
    res.status(500).send("Internal Server Error");
  }
};

// query village by id

export const queryVillageDataOne = async (req, res) => {
  const { villageId } = req.body;

  try {
    const query = `
      SELECT villageid, village, arean
      FROM public.tbvillage
      WHERE villageid = $1
    `;
    const resultSingle = await dbExecution(query, [villageId]);

    return res.json(resultSingle?.rows);
  } catch (error) {
    console.error("Error in query_village_dataone:", error);
    res.status(500).send("Internal Server Error");
  }
};

// insert village data

export const insertVillageData = async (req, res) => {
  const { villageId, village, arean, districtId } = req.body;

  try {
    if (!villageId || !village || !arean || !districtId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const query = `
      INSERT INTO public.tbvillage (villageid, village, arean, districtid)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [villageId, village, arean, districtId];
    const resultSingle = await dbExecution(query, values);

    return res.status(201).json({
      status: true,
      message: "Village inserted successfully",
      data: resultSingle?.rows[0],
    });
  } catch (error) {
    console.error("Error in insert_village_data:", error);
    res.status(500).send("Internal Server Error");
  }
};

// update village data by id

export const updateVillageData = async (req, res) => {
  const { villageId, village, arean } = req.body;

  try {
    if (!villageId || !village || !arean) {
      return res
        .status(400)
        .json({ error: "villageid, village, and arean are required" });
    }

    const query = `
      UPDATE public.tbvillage
      SET village = $1,
          arean = $2
      WHERE villageid = $3
      RETURNING *
    `;
    const values = [village, arean, villageId];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle.rowCount === 0) {
      return res.status(404).json({ error: "Village not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Village updated successfully",
      data: resultSingle.rows[0],
    });
  } catch (error) {
    console.error("Error in update_village_data:", error);
    res.status(500).send("Internal Server Error");
  }
};
