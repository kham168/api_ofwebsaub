import { xeemHmoovData } from "../class/xeemhmoov.controller.js";

export const InsertData = async (req, res) => {
  try {
    const {
      channel,
      listId,
      id,
      name,
      tel,
      tel1,
      tel2,
      province,
      district,
      village,
      qty,
      price,
      detail,
      detail1,
      detail2,
      detail3,
      status,
      userId,
      userComment,
    } = req.body;

    let data = [];
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
    const action = Number(channel);

    // ✅ cleaner switch
    switch (action) {
      case 9:
        data = await xeemHmoovData.insertList(
          name,
          tel1,
          tel2,
          detail1,
          detail2,
          detail3,
          imageArray.join(","),
          userId,
        );
        break;

      case 10:
        data = await xeemHmoovData.insertDetail(
          listId,
          name,
          tel,
          province,
          district,
          village,
          price,
          qty,
          imageArray.join(","),
          detail,
        );
        break;

      case 11:
        data = await xeemHmoovData.updateListData(
          listId,
          name,
          tel1,
          tel2,
          detail1,
          detail2,
          detail3,
          imageArray.join(","),
          status,
          userId,
        );
        break;

      case 12:
        data = await xeemHmoovData.updateDetailData(
          listId,
          id,
          qty,
          status,
          userId,
          userComment,
        );
        break;

      default:
        return res.status(400).json({
          status: false,
          message: "Invalid action",
          data: [],
        });
    }

    // ✅ response ib zaug xwb
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in selectDataAll:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const querydata = async (req, res) => {
  try {
    const actions = parseInt(req.query.channel) || 0;
    const listId = parseInt(req.query.listId) || 0;
    const id = parseInt(req.query.id) || 0;
    const tel = parseInt(req.query.tel) || 0;
    const userId = parseInt(req.query.userId) || 0;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 15;

    let data = [];

    const action = Number(actions);
    // ✅ cleaner switch
    switch (action) {
      case 13:
        data = await xeemHmoovData.SelectListData(userId);
        break;

      case 14:
        data = await xeemHmoovData.SelectDetailData(listId, page, limit);
        break;

      case 15:
        data = await xeemHmoovData.SelectListDetailData(
          listId,
          id,
          page,
          limit,
        );
        break;

      case 16:
        data = await xeemHmoovData.CountDetailData(listId);
        break;

      case 17:
        data = await xeemHmoovData.searchDetailData(tel);
        break;

      case 18:
        data = await xeemHmoovData.SelectListDetailData(listId, page, limit);
        break;

      default:
        return res.status(400).json({
          status: false,
          message: "Invalid action",
          data: [],
        });
    }

    // ✅ response ib zaug xwb
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in selectDataAll:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};
