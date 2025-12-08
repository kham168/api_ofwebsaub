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

route.get("/selectAll", verifyJWT, queryDormitoryDataAll);
route.get("/searchByName", verifyJWT, searchDormitoryData);
route.get("/selectByDistrictId", verifyJWT, queryDormitoryDataByDistrictId);
route.get("/selectByVillageId", verifyJWT, queryDormitoryDataByVillageId);
route.get("/selectOne", verifyJWT, queryDormitoryDataOne);
route.put("/updateActiveStatus", verifyJWT, UpdateActiveStatusDormitoryData);
route.put("/updateViewNumberOfThisId", verifyJWT, UpdateViewNumberOfThisId);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
