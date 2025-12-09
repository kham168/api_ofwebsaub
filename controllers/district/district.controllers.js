import { dbExecution } from "../../config/dbConfig.js";

// query district data all

export const queryDistrictDataAll = async (req, res) => {
  try {
    const query = `SELECT districtid, district, arean, provinceid
	FROM public.tbdistrict order by districtid asc`;
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

// query by province ID

export const queryDistrictDataByProvinceId = async (req, res) => {
  const provinceId = req.body.provinceId;

  try {
    const query = `SELECT districtid, district FROM public.tbdistrict where provinceid=$1`;
    const resultSingle = await dbExecution(query, [provinceId]);
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

// query by district ID

export const queryDistrictDataOne = async (req, res) => {
  const districtId = req.body.districtId;

  try {
    const query = `SELECT districtid, district,provinceid FROM public.tbdistrict where districtid=$1`;
    const resultSingle = await dbExecution(query, [districtId]);
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

// insert district data

export const insertDistrictData = async (req, res) => {
  const { districtId, district, provinceId } = req.body;
  try {
    const query = `INSERT INTO public.tbdistrict(id, district,provinceid)VALUES ($1, $2,$3) RETURNING *`;
    const values = [districtId, district, provinceId];
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

export const updateDistrictData = async (req, res) => {
  const { districtId, district } = req.body;

  try {
    const query = `UPDATE public.tbdistrict SET district =$1 WHERE id =$2 RETURNING *`;
    const values = [district, districtId];
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
