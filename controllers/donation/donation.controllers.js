import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopup } from "../class/class.controller.js";
export const queryDonationListAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 0, 10);
    const limit = parseInt(req.query.limit || 15, 10);

    const validPage = Math.max(page, 0);
    const validLimit = Math.max(limit, 1);
    const offset = validPage * validLimit;

    const baseUrl = "http://localhost:5151/";

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbdonation d 
      INNER JOIN public.tbbankinformfordonation b ON d.bankinformid = b.id
    `;
    const countResult = await dbExecution(countQuery, []);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Fetch data
    const dataQuery = `
      SELECT 
        d.id, donation_name, donation_detail, moredetail_url,
        b.accountno, b.qrimage,
        d.image, 
        total_people_dnt, total_am_dnt, 
        close_date, status_detail, paid_detail, paid_image, d.cdate
      FROM public.tbdonation d 
      INNER JOIN public.tbbankinformfordonation b 
        ON d.bankinformid = b.id
      ORDER BY d.cdate DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await dbExecution(dataQuery, [validLimit, offset]);
    let rows = result?.rows || [];

    // Format image fields
    rows = rows.map((r) => {
      // ---- Format main donation images (column: d.image) ----
      let imageList = [];

      if (r.image) {
        // Example: "{img1.png,img2.png}"
        if (typeof r.image === "string") {
          imageList = r.image
            .replace(/[{}]/g, "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
        }
      }

      // ---- Format qrimage (bank table) ----
      const qrImageFull = r.qrimage ? baseUrl + r.qrimage : null;

      return {
        ...r,
        qrimage: qrImageFull,
        image: imageList.map((img) => baseUrl + img),
      };
    });

    const pagination = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages: Math.ceil(total / validLimit),
    };

    // Send Response
    return res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in queryDonationListAll:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};
export const queryCustomerDonationList = async (req, res) => {
  try {
    const donationId = req.query.donationId ?? "";
    const page = parseInt(req.query.page ?? 0, 10);
    const limit = parseInt(req.query.limit ?? 15, 10);

    if (!donationId) {
      return res.status(400).send({
        status: false,
        message: "Missing donationId",
        data: [],
      });
    }

    const donationIdInt = parseInt(donationId, 10);

    if (isNaN(donationIdInt)) {
      return res.status(400).send({
        status: false,
        message: "donationId must be a number",
      });
    }

    const validPage = Math.max(page, 0);
    const validLimit = Math.max(limit, 1);
    const offset = validPage * validLimit;

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.tbcust_donation c 
      INNER JOIN public.tbcust_donationdetail d ON d.id = c.id
      WHERE d.donationid = $1;
    `;
    const countResult = await dbExecution(countQuery, [donationIdInt]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    const baseUrl = "http://localhost:5151/";

    // Main query
    const query = `
      SELECT 
        c.id, orderid, custtel, custname, total_dnt, image,
        d.donationname, d.amount, cdate
      FROM public.tbcust_donation c 
      INNER JOIN public.tbcust_donationdetail d ON d.id = c.id
      WHERE d.donationid = $1
      ORDER BY c.cdate DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await dbExecution(query, [
      donationIdInt,
      validLimit,
      offset,
    ]);

    let rows = result?.rows || [];

    // Format image
    rows = rows.map((r) => {
      let imgs = [];

      if (r.image) {
        imgs = r.image
          .replace(/[{}]/g, "")
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean);
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

    res.status(200).send({
      status: true,
      message: rows.length > 0 ? "Query successful" : "No data found",
      data: rows,
      pagination,
    });
  } catch (error) {
    console.error("Error in queryCustomerDonationList:", error);
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
    if (!tel) {
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
    const countResult = await dbExecution(countQuery, [`%${tel}%`]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Base URL for images + QR
    const baseUrl = "http://localhost:5151/";

    // Main query
    const query = `
SELECT 
  c.id,
  c.orderid,
  c.custtel,
  c.custname,
  c.total_dnt,
  c.image,
  c.cdate,
  JSON_AGG(
      JSON_BUILD_OBJECT(
          'donationname', d.donationname,
          'amount', d.amount
      )
  ) AS donationdetail
FROM public.tbcust_donation c
JOIN public.tbcust_donationdetail d 
    ON d.id = c.id
WHERE c.custtel ILIKE $1
GROUP BY 
  c.id, c.orderid, c.custtel, c.custname, 
  c.total_dnt, c.image, c.cdate
ORDER BY 
  c.cdate DESC
LIMIT $2 OFFSET $3;
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

export const customerDonation = async (req, res) => {
  try {
    let { custTel, custName, totalAmount, donationDetail } = req.body;

    // Convert productDetail string → array (when form-data)
    if (typeof donationDetail === "string") {
      try {
        donationDetail = JSON.parse(donationDetail);
      } catch (err) {
        return res.status(400).json({
          status: false,
          message: "Invalid JSON in productDetail",
        });
      }
    }

    if (!Array.isArray(donationDetail) || donationDetail.length === 0) {
      return res.status(400).json({
        status: false,
        message: "productDetail must be a non-empty array",
      });
    }

    // Validate required fields
    if (!custTel || !totalAmount) {
      return res.status(400).send({
        status: false,
        message: "Missing required fields (custTel, totalAmount)",
      });
    }

    // Image upload
    const imageArray = req.files?.[0]?.filename || "";

    // Insert master donation record
    const insertDonationQuery = `
      INSERT INTO public.tbcust_donation(
        orderid,custtel, custname, total_dnt, image, cdate
      )
      VALUES ('',$1, $2, $3, $4, NOW())
      RETURNING id;
    `;

    const donationValues = [custTel, custName ?? "", totalAmount, imageArray];

    const donationResult = await dbExecution(
      insertDonationQuery,
      donationValues
    );

    if (!donationResult?.rowCount) {
      return res.status(400).json({
        status: false,
        message: "Insert donation failed",
      });
    }

    const donationMasterId = donationResult.rows[0].id;

    // Insert donation detail items (array)
    const insertDetailQuery = `
      INSERT INTO public.tbcust_donationdetail (
        id, donationid, donationname, amount
      ) VALUES ($1, $2, $3,$4);
    `;

    for (const item of donationDetail) {
      if (!item.donationName || !item.amount) {
        return res.status(400).json({
          status: false,
          message: "Each detail item must include donationname, amount",
        });
      }
      const detailValues = [
        donationMasterId,
        item.donationId,
        item.donationName,
        item.amount,
      ];

      await dbExecution(insertDetailQuery, detailValues);
    }

    return res.status(200).json({
      status: true,
      message: "Donation and details inserted successfully",
      donationId: donationMasterId,
    });
  } catch (error) {
    console.error("Error in customerDonation:", error);
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
};
export const insertDonationList = async (req, res) => {
  const {
    donationName,
    donationDetail,
    moreDetailUrl,
    bankInformId,
    statusDetail,
  } = req.body;

  if (!donationName || !donationDetail || !bankInformId) {
    return res.status(400).send({
      status: false,
      message: "Missing required fields",
      data: [],
    });
  }

  try {
    // Convert uploaded images → comma separated string
    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename).join(",")
        : "";

    const query = `
      INSERT INTO public.tbdonation(
        donation_name, donation_detail, moredetail_url, bankinformid, 
        image, total_people_dnt, total_am_dnt,close_date, status_detail,
        paid_detail, paid_image
      )
      VALUES ($1,$2,$3,$4,$5,'','','', $6,'','')
      RETURNING *;
    `;

    const values = [
      donationName,
      donationDetail,
      moreDetailUrl,
      bankInformId,
      imageArray, // <-- now a string, not array
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
    console.error("Error in insertDonationList:", error);
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
    const imageArray = req.files?.[0]?.filename || "";

    // 🧠 Insert into tbcream
    const query = `
   INSERT INTO public.tbbankinformfordonation(
	 name, detail, accountno, qrimage, status)
	VALUES ($1, $2, $3, $4, '1');
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

export const updateDonationMainInformation01 = async (req, res) => {
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

    const imageArray =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.filename).join(",")
        : "";

    pushUpdate("donation_name", donationName);
    pushUpdate("donation_detail", donationDetail);
    pushUpdate(`"moredetail_url"`, moreDetailUrl);
    pushUpdate(`"bankinformid"`, bankInformId);
    pushUpdate(`"image"`, imageArray);
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

export const updateDonationMainInformation02 = async (req, res) => {
  const {
    id,
    totalPeopleDonation,
    totalAmountDonation,
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

    const imageArray = req.files?.[0]?.filename || "";

    pushUpdate("total_people_dnt", totalPeopleDonation);
    pushUpdate("total_am_dnt", totalAmountDonation);
    pushUpdate(`"close_date"`, closeDate);
    pushUpdate(`"status_detail"`, statusDetail);
    pushUpdate("paid_detail", paidDetail);
    pushUpdate("paid_image", imageArray);

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
