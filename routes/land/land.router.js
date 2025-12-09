import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryLandDataAll,
  queryLandDataOne,
  queryLandDataByDistrictId,
  queryLandDataByVillageId,
  updateProductData,
} from "../../controllers/land/land.controllers.js";
const route = Route();

route.get("/selectAll", queryLandDataAll);
route.get("/selectOne", queryLandDataOne);
route.get("/selectByDistrictId", queryLandDataByDistrictId);
route.get("/selectByVillageId", queryLandDataByVillageId);
route.put("/updateData", verifyJWT, updateProductData);

export default route;
