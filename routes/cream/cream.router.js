import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryCreamDataAll,
  searchCreamData,
  queryCreamDataOne,
  updateProductData,
} from "../../controllers/cream/cream.controllers.js";
const route = Route();

route.get("/selectAll", queryCreamDataAll);
route.get("/searchByName", searchCreamData);
route.get("/selectOne", queryCreamDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
