import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryTshuajDataAll,
  searchTshuajData,
  queryTshuajDataOne,
  insertTshuajData,
  updateProductData,
} from "../../controllers/tshuaj/tshuaj.controllers.js";
import { uploadImage } from "../../middleware/tshuaj.uploadimage.js";
const route = Route();

route.get("/selectAll", queryTshuajDataAll);
route.get("/searchByName", searchTshuajData);
route.get("/selectOne", queryTshuajDataOne);
route.post("/insert", uploadImage, insertTshuajData);
route.put("/updateData", updateProductData);
export default route;
