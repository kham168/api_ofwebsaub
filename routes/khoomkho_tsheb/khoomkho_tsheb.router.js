import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryKhoomKhoTshebDataOne,
  updateProductData,
} from "../../controllers/khoomkho_tsheb/khoomkho_tsheb.controllers.js";
const route = Route();

route.get("/selectOne", queryKhoomKhoTshebDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
