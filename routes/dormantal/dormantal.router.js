import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryDormitoryDataOne,
  UpdateActiveStatusDormitoryData,
  UpdateViewNumberOfThisId,
  updateProductData,
} from "../../controllers/dormitory/dormitory.controllers.js";
const route = Route();

route.get("/selectOne", queryDormitoryDataOne);
route.put("/updateActiveStatus", verifyJWT, UpdateActiveStatusDormitoryData);
route.put("/updateViewNumberOfThisId", verifyJWT, UpdateViewNumberOfThisId);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
