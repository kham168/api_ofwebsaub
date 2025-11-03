import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryDormitoryDataAll,
  searchDormitoryData,
  queryDormitoryDataByDistrictId,
  queryDormitoryDataByVillageId,
  queryDormitoryDataOne,
  insertDormitoryData,
  UpdateActiveStatusDormitoryData,
  UpdateDormitoryRoomAndActiveRoomData,
  UpdateDormitoryPricePerRoomData,
  UpdateViewNumberOfThisId,
} from "../../controllers/dormantal/dormantal.controllers.js";
import { uploadImage } from "../../middleware/dormitory.uploadimage.js";
const route = Route();

route.get("/selectAll/:page/:limit", queryDormitoryDataAll); //done 100% lawm os
route.get("/searchByName/:name/:page/:limit", searchDormitoryData); //done 100% lawm os
route.get(
  "/selectByDistrictId/:districtId/:page/:limit",
  queryDormitoryDataByDistrictId
); //done 100% lawm os
route.get(
  "/selectByVillageId/:villageId/:page/:limit",
  queryDormitoryDataByVillageId
); //done 100% lawm os
route.get("/selectOne/:id", queryDormitoryDataOne); //done 100% lawm os
route.post("/insert", uploadImage, insertDormitoryData); //done 100% lawm os
route.put("/updateActiveStatus", UpdateActiveStatusDormitoryData); // yuav tau saib ntxiv os
route.put(
  "/updateTypeAndTotalRoomAndActiveRoom",
  UpdateDormitoryRoomAndActiveRoomData
); // yuav tau saib ntxiv os
route.put("/updatePrice", UpdateDormitoryPricePerRoomData); // yuav tau saib ntxiv os
route.put("/updateViewNumberOfThisId", UpdateViewNumberOfThisId); //yuam tau saib ntxiv os

export default route;
