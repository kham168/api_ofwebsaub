import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryCreamDataAll,
  searchCreamData,
  queryCreamDataOne,
  insertCreamData,
  updateProductData,
} from "../../controllers/cream/cream.controllers.js";
import { uploadImage } from "../../middleware/cream.uploadImage.js";
const route = Route();

route.get("/selectAll", queryCreamDataAll);
route.get("/searchByName", searchCreamData);
route.get("/selectOne", queryCreamDataOne);
route.post("/insert", uploadImage, insertCreamData);
route.put("/updateData", updateProductData);
export default route;
