import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryTaxiDataAll,
  searchTaxiData,
  queryTaxiByProvinceIdAndDistrictId,
  queryTaxiByDistrictIdAndVillageId,
  queryTaxiDataOne,
  updateProductData,
} from "../../controllers/taxi/taxi.controllers.js"; 
const route = Route();

route.get("/selectAll", queryTaxiDataAll);
route.get("/searchByName", searchTaxiData);
route.get("/selectByDistrictId", queryTaxiByProvinceIdAndDistrictId);
route.get("/selectByVillageId", queryTaxiByDistrictIdAndVillageId);
route.get("/selectOne", queryTaxiDataOne); 
route.put("/updateData", updateProductData);
export default route;
