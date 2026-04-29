import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryTaxiDataOne,
  updateProductData,
} from "../../controllers/taxi/taxi.controllers.js";
const route = Route();

route.get("/selectOne", queryTaxiDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
