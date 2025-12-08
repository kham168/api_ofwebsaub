import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryKhoomKhoTshebDataAll,
  searchKhoomKhoTshebData,
  queryKhoomKhoTshebDataOne,
  updateProductData,
} from "../../controllers/khoomkho_tsheb/khoomkho_tsheb.controllers.js";
const route = Route();

route.get("/selectAll", verifyJWT, queryKhoomKhoTshebDataAll);
route.get("/selectOne", verifyJWT, queryKhoomKhoTshebDataOne);
route.get("/searchByName", verifyJWT, searchKhoomKhoTshebData);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
