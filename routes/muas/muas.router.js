import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryMuasDataAll,
  searchMuasData,
  queryMuasDataOne,
  updateProductData,
} from "../../controllers/muas/muas.controllers.js";
const route = Route();

route.get("/selectAll", queryMuasDataAll);
route.get("/searchByName", searchMuasData);
route.get("/selectOne", queryMuasDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
