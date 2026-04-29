import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryCreamDataOne,
  updateProductData,
} from "../../controllers/cream/cream.controllers.js";
const route = Route();

route.get("/selectOne", queryCreamDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
