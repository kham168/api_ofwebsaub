 
import { dbExecution } from "../../config/dbConfig.js";
 

// query image data or select top 15 of image

export const query_channel_data_all = async (req, res) => {
  try {
    const baseUrl = "http://localhost:5151/";

    const query = `
      SELECT 
        c.id,
        c.channel,
        c.detail,
        c.ownername,
        c.peopleintorm,
        c.tel,
        c.status,
        c.cdate,
        c.path,
        COALESCE(
          json_agg(DISTINCT i.url) FILTER (WHERE i.url IS NOT NULL), 
          '[]'
        ) AS image_urls
      FROM public.tbchanneldetail c
      LEFT JOIN public.tbchannelimage i ON c.id = i.id
      WHERE c.status='1'
      GROUP BY c.id, c.channel, c.detail, c.ownername, c.peopleintorm, c.tel, c.status, c.cdate, c.path
      ORDER BY c.cdate DESC;
    `;

    const result = await dbExecution(query, []);

    if (result && result.rows) {
      // Map images to full URLs
      const rowsWithFullUrls = result.rows.map(r => ({
        ...r,
        image_urls: r.image_urls.map(img => baseUrl + img) // full URL
      }));

      res.status(200).send({
        status: true,
        message: "query data success",
        data: rowsWithFullUrls,
      });
    } else {
      res.status(400).send({
        status: false,
        message: "query data fail",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in query_channel_data_all:", error);
    res.status(500).send("Internal Server Error");
  }
};

 

// query muas image data or select top 15 of image

export const query_channel_data_by_one = async (req, res) => {

  const { id } = req.body;
  try {
    const query = `SELECT 
    c.id,
    c.channel,
    c.detail,
    c.ownername,
    c.peopleintorm,
    c.tel,
    c.status,
    c.cdate,path,
    COALESCE(json_agg(DISTINCT i.url) FILTER (WHERE i.url IS NOT NULL), '[]') AS image_urls
FROM public.tbchanneldetail c
LEFT JOIN public.tbchannelimage i ON c.id = c.id where c.id=$1
GROUP BY 
    c.id, c.channel, c.detail, c.ownername, c.peopleintorm, c.tel, c.status, c.cdate,path
ORDER BY c.cdate DESC;
`;
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


export const query_channel_video_data_all = async (req, res) => {
  try {
    const query = `SELECT 
    c.id,
    c.channel,
    c.detail,
    c.ownername,
    c.peopleintorm,
    c.tel,
    c.status,
    c.cdate,path,
    COALESCE(json_agg(DISTINCT v.url) FILTER (WHERE v.url IS NOT NULL), '[]') AS video_urls
FROM public.tbchanneldetail c 
LEFT JOIN public.tbchannelvideourl v ON c.id = v.id where c.status='1'
GROUP BY 
    c.id, c.channel, c.detail, c.ownername, c.peopleintorm, c.tel, c.status, c.cdate,path
ORDER BY c.cdate DESC;
`;
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



export const query_channel_vieo_data_by_one = async (req, res) => {

  const { id } = req.body;
  try {
    const query = `SELECT 
    c.id,
    c.channel,
    c.detail,
    c.ownername,
    c.peopleintorm,
    c.tel,
    c.status,
    c.cdate, path,
    COALESCE(json_agg(DISTINCT v.url) FILTER (WHERE v.url IS NOT NULL), '[]') AS video_urls
FROM public.tbchanneldetail c
LEFT JOIN public.tbchannelvideourl v ON c.id = v.id where c.id=$1
GROUP BY 
    c.id, c.channel, c.detail, c.ownername, c.peopleintorm, c.tel, c.status, c.cdate,path
ORDER BY c.cdate DESC;
`;
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



// insert channel data
  
export const insert_channel_data_detail = async (req, res) => {
  const { id, channel, detail, ownername, peopleintorm, tel, path} = req.body;

console.log("Received data:", { id });


  try {
    const query = `
      INSERT INTO public.tbchanneldetail(
        id, channel, detail, ownername, peopleintorm, tel, status, cdate,path
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(),$8)
      RETURNING *;
    `;
  
    const values = [id, channel, detail, ownername, peopleintorm, tel, "1", path];
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

 
 // insert into channel video url

export const insert_channel_video_url = async (req, res) => {
  const { id, url, } = req.body;

  try {
    
    // Insert main taxi data
    const query = `	INSERT INTO public.tbchannelvideourl(id, url)VALUES ($1, $2)  RETURNING *;`;
    const values = [id, url];
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
    console.error("Error in insert_taxi_data:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

 
// insert channel image

export const insert_channel_image_url = async (req, res) => {
  const { id } = req.body;

  try {
    let resultSingle = null;

    // Insert images if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const queryImage = `INSERT INTO public.tbchannelimage(id, url)VALUES ($1, $2) RETURNING *;`;
        resultSingle = await dbExecution(queryImage, [id, file.filename]);
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
    console.error("Error in update_profile_image_data_detail_row:", error);
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
    console.error("Error in update_profile_image_data_detail_row:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};


 

// update channel people inform


export const update_channel_people_inform = async (req, res) => { 
  const { id, peopleintorm } = req.body;

  if (!id || !peopleintorm) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id or detail",
      data: null,
    });
  }

  try {
    const query = `UPDATE public.tbchanneldetail SET peopleintorm=$1 WHERE id=$2 RETURNING *;`;
    const resultSingle = await dbExecution(query, [peopleintorm, id]);

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
 

// delete channell Image url

 export const delete_channel_image_url = async (req, res) => { 
  const { id, url } = req.body;

  if (!id || !url) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id or url",
      data: null,
    });
  }

  try {
    const query = `
      DELETE FROM public.tbchannelimage
      WHERE id = $1 AND url = $2
      RETURNING *;
    `;
    const resultSingle = await dbExecution(query, [id, url]);

    if (resultSingle && resultSingle.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Delete successful",
        data: resultSingle.rows,
      });
    } else {
      return res.status(404).send({
        status: false,
        message: "No record found to delete",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in delete_channel_image_url:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};


// Update channel video url

export const update_channel_video_url = async (req, res) => { 
  const { id, url } = req.body;

  if (!id || !url) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id or detail",
      data: null,
    });
  }

  try {
    const query = `UPDATE public.tbchannelvideourl
	SET url=$1
	WHERE id=$2
      RETURNING *;`;
    const resultSingle = await dbExecution(query, [url, id]);

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





