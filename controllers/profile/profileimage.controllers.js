import { dbExecution } from "../../config/dbConfig.js";

// select all data
export const queryAdvertData = async (req, res) => {
  const baseUrl = "http://localhost:5151/"; // base URL for image path

  try {
    const query = `
      SELECT id, detail, image
      FROM public.tbadvert
      WHERE status = '1'
      ORDER BY cdate DESC
      LIMIT 7;
    `;

    const resultSingle = await dbExecution(query, []);

    if (resultSingle?.rowCount > 0) {
      // Map image paths to full URLs if needed
      const data = resultSingle.rows.map((row) => {
        let images = [];

        // Handle text[] from PostgreSQL
        if (Array.isArray(row.image)) {
          images = row.image.map((img) => `${baseUrl}${img}`);
        } else if (typeof row.image === "string" && row.image.startsWith("{")) {
          // If stored as '{img1,img2}'
          const clean = row.image
            .replace(/[{}"]/g, "")
            .split(",")
            .filter(Boolean);
          images = clean.map((img) => `${baseUrl}${img}`);
        }

        return {
          ...row,
          image: images,
        };
      });

      return res.status(200).send({
        status: true,
        message: "Query data successful",
        data,
      });
    }

    return res.status(404).send({
      status: false,
      message: "No data found",
      data: [],
    });
  } catch (error) {
    console.error("Error in queryAdvertData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};


// insert profile image
export const insertAdvertDataDetail = async (req, res) => {
  const { id, detail } = req.body;

  try {
    const imageArray =
      req.files && req.files.length > 0
        ? req.files
            .map((file) => file.filename || file.path || "")
            .filter(Boolean)
        : [];

    // Convert imageArray into PostgreSQL array literal if you want {img1,img2}
    const imageArrayString = `{${imageArray.join(",")}}`;

    const query = `
      INSERT INTO public.tbadvert(
        id, detail, image, status, cdate
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;

    const values = [id, detail, imageArrayString, "1"];

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert data successful",
        data: resultSingle.rows,
      });
    }

    return res.status(400).send({
      status: false,
      message: "Insert data failed",
      data: null,
    });
  } catch (error) {
    console.error("Error in insertAdvertDataDetail:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

export const updateProfileDataDetail = async (req, res) => {
  const { id, detail, status } = req.body;

  // id is required, others optional
  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Missing required field: id",
      data: null,
    });
  }

  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Update only if NOT null/empty
    if (detail != null && detail !== "") {
      fields.push(`detail = $${paramIndex}`);
      values.push(detail);
      paramIndex++;
    }

    if (status != null && status !== "") {
      fields.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // If user sent nothing to update
    if (fields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No update fields provided",
        data: null,
      });
    }

    // Add id as last parameter
    values.push(id);

    const query = `
      UPDATE public.tbadvert
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const resultSingle = await dbExecution(query, values);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(404).send({
        status: false,
        message: "No record found to update",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in update data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

