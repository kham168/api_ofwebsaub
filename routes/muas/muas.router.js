import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryMuasDataAll,
  searchMuasData,
  queryMuasDataOne,
  insertMuasData,
  updateProductData,
} from "../../controllers/muas/muas.controllers.js";
import { uploadImage } from "../../middleware/muas.uploadimage.js";
const route = Route();

route.get("/selectAll", queryMuasDataAll);
route.get("/searchByName", searchMuasData);
route.get("/selectOne", queryMuasDataOne);
route.post("/insert", uploadImage, insertMuasData);
route.put("/updateData", updateProductData);
export default route;
