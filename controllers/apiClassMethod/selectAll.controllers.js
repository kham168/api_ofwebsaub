import { dbExecution } from "../../config/dbConfig.js";
import { QueryTopData } from "../class/class.controller.js";
import { selectAllData } from "../class/classSelectDataAll.js";

export const selectDataAll = async (req, res) => {
  try {
    const channelId = parseInt(req.query.channelId) || 0;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 15;

    let data = [];

    // ✅ cleaner switch
    switch (channelId) {
      case 1:
        //console.Consolelog("Selecting cream data with page:", page, "and limit:", limit);

        data = await selectAllData.queryCreamDataAll(page, limit);
        break;

      case 2:
        data = await selectAllData.queryDormitoryDataAll(page, limit);
        break;

      case 3:
        data = await selectAllData.queryHouseDataAll(page, limit);
        break;

      case 4:
        data = await selectAllData.queryOtherServiceDataAll(page, limit);
        break;

      case 5:
        data = await selectAllData.queryLandDataAll(page, limit);
        break;

      case 6:
        data = await selectAllData.queryTshuajDataAll(page, limit);
        break;

      case 7:
        data = await selectAllData.queryTaxiDataAll(page, limit);
        break;

      default:
        return res.status(400).json({
          status: false,
          message: "Invalid channelIdddd",
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
