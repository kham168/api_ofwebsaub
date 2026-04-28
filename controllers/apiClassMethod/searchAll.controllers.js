import { searchAllData } from "../class/classSearchDataAll.js";

export const searchDataAll = async (req, res) => {
  try {
    // ✅ convert to number

    const channelId = parseInt(req.query.channelId) || 0;
    const detail = req.query.detail || "";
    const dId = req.query.dId || "";
    const vId = req.query.vId || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 15;

    let data = [];

    // ✅ cleaner switch
    switch (channelId) {
      case 1:
        data = await searchAllData.SearchCreamData(detail, page, limit);
        break;

      case 2:
        data = await searchAllData.searchDormitoryDataByDistrictId(
          detail,
          dId,
          vId,
          page,
          limit,
        );
        break;

      case 3:
        data = await searchAllData.searchHouseDataByDistrictId(
          detail,
          dId,
          vId,
          page,
          limit,
        );
        break;

      case 4:
        data = await searchAllData.searchOtherServiceDataAll(page, limit);
        break;

      case 5:
        data = await searchAllData.searchLandDataByDistrictId(page, limit);
        break;

      case 6:
        data = await searchAllData.searchTshuajData(page, limit);
        break;

      case 7:
        data = await searchAllData.searchTaxiData(page, limit);
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
