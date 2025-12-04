import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";

export const queryDonationListAll = async (req, res) => {
  try {
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdonation d inner join public.tbbankinformfordonation b 
	on d.bankinformid=b.id
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    const baseUrl = "http://localhost:5151/";

    // Fetch paginated cream data
    const dataQuery = `
SELECT d.id, donation_name, donation_detail, moredetail_url,accountno,qrimage, total_people_dnt, total_dnt, close_date, status_detail, paid_detail, paid_image, d.cdate
	FROM public.tbdonation d inner join public.tbbankinformfordonation b 
	on d.bankinformid=b.id
      ORDER BY c.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    let rows = result?.rows || [];

    // Format images
    rows = rows.map((r) => {
      let imgs = [];
      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
          imgs = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }
      return {
        ...r,
        image: imgs.map((img) => baseUrl + img),
      };
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    let topData = null;
    if (validPage === 0) {
      try {
        const topResult = await QueryTopup.getAllProductAData();
        topData = topResult?.data || topResult;
      } catch (e) {
        console.warn("Failed to load top data:", e.message);
      }
    }

    // Final Output
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrimage, // ⬅️ HERE!
      data: rows,
      pagination,
      ...(validPage === 0 && { topData }),
    });
  } catch (error) {
    console.error("Error in queryCreamDataAll:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const queryCustomerDonationList = async (req, res) => {
  try {
    const donationId = req.query.donationId ?? "";
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).send({
        status: false,
        message: "Invalid or missing name",
        data: [],
      });
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
     FROM public.tbcust_donation 
      WHERE donation_for_projectid = $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Base URL for images + QR
    const baseUrl = "http://localhost:5151/";

    // Main search query
    const query = ` 
SELECT id, orderid, custtel, custname, donation_for_projectid, total_dnt, image, cdate
	FROM public.tbcust_donation 
      WHERE donation_for_projectid = $1
      ORDER BY cdate DESC LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [donationId, validLimit, offset]);
    let rows = result?.rows || [];

    // Format image URLs
    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
          imgs = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }

      return {
        ...r,
        image: imgs.map((img) => baseUrl + img),
      };
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    // Final response (with qrimage)
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrimage,
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in searchCreamData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const searchDonationLogByCustomerTel = async (req, res) => {
  try {
    const tel = req.query.tel ?? "";
    const page = req.query.page ?? 0;
    const limit = req.query.limit ?? 15;

    const validPage = Math.max(parseInt(page, 10) || 0, 0);
    const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = validPage * validLimit;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).send({
        status: false,
        message: "Invalid or missing name",
        data: [],
      });
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbcust_donation 
      WHERE custtel ILIKE $1;
    `;
    const countResult = await dbExecution(countQuery, [`%${name}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Base URL for images + QR
    const baseUrl = "http://localhost:5151/";

    // Main search query
    const query = `
  SELECT id, orderid, custtel, custname, donation_for_projectid, total_dnt, image, cdate
	FROM public.tbcust_donation 
      WHERE custtel ILIKE $1
      ORDER BY cdate DESC LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [`%${tel}%`, validLimit, offset]);
    let rows = result?.rows || [];

    // Format image URLs
    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        if (Array.isArray(r.image)) {
          imgs = r.image;
        } else if (typeof r.image === "string" && r.image.startsWith("{")) {
          imgs = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }

      return {
        ...r,
        image: imgs.map((img) => baseUrl + img),
      };
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    // Final response (with qrimage)
    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      qrimage,
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in searchCreamData:", error);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert cream data
export const customerDonation = async (req, res) => {
  const { custTel, custName, donationId, totalAmount } = req.body;

  if (!custTel || !donationId || !totalAmount) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    // 🖼️ Collect uploaded image filenames into an array
    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename)
        : [];

    // 🧠 Insert into tbcream
    const query = `
     INSERT INTO public.tbcust_donation(
	 custtel, custname, donation_for_projectid, total_dnt, image, cdate)
	VALUES ($1, $2, $3, $4, $5, $6, NEW())
      RETURNING *;
    `;

    const values = [custTel, custName, donationId, totalAmount, imageArray];

    const result = await dbExecution(query, values);

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
    console.error("Error in insertCreamData:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert cream data
export const insertDonationList = async (req, res) => {
  const {
    donationName,
    donationDetail,
    moreDetailUrl,
    bankInformId,
    closeDate,
    statusDetail,
  } = req.body;

  if (!id || !creamName || !price1 || !detail) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    // 🖼️ Collect uploaded image filenames into an array
    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename)
        : [];

    // 🧠 Insert into tbcream
    const query = `
     INSERT INTO public.tbdonation(
	  donation_name, donation_detail, moredetail_url, bankinformid, close_date, status_detail, cdate)
	VALUES ($1, $2, $3, $4, $5, $6, NEW())
      RETURNING *;
    `;

    const values = [
      donationName,
      donationDetail,
      moreDetailUrl,
      bankInformId,
      closeDate,
      statusDetail,
    ];

    const result = await dbExecution(query, values);

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
    console.error("Error in insertCreamData:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

// insert cream data
export const insertBankAccountForDonation = async (req, res) => {
  const { name, detail, accountNo } = req.body;

  if (!name || !detail || !accountNo) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    // 🖼️ Collect uploaded image filenames into an array
    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename)
        : [];

    // 🧠 Insert into tbcream
    const query = `
   	INSERT INTO public.tbbankinformfordonation(
	 name, detail, accountno, qrimage, status, cdate)
	VALUES ($1, $2, $3, $4, '1', NEW())
      RETURNING *;
    `;

    const values = [name, detail, accountNo, imageArray];

    const result = await dbExecution(query, values);

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
    console.error("Error in insertCreamData:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const updateDonationMainInform = async (req, res) => {
  const { id, donationName, donationDetail, moreDetailUrl, bankInformId } =
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

    pushUpdate("donation_name", donationName);
    pushUpdate("donation_detail", donationDetail);
    pushUpdate(`"moredetail_url"`, moreDetailUrl);
    pushUpdate(`"bankinformid"`, bankInformId);

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
      UPDATE public.tbdonation
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

export const updateDonationInform = async (req, res) => {
  const {
    id,
    totalPeopleDonation,
    totalDonation,
    closeDate,
    statusDetail,
    paidDetail,
  } = req.body;

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

    pushUpdate("total_people_dnt", totalPeopleDonation);
    pushUpdate("total_dnt", totalDonation);
    pushUpdate(`"close_date"`, closeDate);
    pushUpdate(`"status_detail"`, statusDetail);
    pushUpdate("paid_detail", paidDetail);
    pushUpdate("paid_image", paidImage);

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
      UPDATE public.tbdonation
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
