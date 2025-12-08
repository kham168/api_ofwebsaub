import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryTaxiDataAll,
  searchTaxiData,
  queryTaxiByProvinceIdAndDistrictId,
  queryTaxiByDistrictIdAndVillageId,
  queryTaxiDataOne,
  updateProductData,
} from "../../controllers/taxi/taxi.controllers.js";
const route = Route();

route.get("/selectAll", verifyJWT, queryTaxiDataAll);
route.get("/searchByName", verifyJWT, searchTaxiData);
route.get("/selectByDistrictId", verifyJWT, queryTaxiByProvinceIdAndDistrictId);
route.get("/selectByVillageId", verifyJWT, queryTaxiByDistrictIdAndVillageId);
route.get("/selectOne", verifyJWT, queryTaxiDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
