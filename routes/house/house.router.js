import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryHouseDataOne,
  updateProductData,
} from "../../controllers/house/house.controllers.js";
const route = Route();

route.get("/selectOne", queryHouseDataOne);
route.put("/updateData", verifyJWT, updateProductData);

export default route;
