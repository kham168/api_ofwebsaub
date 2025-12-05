import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
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
//route.post("/insert", uploadImage, insertKhoomKhoTshebData);
route.put("/updateData", updateProductData);
export default route;
