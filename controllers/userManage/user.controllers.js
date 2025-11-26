import { dbExecution } from "../../config/dbConfig.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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
      message:
        "Missing required fields: id, name, price1, and detail are required",
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

    // ✅ 4️⃣ Login successful
    // (Optional) Remove password from response

    delete user.password;

    //const token = generateToken(user.id);

    return res.status(200).send({
      status: true,
      message: "Login successful",
      data: user,
      // data: user, token
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
