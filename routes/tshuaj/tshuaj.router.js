import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryTshuajDataAll,
  searchTshuajData,
  queryTshuajDataOne,
  updateProductData,
} from "../../controllers/tshuaj/tshuaj.controllers.js";
const route = Route();

route.get("/selectAll", verifyJWT, queryTshuajDataAll);
route.get("/searchByName", verifyJWT, searchTshuajData);
route.get("/selectOne", verifyJWT, queryTshuajDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
