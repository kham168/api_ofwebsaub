import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryDormitoryDataAll,
  searchDormitoryData,
  queryDormitoryDataByDistrictId,
  queryDormitoryDataByVillageId,
  queryDormitoryDataOne,
  UpdateActiveStatusDormitoryData,
  UpdateViewNumberOfThisId,
  updateProductData,
} from "../../controllers/dormitory/dormitory.controllers.js";
const route = Route();

route.get("/selectAll", queryDormitoryDataAll);
route.get("/searchByName", searchDormitoryData);
route.get("/selectByDistrictId", queryDormitoryDataByDistrictId);
route.get("/selectByVillageId", queryDormitoryDataByVillageId);
route.get("/selectOne", queryDormitoryDataOne);
route.put("/updateActiveStatus", verifyJWT, UpdateActiveStatusDormitoryData);
route.put("/updateViewNumberOfThisId", verifyJWT, UpdateViewNumberOfThisId);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
