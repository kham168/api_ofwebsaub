import { dbExecution } from "../../config/dbConfig.js";

class classAllFunction {
  async insertList(name, tel1, tel2, detail1, detail2, detail3, image, userId) {
    if (!name || !tel1 || !detail1 || !image || !userId) {
      return {
        status: false,
        message: "Missing required fields",
        data: null,
      };
    }
    const generateId = () => {
      return BigInt(Date.now());
    };

    try {
      const listId = generateId(); // Generate unique ID for the order

      const query = `
       INSERT INTO public.tbxeemhmoovlist(
	listid, name, tel1, tel2, detail1, detail2, detail3, image, status, cdate,createuser)
	   VALUES (
        $1, $2, $3, $4, $5, $6, $7,$8,'1',NOW(),$9)
      RETURNING *;
    `;

      const values = [
        listId,
        name,
        tel1,
        tel2,
        detail1 || "",
        detail2 || "",
        detail3 || "",
        image || "",
        userId,
      ];

      const result = await dbExecution(query, values);

      return {
        status: true,
        message: "Insert successful",
        data: result.rows,
      };
    } catch (error) {
      console.error("Error insertList:", error);

      return {
        status: false,
        message: "Internal Server Error",
        error: error.message,
      };
    }
  }

  /// =====> update list data

  async updateListData(
    listId,
    name,
    tel1,
    tel2,
    detail1,
    detail2,
    detail3,
    image,
    status,
    userId,
  ) {
    try {
      // Build dynamic update
      const fields = [];
      const values = [];
      let index = 1;

      if (name !== undefined && name !== null && name !== "") {
        fields.push(`name = $${index++}`);
        values.push(name);
      }

      if (tel1 !== undefined && tel1 !== null && tel1 !== "") {
        fields.push(`tel1 = $${index++}`);
        values.push(tel1);
      }

      if (tel2 !== undefined && tel2 !== null && tel2 !== "") {
        fields.push(`tel2 = $${index++}`);
        values.push(tel2);
      }

      if (detail1 !== undefined && detail1 !== null && detail1 !== "") {
        fields.push(`detail1 = $${index++}`);
        values.push(detail1);
      }

      if (detail2 !== undefined && detail2 !== null && detail2 !== "") {
        fields.push(`detail2 = $${index++}`);
        values.push(detail2);
      }

      if (detail3 !== undefined && detail3 !== null && detail3 !== "") {
        fields.push(`detail3 = $${index++}`);
        values.push(detail3);
      }

      if (image !== undefined && image !== null && image !== "") {
        fields.push(`image = $${index++}`);
        values.push(image);
      }

      if (status !== undefined && status !== null && status !== "") {
        if (status === "1") {
          fields.push(`status = '1'`);
        } else if (status === "0") {
          if (!userId) {
            return res.status(400).send({
              status: false,
              message: "Missing required field: userId",
              data: [],
            });
          }

          fields.push(`status ='0'`);
          fields.push(`closedate = NOW()`);
          fields.push(`userclose = $${index++}`);
          values.push(userId || "system");
        }
      }

      // If nothing to update
      if (fields.length === 0) {
        return {
          status: false,
          message: "update fields cannot be empty",
          data: result.rows,
        };
      }

      const query = `
      UPDATE public.tbxeemhmoovlist
      SET ${fields.join(", ")}
      WHERE listid = $${index} and status='1'
      RETURNING *;
    `;

      values.push(listId);

      const result = await dbExecution(query, values);

      if (result.rows.length === 0) {
        return {
          status: false,
          message: "update fields, data not found or invalid id",
          data: result.rows,
        };
      }

      return {
        status: true,
        message: "Update successful",
        data: result.rows,
      };
    } catch (error) {
      console.error("Error insertList:", error);

      return {
        status: false,
        message: "Internal Server Error",
        error: error.message,
      };
    }
  }

  // ====> select list

  SelectListData = async (userId) => {
    try {
      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      const dataQuery = `
      SELECT 
        l.listid,
        l.name,
        l.tel1,
        l.tel2,
        l.detail1,
        l.detail2,
        l.detail3,
        l.image,
        l.status,
        l.cdate,
        l.createuser,
        l.closedate,
        l.userclose,

        -- summary by status
        COALESCE(
          json_agg(
            json_build_object(
              'status', d.status,
              'total_item', d.total_item,
              'total_amount', d.total_amount,
              'total_qty', d.total_qty
            )
          ) FILTER (WHERE d.status IS NOT NULL),
          '[]'
        ) AS summary

      FROM public.tbxeemhmoovlist l

      LEFT JOIN (
        SELECT 
          listid,
          status,
          COUNT(id) AS total_item,
          COALESCE(SUM(price), 0) AS total_amount,
          COALESCE(SUM(qty), 0) AS total_qty
        FROM public.tbxeemhmoovdetail
        GROUP BY listid, status
      ) d ON l.listid = d.listid

      WHERE l.createuser = $1

      GROUP BY 
        l.listid,
        l.name,
        l.tel1,
        l.tel2,
        l.detail1,
        l.detail2,
        l.detail3,
        l.image,
        l.status,
        l.cdate,
        l.createuser,
        l.closedate,
        l.userclose

      ORDER BY l.cdate DESC
    `;

      const result = await dbExecution(dataQuery, [userId]);

      let rows = result?.rows || [];

      rows = rows.map((r) => {
        return {
          ...r,
          image: r.image
            ? r.image.split(",").map((img) => baseUrl + img.trim())
            : [],
        };
      });

      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
      };
    } catch (error) {
      console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  SelectListData_test = async (userId) => {
    try {
      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      // Fetch paginated cream data

      const dataQuery = `
           SELECT listid, name, tel1, tel2, detail1, detail2, detail3, image, 
           status, cdate,createuser, closedate, userclose
          FROM public.tbxeemhmoovlist 
           WHERE createuser=$1
           ORDER BY cdate DESC 
         `;

      const result = await dbExecution(dataQuery, [userId]);
      let rows = result?.rows || [];

      rows = await Promise.all(
        rows.map(async (r) => {
          return {
            ...r,
            image: r.image
              ? r.image.split(",").map((img) => baseUrl + img.trim())
              : [],
          };
        }),
      );

      // Response
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  // ====> Insert detail

  async insertDetail(
    listId,
    name,
    tel,
    province,
    district,
    village,
    price,
    qty,
    image,
    detail,
  ) {
    if (
      !listId ||
      !name ||
      !tel ||
      !province ||
      !district ||
      !village ||
      !price ||
      !qty ||
      !image
    ) {
      return {
        status: false,
        message: "Missing required fields",
        data: null,
      };
    }
    const generateId = () => {
      return Math.random().toString(36).substring(2, 10);
    };

    try {
      const id = generateId(); // Generate unique ID for the order

      const query = `
    INSERT INTO public.tbxeemhmoovdetail(
	listid, id, name, tel, province, district, village, price, qty, image, detail, status, cdate)VALUES (
    $1, $2, $3, $4, $5, $6, $7,$8,$9,$10,$11,'pending',NOW()) RETURNING *;
    `;

      const values = [
        listId,
        id,
        name,
        tel,
        province || "",
        district || "",
        village || "",
        price || 0,
        qty || "",
        image || "",
        detail || "",
      ];

      const result = await dbExecution(query, values);

      return {
        status: true,
        message: "Insert successful",
        data: result.rows,
      };
    } catch (error) {
      console.error("Error insertList:", error);

      return {
        status: false,
        message: "Internal Server Error",
        error: error.message,
      };
    }
  }

  // ===> update detail data
  async updateDetailData(listId, id, qty, status, userId, userComment) {
    try {
      if (!id || !status || !userId) {
        return {
          status: false,
          message: "Missing required fields",
          data: null,
        };
      }

      const fields = [];
      const values = [];
      let index = 1;

      if (status === "approved") {
        fields.push(`qty = $${index++}`);
        values.push(qty);

        fields.push(`status = 'approved'`);
        fields.push(`confirmdate = NOW()`);

        fields.push(`userconfirm = $${index++}`);
        values.push(userId);

        fields.push(`usercomment = 'Approved'`);
      } else if (status === "reject") {
        fields.push(`status = 'rejected'`);
        fields.push(`confirmdate = NOW()`);

        fields.push(`userconfirm = $${index++}`);
        values.push(userId);

        fields.push(`usercomment = $${index++}`);
        values.push(userComment || "Rejected");
      }

      // nothing update
      if (fields.length === 0) {
        return {
          status: false,
          message: "update fields cannot be empty",
          data: [],
        };
      }

      const query = `
      UPDATE public.tbxeemhmoovdetail
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING *;
    `;

      values.push(id);

      const result = await dbExecution(query, values);

      if (result.rows.length === 0) {
        return {
          status: false,
          message: "Data not found or invalid id",
          data: [],
        };
      }

      // ✅ insert loop here
      if (status === "approved") {
        for (let i = 0; i < qty; i++) {
          await this.insertListDetail(listId, id);
        }
      }

      return {
        status: true,
        message: "Update successful",
        data: result.rows,
      };
    } catch (error) {
      console.error("Error updateDetailData:", error);

      return {
        status: false,
        message: "Internal Server Error",
        error: error.message,
      };
    }
  }

  /// ===> select detail

  SelectDetailData = async (listId, page, limit) => {
    try {
      listId = parseInt(listId, 10);
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // Count total
      const countQuery = `
           SELECT COUNT(*) AS total
           FROM public.tbxeemhmoovdetail
           WHERE listid=$1;
         `;
      const countResult = await dbExecution(countQuery, [listId]);
      const total = parseInt(countResult.rows[0]?.total || 0, 10);

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      // Fetch paginated cream data
      const dataQuery = `
          SELECT listid, id, name, tel, province, district, village, price, qty, image, detail, status, cdate, 
          confirmdate, userconfirm, usercomment
          FROM public.tbxeemhmoovdetail 
           WHERE listid=$1  ORDER BY cdate DESC
           LIMIT $2 OFFSET $3;
         `;

      const result = await dbExecution(dataQuery, [listId, validLimit, offset]);
      let rows = result?.rows || [];

      rows = await Promise.all(
        rows.map(async (r) => {
          return {
            ...r,
            image: r.image
              ? r.image.split(",").map((img) => baseUrl + img.trim())
              : [],
          };
        }),
      );

      // Pagination data
      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      };

      // Response
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Errorw",
        data: [],
        pagination: null,
      };
    }
  };

  // search detail data by tel

  searchDetailData = async (tel) => {
    try {
      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      // Fetch paginated cream data
      const dataQuery = `
          SELECT listid, id, name, tel, province, district, village, price, qty, image, detail, status, cdate, 
          confirmdate, userconfirm, usercomment
          FROM public.tbxeemhmoovdetail 
          WHERE tel Ilike $1
         `;

      const result = await dbExecution(dataQuery, [`%${tel}%`]);
      let rows = result?.rows || [];

      rows = await Promise.all(
        rows.map(async (r) => {
          return {
            ...r,
            image: r.image
              ? r.image.split(",").map((img) => baseUrl + img.trim())
              : [],
          };
        }),
      );

      // Response
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  /// select detail data by group by status

  CountDetailData = async (listId) => {
    listId = parseInt(listId, 10);
    try {
      // Fetch paginated cream data
      const dataQuery = `SELECT count(*) as counted, sum(price) as total_amount , sum(qty) as qty, status
	  FROM public.tbxeemhmoovdetail where listid=$1 group by status;
         `;

      const result = await dbExecution(dataQuery, [listId]);
      let rows = result?.rows || [];

      // Response
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
      };
    }
  };

  // ==> insert list detail

  async insertListDetail(listId, id) {
    // ✅ Validate
    if (!listId || !id) {
      return;
    }

    try {
      const query = ` 
      INSERT INTO public.tbxeemhmoovlistdetail(
      listid, id, cdate)VALUES (
      $1, $2, NOW());
    `;

      const values = [listId, id];

      const result = await dbExecution(query, values);

      if (result.rowCount > 0) {
      }
    } catch (error) {
      //  console.error("Error insertList:", error);
    }
  }

  // select list detail data

  SelectListDetailData = async (page, limit) => {
    try {
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // Count total
      const countQuery = `
           SELECT COUNT(*) AS total
           FROM public.tbxeemhmoovlistdetail where listid=$1;
         `;
      const countResult = await dbExecution(countQuery, [listId]);
      const total = parseInt(countResult.rows[0]?.total || 0, 10);

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      // Fetch paginated cream data
      const dataQuery = `
         SELECT listid, id, listdetailid, name, tel, province, district, village, qty, cdate
         FROM public.tbxeemhmoovlistdetail where listid=$1 ORDER BY cdate DESC
         LIMIT $2 OFFSET $3;
         `;

      const result = await dbExecution(dataQuery, [listId, validLimit, offset]);
      let rows = result?.rows || [];

      rows = await Promise.all(
        rows.map(async (r) => {
          return {
            ...r,
            image: imgs.map((img) => baseUrl + img),
          };
        }),
      );

      // Pagination data
      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      };

      // Response
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
      };
    }
  };

  // ===> main function for switch case

  SelectListDetailData = async (listId, page, limit) => {
    try {
      listId = parseInt(listId, 10);
      const validPage = Math.max(parseInt(page, 10) || 0, 0);
      const validLimit = Math.max(parseInt(limit, 10) || 15, 1);
      const offset = validPage * validLimit;

      // Count total
      const countQuery = `
           SELECT COUNT(*) AS total
           FROM public.tbxeemhmoovdetail
           WHERE listid=$1;
         `;
      const countResult = await dbExecution(countQuery, [listId]);
      const total = parseInt(countResult.rows[0]?.total || 0, 10);

      const baseUrl = process.env.BASE_URL || "https://service.tsheb.la/";

      // Fetch paginated cream data
      const dataQuery = `
         select d.listid,d.id,name,tel,province,district,village,price,d.image,qty,status,d.cdate from public.tbxeemhmoovlistdetail a inner join 
 public.tbxeemhmoovdetail d on d.id=a.id where a.listId=$1 limit $2 offset $3;
         `;

      const result = await dbExecution(dataQuery, [listId, validLimit, offset]);
      let rows = result?.rows || [];

      rows = await Promise.all(
        rows.map(async (r) => {
          return {
            ...r,
            image: r.image
              ? r.image.split(",").map((img) => baseUrl + img.trim())
              : [],
          };
        }),
      );

      // Pagination data
      const pagination = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      };

      // Response
      return {
        status: true,
        message: rows.length > 0 ? "Query successful" : "No data found",
        data: rows,
        pagination,
      };
    } catch (error) {
      //console.error("Error in queryCreamDataAll:", error);
      // console.log(error);

      return {
        status: false,
        message: "Internal Server Errorw",
        data: [],
        pagination: null,
      };
    }
  };

  async monitorC(channel, detail) {
    // ✅ Validate
    if (!detail) {
      detail = "unknown action";
    }

    try {
      const query = ` 
      INSERT INTO public.tbmonitoring(
      channel, detail, cdate)VALUES (
      $1, $2, NOW());
    `;

      const values = [channel, detail];

      const result = await dbExecution(query, values);
    } catch (error) {
      //  console.error("Error insertList:", error);
    }
  }

  // Clean image array from PostgreSQL (handles all bad formats)
  async cleanImageArray(dbValue) {
    if (!dbValue) return [];

    let str = dbValue;

    // Convert array to string if needed
    if (Array.isArray(str)) {
      str = str.join(",");
    }

    // Remove { } and all quotes inside
    str = str.replace(/[{}"]/g, "");

    // Split into array
    const arr = str
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    return arr;
  }
}

export const xeemHmoovData = new classAllFunction();
