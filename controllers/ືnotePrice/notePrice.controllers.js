import { dbExecution } from "../../config/dbConfig.js";
export const queryDataAllByName = async (req, res) => {
  const channel = req.query.channel ?? "";
  const name = req.query.name ?? "";

  if (!channel || !name) {
    return res.status(400).send({
      status: false,
      message: "Missing required field: channel or name",
      data: null,
    });
  }

  try {
    const baseUrl = "http://localhost:5151/";

    const query = `
      SELECT productname, price, image, lastupdateprice, cdate
      FROM public.tbnoteprice
      WHERE status = '1'
        AND channel = $1
        AND productname ILIKE $2;
    `;

    const resultSingle = await dbExecution(query, [
      channel,
      `%${name}%`,
    ]);

    const data = resultSingle.rows.map(item => ({
      ...item,
      image: item.image
        ? `${baseUrl}${item.image}` // single image only
        : null,
    }));

    return res.status(200).send({
      status: true,
      message: "query data success",
      data,
    });

  } catch (error) {
    console.error("Error in queryDataAllByName:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};


// insert channel data
export const insertDataPriceDetail = async (req, res) => {
  const { channel, productName, price } = req.body;

  // single image only
  const image = req.files?.file?.[0]?.filename || null;

  // ✅ correct validation
  if (!channel || !productName || !price) {
    return res.status(400).send({
      status: false,
      message: "Missing required field: channel or productName or price",
      data: null,
    });
  }

  try {
    const query = `
      INSERT INTO public.tbnoteprice (
        channel,
        productname,
        price,
        image,
        status,
        cdate
      )
      VALUES ($1, $2, $3, $4, '1', NOW())
      RETURNING *;
    `;

    const values = [channel, productName, price, image];
    const resultSingle = await dbExecution(query, values);

    if (resultSingle?.rowCount > 0) {
      return res.status(201).send({
        status: true,
        message: "Insert data successful",
        data: resultSingle.rows[0], // single record
      });
    }

    return res.status(400).send({
      status: false,
      message: "Insert data failed",
      data: null,
    });

  } catch (error) {
    console.error("Error in insertDataPriceDetail:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// update channel data
export const updateProductData = async (req, res) => {
  const { id, productName, price, status } = req.body;

  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Missing required field: id",
      data: null,
    });
  }

  const image = req.files?.file?.[0]?.filename || null;

  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (productName != null) {
      fields.push(`productname = $${paramIndex}`);
      values.push(productName);
      paramIndex++;
    }

    if (price != null) {
      fields.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }

    if (image != null) {
      fields.push(`image = $${paramIndex}`);
      values.push(image);
      paramIndex++;
    }

    if (status != null) {
      fields.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No data provided to update",
        data: null,
      });
    }

    values.push(id);

    const query = `
      UPDATE public.tbnoteprice
      SET ${fields.join(", ")},
          lastupdateprice = NOW()
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const resultSingle = await dbExecution(query, values);

    if (resultSingle?.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update successful",
        data: resultSingle.rows[0],
      });
    }

    return res.status(404).send({
      status: false,
      message: "No record found to update",
      data: null,
    });

  } catch (error) {
    console.error("Error in updateProductData:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

