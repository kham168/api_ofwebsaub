import { dbExecution } from "../../config/dbConfig.js";

// query image data or select top 15 of image
export const queryChannelDataAll = async (req, res) => {
  try {
    const baseUrl = "http://localhost:5151/";

    const query = `
      SELECT 
        id,
        channel,
        detail,
        ownername,
        peopleinform,
        tel,
        email,
        status,
        path,
        pathproductdetail,
        image,
        video1,
        video2,
        guidelinevideo,
        peoplecarimagepath,qr,
        cdate
      FROM public.tbchanneldetail
      WHERE status = '1';
    `;

    const result = await dbExecution(query, []);
    const rows = result?.rows || [];

    const formatted = rows.map((r) => {
      // 🧩 Convert `pathproductdetail` string → array
      const pathProductDetailArray = r.pathproductdetail
        ? r.pathproductdetail
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

      // 🧩 Convert `image` string → array and prepend baseUrl
      const imageArray = r.image
        ? r.image
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((img) => baseUrl + img)
        : [];

      return {
        ...r,
        pathproductdetail: pathProductDetailArray,
        image: imageArray,
      };
    });

    res.status(200).send({
      status: true,
      message: "Query data success",
      data: formatted,
    });
  } catch (error) {
    console.error("Error in query_channel_data_all:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// query muas image data or select top 15 of image
export const queryChannelDataByOne = async (req, res) => {
  //const { id } = req.params;

  const id = req.query.id ?? 0;

  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Missing required field: id",
      data: [],
    });
  }

  try {
    const baseUrl = "http://localhost:5151/";

    const query = `
      SELECT 
        id,
        channel,
        detail,
        ownername,
        peopleinform,
        tel,
        email,
        status,
        path,
        pathproductdetail,
        image,
        video1,
        video2,
        guidelinevideo,
        peoplecarimagepath,qr,
        cdate
      FROM public.tbchanneldetail
      WHERE id = $1 AND status = '1';
    `;

    const result = await dbExecution(query, [id]);
    const rows = result?.rows || [];

    const formatted = rows.map((r) => {
      // Convert `pathproductdetail` string → array
      const pathProductDetailArray = r.pathproductdetail
        ? r.pathproductdetail
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

      // Convert `image` string → array and prepend baseUrl
      const imageArray = r.image
        ? r.image
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((img) => baseUrl + img)
        : [];

      // Optionally make video URLs full too
      const video1 = r.video1 ? baseUrl + r.video1 : null;
      const video2 = r.video2 ? baseUrl + r.video2 : null;
      const guidelinevideo = r.guidelinevideo
        ? baseUrl + r.guidelinevideo
        : null;

      return {
        ...r,
        pathproductdetail: pathProductDetailArray,
        image: imageArray,
        video1,
        video2,
        guidelinevideo,
      };
    });

    res.status(200).send({
      status: true,
      message: "Query data success",
      data: formatted,
    });
  } catch (error) {
    console.error("Error in queryChannelDataByOne:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert channel data

export const insertChannelDataDetail = async (req, res) => {
  const { id, channel, detail, ownerName, peopleInformation, tel, path } =
    req.body;

  console.log("Received data:", { id });

  try {
    const query = `
      INSERT INTO public.tbchanneldetail(
        id, channel, detail, ownername, peopleinform, tel, status, cdate,path
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(),$8)
      RETURNING *;
    `;

    const values = [
      id,
      channel,
      detail,
      ownerName,
      peopleInformation,
      tel,
      "0",
      path,
    ];
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
    console.error("Error in insert_channel_data_detail:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// update channel status

export const update_channel_status = async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id or detail",
      data: null,
    });
  }

  try {
    const query = `UPDATE public.tbchanneldetail SET status=$1 WHERE id=$2 RETURNING *;`;
    const resultSingle = await dbExecution(query, [status, id]);

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

// update channel detial data

export const update_channel_detail = async (req, res) => {
  const { id, detail } = req.body;

  if (!id || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id or detail",
      data: null,
    });
  }

  try {
    const query = `UPDATE public.tbchanneldetail SET detail=$1 WHERE id=$2 RETURNING *;`;
    const resultSingle = await dbExecution(query, [detail, id]);

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

export const update_channel_image = async (req, res) => {
  const { id, video1, video2, guidelineVideo } = req.body;

  if (!id) {
    return res.status(400).send({
      status: false,
      message: "Missing required field: id",
      data: null,
    });
  }

  //const images = req.files?.files || null;   // array of images
  //const qrFile = req.files?.file || null;    // array with 1 file

  const imageArray = req.files?.files
    ? req.files.files.map((f) => f.filename)
    : null;

  const qrImage = req.files?.file ? req.files.file[0].filename : null;

  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (imageArray !== null) {
      fields.push(`image = $${paramIndex}`);
      values.push(imageArray); // only works if column type is text[]
      paramIndex++;
    }

    if (qrImage !== null) {
      fields.push(`qr = $${paramIndex}`);
      values.push(qrImage);
      paramIndex++;
    }

    if (video1) {
      fields.push(`video1 = $${paramIndex}`);
      values.push(video1);
      paramIndex++;
    }

    if (video2) {
      fields.push(`video2 = $${paramIndex}`);
      values.push(video2);
      paramIndex++;
    }

    if (guidelineVideo) {
      fields.push(`guidelinevideo = $${paramIndex}`);
      values.push(guidelineVideo);
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
      UPDATE public.tbchanneldetail
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const resultSingle = await dbExecution(query, values);

    if (resultSingle?.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update successful",
        data: resultSingle.rows,
      });
    }

    return res.status(404).send({
      status: false,
      message: "No record found to update",
      data: null,
    });
  } catch (error) {
    console.error("Error in update_channel_image:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};
