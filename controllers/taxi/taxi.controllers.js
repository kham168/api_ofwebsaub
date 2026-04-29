import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "../class/class.controller.js";

// query taxi data by id
export const queryTaxiDataOne = async (req, res) => {
  //const id = req.params.id;

  const id = req.query.id ?? 0;

  //const baseUrl = "http://localhost:5151/";
  const baseUrl = "https://service.tsheb.la/" || process.env.BASE_URL;
  try {
    const query = `
       SELECT 
        t.channel,
        t.id,
        t.name,
        t.price1,
        t.price2,
        t.tel,
        t.detail,
        p.province,
        d.district,
        ARRAY_AGG(v.village ORDER BY v.village) AS villages,
        t.image
      FROM public.tbtaxi t
      INNER JOIN public.tbdistrict d ON d.districtid = t.districtid
      INNER JOIN public.tbprovince p ON p.provinceid = t.provinceid
      LEFT JOIN public.tbvillage v 
        ON v.villageid = ANY(string_to_array(replace(replace(t.villageid, '{', ''), '}', ''), ',')::int[])
      WHERE t.status = '1' and t.id= $1
      GROUP BY 
       t.channel, t.id, t.name, t.price1, t.price2, t.tel, t.detail,
        p.province, d.district, t.image 
    `;
    // const resultSingle = await dbExecution(query, [id]);
    const result = await dbExecution(query, [id]);

    let rows = result?.rows || [];

    // ✅ Proper image parsing
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopData.cleanImageArray(r.image);

        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      }),
    );

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error in query_taxi_dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const updateProductData = async (req, res) => {
  try {
    const {
      id,
      name,
      Price1,
      Price2,
      tel,
      detail,
      provinceId,
      districtId,
      villageId,
      peopleId,
    } = req.body;

    if (!id) {
      return res.status(400).send({
        status: false,
        message: "Missing product ID",
        data: null,
      });
    }
    // Handle village ID array
    let villageIdArray = null;
    if (Array.isArray(villageId) && villageId.length > 0) {
      villageIdArray = `{${villageId.join(",")}}`;
    }
    let updateFields = [];
    let values = [];
    let index = 1;

    // Helper for adding fields
    const addField = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    // Add all updatable fields
    addField("name", name);
    addField("price1", Price1);
    addField("price2", Price2);
    addField("tel", tel);
    addField("detail", detail);
    addField("provinceid", provinceId);
    addField("districtid", districtId);
    addField("villageid", villageIdArray);
    addField("peopleid", peopleId);

    // If nothing to update
    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No fields provided to update",
        data: null,
      });
    }

    // ID last
    values.push(id);

    const query = `
      UPDATE public.tbtaxi
      SET ${updateFields.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await dbExecution(query, values);

    if (result?.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update successful",
        data: result.rows,
      });
    }

    return res.status(404).send({
      status: false,
      message: "Product not found",
      data: null,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
