import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "../class/class.controller.js";

// query khoomkho_tsheb data by id
export const queryKhoomKhoTshebDataOne = async (req, res) => {
  //const id = req.params.id;

  const idParam = req.query.id ?? "";
  const id = String(idParam).trim();

  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Invalid id",
      data: [],
    });
  }
  // const baseUrl = "http://localhost:5151/";
  const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

  // Query QR image
  const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '4' LIMIT 1;
    `;
  const qrResult = await dbExecution(qrQuery, []);
  const qrRaw = qrResult.rows[0]?.qr || null;
  const qr = qrRaw ? baseUrl + qrRaw : null;

  try {
    const query = `SELECT
        channel,
        k.id,
        type,
        k.name,
        k.price1,
        k.price2,
        k.tel,
        k.detail,
        k.locationgps,
        k.image,
        k.donation
      FROM public.tbotherservice k
      WHERE k.id = $1;
    `;

    let rows = (await dbExecution(query, [id]))?.rows || [];

    // ✅ Safely parse images from Postgres array
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopData.cleanImageArray(r.image);
        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      }),
    );

    // ✅ Send final response

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      qr,
    });
  } catch (error) {
    console.error("Error in query otherservice dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
      qr: null,
    });
  }
};

export const updateProductData = async (req, res) => {
  try {
    const {
      id,
      type,
      name,
      Price1,
      Price2,
      tel,
      detail,
      locationGps,
      donation,
    } = req.body;

    if (!id) {
      return res.status(400).send({
        status: false,
        message: "Missing product ID",
        data: null,
      });
    }

    let updateFields = [];
    let values = [];
    let index = 1;

    // Only update fields that are not undefined, null, or empty string
    const addField = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    addField("type", type);
    addField("name", name);
    addField(`price1`, Price1);
    addField(`price2`, Price2);
    addField("tel", tel);
    addField("detail", detail);
    addField("locationgps", locationGps);
    addField("donation", donation);

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
      UPDATE public.tbotherservice
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
