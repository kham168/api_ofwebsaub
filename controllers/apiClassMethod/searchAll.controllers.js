import { searchAllData } from "../class/classSearchDataAll.js";

export const searchDataAll = async (req, res) => {
  try {
    // ✅ convert to number

    const channelId = parseInt(req.query.channelId) || 0;
    const detail = req.query.detail || "";
    const dId = req.query.dId || "";
    const vId = req.query.vId || "";
    // const page = parseInt(req.query.page) || 0;
    // const limit = parseInt(req.query.limit) || 25;

    let data = [];

    // ✅ cleaner switch
    switch (channelId) {
      case 1:
        data = await searchAllData.SearchCreamData(detail);
        break;

      case 2:
        data = await searchAllData.searchDormitoryData(detail, dId, vId);
        break;

      case 3:
        data = await searchAllData.searchHouseData(detail, dId, vId);
        break;

      case 4:
        data = await searchAllData.searchOtherService(detail, dId, vId);
        break;

      case 5:
        data = await searchAllData.searchLandData(dId, vId);
        break;

      case 6:
        data = await searchAllData.searchTshuajData(detail);
        break;

      case 7:
        data = await searchAllData.searchTaxiData(detail, dId, vId);
        break;

      default:
        return res.status(400).json({
          status: false,
          message: "Invalid channelId",
          data: [],
        });
    }

    // ✅ response ib zaug xwb
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in searchDataAll:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};
