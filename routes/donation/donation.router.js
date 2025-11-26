import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryKhoomKhoTshebDataAll,
  searchKhoomKhoTshebData,
  queryKhoomKhoTshebDataOne,
  insertKhoomKhoTshebData,
  updateProductData,
} from "../../controllers/khoomkho_tsheb/khoomkho_tsheb.controllers.js";
import { uploadImage } from "../../middleware/khoomkho_tsheb.uploadimage.js";
const route = Route();

route.get("/selectAll", queryKhoomKhoTshebDataAll);
route.get("/selectOne", queryKhoomKhoTshebDataOne);
route.get("/searchByName", searchKhoomKhoTshebData);
route.post("/insert", uploadImage, insertKhoomKhoTshebData);
route.put("/updateData", updateProductData);
export default route;
