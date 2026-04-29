import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryLandDataOne,
  updateProductData,
} from "../../controllers/land/land.controllers.js";
const route = Route();

route.get("/selectOne", queryLandDataOne);
route.put("/updateData", verifyJWT, updateProductData);

export default route;
