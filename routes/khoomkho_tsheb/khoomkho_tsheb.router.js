import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryKhoomKhoTshebDataAll,
  searchKhoomKhoTshebData,
  queryKhoomKhoTshebDataOne,
  updateProductData,
} from "../../controllers/khoomkho_tsheb/khoomkho_tsheb.controllers.js";
const route = Route();

route.get("/selectAll", queryKhoomKhoTshebDataAll);
route.get("/selectOne", queryKhoomKhoTshebDataOne);
route.get("/searchByName", searchKhoomKhoTshebData);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
