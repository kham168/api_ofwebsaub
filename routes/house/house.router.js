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

route.get("/selectAll", queryHouseDataAll);
route.get("/searchByName", searchHouseData);
route.get("/selectByDistrictId", queryHouseDataByDistrictId);
route.get("/selectByVillageId", queryHouseDataByVillageId);
route.get("/selectOne", queryHouseDataOne);
route.put("/updateData", verifyJWT, updateProductData);

export default route;
