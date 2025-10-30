 
import { dbExecution } from "../../config/dbConfig.js";
 
 // select all data

export const query_profile_image_data_all = async (req, res) => {
  try {
    const query = `SELECT id, detail, url, status FROM public.tbprofileimage where status='1';`;
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


 
// query profile image data by id

export const query_profile_image_data_by_id = async (req, res) => {
    const { id } = req.body;
  try {
    const query = `SELECT id, detail, url, status FROM public.tbprofileimage where id=$1;`;
    const resultSingle = await dbExecution(query, [id]); 
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
  
    

// insert profile image
export const insert_profile_data_detail = async (req, res) => {
  const { id, detail } = req.body;

  try {
    let resultSingle = null;

    // Insert images if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const queryImage = `
          INSERT INTO public.tbprofileimage(id, detail, url, status)
          VALUES ($1, $2, $3, $4)
          RETURNING *;
        `;
        resultSingle = await dbExecution(queryImage, [id, detail, file.filename, "1"]);
      }
    }

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




// update profile data on detail row

 
  export const update_profile_image_data_detail_row = async (req, res) => {
  const { id, detail } = req.body;

  if (!id || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id or detail",
      data: null,
    });
  }

  try {
    const query = `
      UPDATE public.tbprofileimage
      SET detail = $1
      WHERE id = $2
      RETURNING *;
    `;
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
    console.error("Error in update_profile_image_data_detail_row:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

   

// update profile status

export const update_profile_image_status = async (req, res) => { 
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id or detail",
      data: null,
    });
  }

  try {
    const query = `
      UPDATE public.tbprofileimage
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
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
    console.error("Error in update_profile_image_data_detail_row:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};



 