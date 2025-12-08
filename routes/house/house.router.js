import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryHouseDataAll,
  searchHouseData,
  queryHouseDataByDistrictId,
  queryHouseDataByVillageId,
  queryHouseDataOne,
  updateProductData,
} from "../../controllers/house/house.controllers.js";
const route = Route();

route.get("/selectAll", verifyJWT, queryHouseDataAll);
route.get("/searchByName", verifyJWT, searchHouseData);
route.get("/selectByDistrictId", verifyJWT, queryHouseDataByDistrictId);
route.get("/selectByVillageId", verifyJWT, queryHouseDataByVillageId);
route.get("/selectOne", verifyJWT, queryHouseDataOne);
route.put("/updateData", verifyJWT, updateProductData);

export default route;
