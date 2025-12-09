import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryTshuajDataAll,
  searchTshuajData,
  queryTshuajDataOne,
  updateProductData,
} from "../../controllers/tshuaj/tshuaj.controllers.js";
const route = Route();

route.get("/selectAll", queryTshuajDataAll);
route.get("/searchByName", searchTshuajData);
route.get("/selectOne", queryTshuajDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
