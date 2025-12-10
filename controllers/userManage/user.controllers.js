import { dbExecution } from "../../config/dbConfig.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../../utils/jwt.js";

export const queryUserDataAll = async (req, res) => {
  try {
    const channel = req.query.channel ?? 0;

    // Query paginated data
    const query = `
       SELECT id, tel, name, peopleid, type, channel, cdate
	   FROM public.tbusermanage where channel=$1 and status='1';
        `;

    let rows = (await dbExecution(query, [channel]))?.rows || [];

    // FINAL RESPONSE
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error on query all user:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// query khoomkho_tsheb data by id
export const queryUserDataOne = async (req, res) => {
  //const id = req.params.id;

  const id = req.query.id ?? 0;

  if (!id || typeof id !== "string") {
    return res.status(400).send({
      status: false,
      message: "Invalid id",
      data: [],
    });
  }

  try {
    const query = `
        SELECT id, tel, name, peopleid, type, channel, cdate
	FROM public.tbusermanage where id=$1;
        `;

    let rows = (await dbExecution(query, [id]))?.rows || [];

    // ✅ Send final response

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
    });
  } catch (error) {
    console.error("Error in query user dataone:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const createNewUser = async (req, res) => {
  const { tel, name, peopleId, type, password, channel } = req.body;

  // ✅ Validate required fields
  if (!tel || !name || !password) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id, name, password are required",
      data: [],
    });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    // ✅ Build query for inserting data directly into tbkhoomkhotsheb
    const query = `INSERT INTO public.tbusermanage(
	 tel, name, peopleid, type, password, channel, status)
	VALUES ($1, $2, $3, $4, $5, $6,'1');
        `;

    const values = [tel, name, peopleId, type, hashedPassword, channel];

    const result = await dbExecution(query, values);

    // ✅ Response handling
    if (result && result.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert data successful",
        data: result.rows,
      });
    } else {
      return res.status(400).send({
        status: false,
        message: "Insert data failed",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in insert user data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
      data: [],
    });
  }
};

export const insertDormitoryData = async (req, res) => {
  const {
    channel,
    id,
    name,
    productName,
    squareMeters,
    area,
    peopleId,
    turnOfReason,
    price1,
    price2,
    price3,
    type,
    totalRoom,
    activeRoom,
    locationVideo,
    tel,
    contactNumber,
    locationArea,
    moreDetail,
    province,
    district,
    village,
    plan_on_next_month,
  } = req.body;

  // Required field validation
  if (!id || !channel || !name || !tel || !province || !district) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields: id, channel, tel, province, district",
      data: null,
    });
  }

  // Normalize village to array
  const parseVillageList = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);

    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed)
            ? parsed.map((x) => String(x).trim()).filter(Boolean)
            : [];
        } catch {}
      }
      return trimmed
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }

    return [String(v).trim()];
  };

  const villageArray = parseVillageList(village);

  // Uploaded images
 // If frontend sends image as string → convert to array
let imageArray = []; // imageArray

if (req.files && req.files.length > 0) {
  imageArray = req.files.map((f) => f.filename);
} else if (typeof req.body.image === "string") {
  // frontend sometimes sends JSON string
  try {
    const parsed = JSON.parse(req.body.image); // ["a.png","b.png"]

    if (Array.isArray(parsed)) {
      imageArray = parsed.map((x) => x.replace(/^"+|"+$/g, "").trim());
    }
  } catch {
    // frontend sends: "a.png,b.png"
    imageArray = req.body.image
      .split(",")
      .map((x) => x.replace(/^"+|"+$/g, "").trim());
  }
}

  let query = "";
  let values = [];

  if (!imageArray.length || !villageArray.length) {
    return res.status(400).send({
      status: false,
      message: "image or village array is empty",
      data: null,
    });
  }

  try {
    // Channel 2 → Dormitory
    if (channel === "2") {
      query = `
        INSERT INTO public.tbdormitory(
       channel, id, dormantalname, price1, price2, price3, type, totalroom, activeroom,
          locationvideo, tel, contactnumber, moredetail,
          provinceid, districtid, villageid, image, status, plan_on_next_month, cdate
        ) VALUES (
        '2',  $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15::text[], $16::text[], '1', $17, NOW()
        )
        RETURNING *;
      `;

      values = [
        id,
        name,
        price1 || null,
        price2 || null,
        price3 || null,
        type,
        totalRoom,
        activeRoom || 0,
        locationVideo || "",
        tel || "",
        contactNumber || "",
        moreDetail || "",
        province || null,
        district || null,
        villageArray,
        imageArray,
        plan_on_next_month || "",
      ];
    }

    // Channel 3 → House
    else if (channel === "3") {
      query = `
        INSERT INTO public.tbhouse(
        channel,  id, housename, price1, price2, price3,
          tel, contactnumber, locationvideo, status, moredetail,
          provinceid, districtid, villageid, image, cdate
        )
        VALUES (
        '3',  $1, $2, $3, $4, $5,
          $6, $7, $8, '1', $9,
          $10, $11, $12::text[], $13::text[], NOW()
        )
        RETURNING *;
      `;

      values = [
        id,
        name,
        price1,
        price2,
        price3,
        tel,
        contactNumber,
        locationVideo,
        moreDetail,
        province,
        district,
        villageArray,
        imageArray,
      ];
    }

    // Channel 5 → Land
    else if (channel === "5") {
      query = `
        INSERT INTO public.tbland(
         channel, id, ownername, productname, type, squaremeters, area, price, 
          tel, contactnumber, locationurl, locationvideo, moredetail,
          provinceid, districtid, villageid, image,
          status, cdate
        )
        VALUES (
        '5',  $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15::text[], $16::text[],
          '1', NOW()
        )
        RETURNING *;
      `;

      values = [
        id,
        name,
        productName,
        type,
        squareMeters,
        area,
        price1,
        tel,
        contactNumber,
        locationArea,
        locationVideo,
        moreDetail,
        province,
        district,
        villageArray,
        imageArray,
      ];
    }

    // Channel 7 → Taxi
    else if (channel === "7") {
      query = `
        INSERT INTO public.tbtaxi(
         channel, id, name, price1, price2, tel, detail, provinceid, districtid, villageid, image, 
          status, peopleid, turnofreason, cdate
        ) VALUES (
         '7', $1, $2, $3, $4, $5, $6, 
          $7, $8, $9::text[], $10::text[], 
          '1', $11, $12, NOW()
        )
        RETURNING *;
      `;

      values = [
        id,
        name,
        price1,
        price2,
        tel,
        moreDetail,
        province,
        district,
        villageArray,
        imageArray,
        peopleId || null,
        turnOfReason || null,
      ];
    }

    // Invalid channel
    else {
      return res.status(400).send({
        status: false,
        message: "Invalid channel",
        data: null,
      });
    }

    // Execute insert
    const result = await dbExecution(query, values);

    if (result?.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert successful",
        data: result.rows,
      });
    }

    return res.status(400).send({
      status: false,
      message: "Insert failed",
      data: null,
    });
  } catch (error) {
    console.error("Error in insertDormitoryData:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// insert cream
export const insertDataOfAnyFunction = async (req, res) => {
  const {
    channel,
    id,
    type,
    bland,
    name,
    price1,
    price2,
    tel,
    detail,
    donation,
    dntstartDate,
    dntendDate,
    locationGps,
  } = req.body;

  if (!id || !name || !price1 || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    // Collect uploaded images
    // const imageArray =
    //   req.files && req.files.length > 0
    //     ? req.files.map((file) => file.filename)
    //     : [];
    // If frontend sends image as string → convert to array
let imageArray = [];

if (req.files && req.files.length > 0) {
  imageArray = req.files.map((f) => f.filename);
} 
else if (typeof req.body.image === "string") {

  let imgStr = req.body.image;

  // remove all extra double quotes
  imgStr = imgStr.replace(/"+/g, "");

  try {
    // Try parse JSON: ["a.png","b.png"]
    const arr = JSON.parse(imgStr);

    if (Array.isArray(arr)) {
      imageArray = arr.map((i) => i.trim());
    }
  } catch (err) {
    // Fallback: "a.png,b.png"
    imageArray = imgStr.split(",").map((i) => i.trim());
  }
}

 
    let query = "";
    let values = [];
    let result = null;

    // 🧠 CH 1 → tbcream
    if (channel === "1") {
      query = `
        INSERT INTO public.tbcream (
         channel, id, bland, creamname, price1, price2,
          tel, detail, image, donation,dntstartdate, dntenddate, status, cdate
        )
        VALUES ('1',$1, $2, $3, $4, $5, $6, $7, $8::text[], $9,$10,$11, '1', NOW())
        RETURNING *;
      `;
      values = [
        id,
        bland,
        name,
        price1,
        price2,
        tel,
        detail,
        imageArray,
        donation || "",
        dntstartDate || null,
        dntendDate || null,
      ];
    }

    // 🧠 CH 4 → tbkhoomkhotsheb
    else if (channel === "4") {
      query = `
        INSERT INTO public.tbkhoomkhotsheb(
         channel, id, type, name, price1, price2, 
          tel, detail, locationgps, image, status, donation, dntstartdate, dntenddate, cdate
        )
        VALUES ('4', $1, $2, $3, $4, $5, $6, $7, $8, $9::text[],'1', $10, $11, $12, NOW())
        RETURNING *;
      `;
      values = [
        id,
        type,
        name,
        price1,
        price2 || null,
        tel || null,
        detail,
        locationGps,
        imageArray,
        donation,
        dntstartDate || null,
        dntendDate || null
      ];
    }

    // 🧠 CH 8 → tbmuas
    else if (channel === "8") {
      query = `
        INSERT INTO public.tbmuas (
          channel,id, name, price, tel, detail, image, status,donation, dntstartdate, dntenddate, cdate
        )
        VALUES ('8',$1, $2, $3, $4, $5, $6::text[], '1', $7, $8, $8, NOW())
        RETURNING *;
      `;
      values = [id, name, price1, tel, detail, imageArray,donation, dntstartDate, dntendDate,];
    }

    // 🧠 CH 6 → tbtshuaj
    else if (channel === "6") {
      query = `
        INSERT INTO public.tbtshuaj(
         channel, id, name, price1, price2, tel, detail,
          image, status, donation, dntstartdate, dntenddate, cdate
        )
        VALUES ('6',$1, $2, $3, $4, $5, $6, $7::text[], '1', $8, $9, $10, NOW())
        RETURNING *;
      `;
      values = [
        id,
        name,
        price1,
        price2 || null,
        tel || "",
        detail,
        imageArray,
        donation || "",
        dntstartDate || null,
        dntendDate || null
      ];
    } else {
      return res.status(400).send({
        status: false,
        message: "Invalid channel",
        data: [],
      });
    }

    // Execute the query
    result = await dbExecution(query, values);

    if (result && result.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Insert successful",
        data: result.rows,
      });
    }

    return res.status(400).send({
      status: false,
      message: "Insert data failed",
      data: [],
    });
  } catch (error) {
    console.error("Error in insertDataOfAnyFunction:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const userLogin = async (req, res) => {
  const { tel, password } = req.body; // 👈 safer than params for login

  if (!tel || !password) {
    return res.status(400).send({
      status: false,
      message: "Missing gmail or password",
      data: [],
    });
  }

  try {
    // 1️⃣ Query member by gmail
    const query = `
    SELECT id, name, type, password, channel
	FROM public.tbusermanage where tel=$1 and status='1';
    `;

    const result = await dbExecution(query, [tel]);

    // 2️⃣ Check if user exists
    if (!result || result.rowCount === 0) {
      return res.status(401).send({
        status: false,
        message: "Invalid tel or password",
        data: [],
      });
    }

    const user = result.rows[0];

    // 3️⃣ Compare input password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send({
        status: false,
        message: "Invalid tel or password",
        data: [],
      });
    }

    delete user.password;

    // Create token payload
    const tokenPayload = {
      id: user.id,
      name: user.name,
      type: user.type,
      channel: user.channel,
    };

    const token = generateAccessToken(tokenPayload);

    return res.status(200).send({
      status: true,
      message: "Login successful",
      data: user,
      token,
    });
  } catch (error) {
    console.error("Error in user Login:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
      data: [],
    });
  }
};

export const updateUserData = async (req, res) => {
  const { id, status, type } = req.body;

  try {
    if (!id) {
      return res.status(400).send({
        status: false,
        message: "Missing user ID",
        data: null,
      });
    }

    let updateFields = [];
    let values = [];
    let valueIndex = 1;

    // Update ONLY if status is valid (not null, not undefined, not empty string)
    if (status !== undefined && status !== null && status !== "") {
      updateFields.push(`status=$${valueIndex++}`);
      values.push(status);
    }

    // Update ONLY if type is valid
    if (type !== undefined && type !== null && type !== "") {
      updateFields.push(`type=$${valueIndex++}`);
      values.push(type);
    }

    // No valid input
    if (updateFields.length === 0) {
      return res.status(400).send({
        status: false,
        message: "No valid fields to update",
        data: null,
      });
    }

    // Push ID at the end
    values.push(id);

    const query = `
      UPDATE public.tbusermanage
      SET ${updateFields.join(", ")}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await dbExecution(query, values);

    if (result?.rowCount > 0) {
      return res.status(200).send({
        status: true,
        message: "Update successful",
        data: result.rows,
      });
    } else {
      return res.status(404).send({
        status: false,
        message: "User not found",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const updateProductStatus = async (req, res) => {
  const { id, status, turnofreason, channel } = req.body;

  try {
    if (channel === "1") {
      const query = `UPDATE public.tbcream SET status=$2 WHERE id =$1 RETURNING *`;
    } else if (channel === "2") {
      const query = `UPDATE public.tbdormitory SET status=$2 WHERE id=$1 RETURNING *`;
    } else if (channel === "3") {
      const query = `UPDATE public.tbhouse SET status=$2 WHERE id=$1 RETURNING *`;
    } else if (channel === "4") {
      const query = `UPDATE public.tbkhoomkhotsheb SET status=$2 WHERE id =$1 RETURNING *`;
    } else if (channel === "5") {
      const query = `UPDATE public.tbland SET status = $2 WHERE id = $1 RETURNING *; `;
    } else if (channel === "6") {
      const query = `UPDATE public.tbtshuaj SET status=$2 WHERE id =$1 RETURNING *`;
    } else if (channel === "7") {
      const query = `UPDATE public.tbtaxi SET status=$2,turnofreason=$3 WHERE id =$1 RETURNING *`;
    } else if (channel === "8") {
      const query = `UPDATE public.tbmuas SET status = $2 WHERE id = $1 RETURNING *`;
    }

    const values = [id, status, turnofreason];

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
