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
  UpdateViewNumberOfThisId,
  updateProductData,
} from "../../controllers/dormantal/dormantal.controllers.js";
import { uploadImage } from "../../middleware/dormitory.uploadimage.js";
const route = Route();

route.get("/selectAll", queryDormitoryDataAll);
route.get("/searchByName", searchDormitoryData);
route.get("/selectByDistrictId", queryDormitoryDataByDistrictId);
route.get("/selectByVillageId", queryDormitoryDataByVillageId);
route.get("/selectOne", queryDormitoryDataOne);
route.post("/insert", uploadImage, insertDormitoryData);
route.put("/updateActiveStatus", UpdateActiveStatusDormitoryData);
route.put("/updateViewNumberOfThisId", UpdateViewNumberOfThisId);
route.put("/updateData", updateProductData);
export default route;
