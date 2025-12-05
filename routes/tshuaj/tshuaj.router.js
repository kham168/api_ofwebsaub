import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
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
route.put("/updateData", updateProductData);
export default route;
