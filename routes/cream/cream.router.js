import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryCreamDataAll,
  searchCreamData,
  queryCreamDataOne,
  updateProductData,
} from "../../controllers/cream/cream.controllers.js";
const route = Route();

route.get("/selectAll", verifyJWT, queryCreamDataAll);
route.get("/searchByName",verifyJWT, searchCreamData);
route.get("/selectOne",verifyJWT, queryCreamDataOne); 
route.put("/updateData",verifyJWT, updateProductData);
export default route;
