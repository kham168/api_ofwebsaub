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

route.get("/selectAll", verifyJWT, queryLandDataAll);
route.get("/selectOne", verifyJWT, queryLandDataOne);
route.get("/selectByDistrictId", verifyJWT, queryLandDataByDistrictId);
route.get("/selectByVillageId", verifyJWT, queryLandDataByVillageId);
route.put("/updateData", verifyJWT, updateProductData);

export default route;
