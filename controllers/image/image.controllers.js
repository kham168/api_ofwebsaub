 
import { dbExecution } from "../../config/dbConfig.js";
 

// query image data or select top 15 of image

export const query_land_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='land' order by id asc`;
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




// query muas image data or select top 15 of image

export const query_muas_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='muas' order by id asc`;
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


// query taxi image data or select top 15 of image

export const query_taxi_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='taxi' order by id asc`;
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



// query tshuaj image data or select top 15 of image

export const query_tshuaj_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='tshuaj' order by id asc`;
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



// query khoomkho tsheb image data or select top 15 of image

export const query_khoomkho_tsheb_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='khoomkho_tsheb' order by id asc`;
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


// query house image data or select top 15 of image

export const query_house_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='house' order by id asc`;
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


// query dormantal image data or select top 15 of image

export const query_dormantal_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='dormantal' order by id asc`;
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

// query cream image data or select top 15 of image

export const query_cream_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='cream' order by id asc`;
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


 

// query webprofile image data or select top 15 of image

export const query_webprofile_image = async (req, res) => {
  try {
    const query = `SELECT id, channel, url
	FROM public.tbchannelimageurl where channel='webprofile' order by id asc`;
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

 