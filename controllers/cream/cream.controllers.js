import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "../class/class.controller.js";

export const queryCreamDataOne = async (req, res) => {
  try {
    // const baseUrl = "http://localhost:5151/";
    const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";
    const id = req.query.id ?? "";

    // Validate ID
    const validId = id.toString().trim();
    if (!validId) {
      return res.status(400).send({
        status: false,
        message: "Invalid or missing ID",
        data: [],
      });
    }

    // Query QR image
    const qrQuery = `
      SELECT qr FROM public.tbchanneldetail 
      WHERE id = '1' LIMIT 1;
    `;
    const qrResult = await dbExecution(qrQuery, []);
    const qrRaw = qrResult.rows[0]?.qr || null;
    const qr = qrRaw ? baseUrl + qrRaw : null;

    // Main query
    const query = `
      SELECT 
        c.channel,
        c.id,
        c.creamname,
        c.price1,
        c.price2,
        c.tel,
        c.detail,
        c.donation,
        c.image
      FROM public.tbcream c 
      WHERE c.id = $1 AND c.status = '1';
    `;

    const result = await dbExecution(query, [validId]);
    let rows = result?.rows || [];

    // If no data
    if (rows.length === 0) {
      return res.status(404).send({
        status: false,
        message: "No data found",
        data: [],
        qr: null,
      });
    }

    // Parse images
    rows = await Promise.all(
      rows.map(async (r) => {
        const imgs = await QueryTopData.cleanImageArray(r.image);
        return {
          ...r,
          image: imgs.map((img) => baseUrl + img),
        };
      }),
    );

    // Final response (QR at top level)
    return res.status(200).send({
      status: true,
      message: "Query successful",
      data: rows,
      qr,
    });
  } catch (error) {
    console.error("Error in queryCreamDataOne:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
      qr: null,
    });
  }
};

export const updateProductData = async (req, res) => {
  const { id, bland, creamName, Price1, Price2, tel, detail, donation } =
    req.body;

  try {
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

    const pushUpdate = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        updateFields.push(`${column} = $${index++}`);
        values.push(value);
      }
    };

    // Add fields only if NOT empty string
    pushUpdate("bland", bland);
    pushUpdate("creamname", creamName);
    pushUpdate(`price1`, Price1);
    pushUpdate(`price2`, Price2);
    pushUpdate("tel", tel);
    pushUpdate("detail", detail);
    pushUpdate("donation", donation);

    // If nothing to update
    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No fields provided to update",
        data: null,
      });
    }

    values.push(id);

    const query = `
      UPDATE public.tbcream
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
