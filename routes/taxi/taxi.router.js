import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryTaxiDataAll,
  searchTaxiData,
  queryTaxiByProvinceIdAndDistrictId,
  queryTaxiByDistrictIdAndVillageId,
  queryTaxiDataOne,
  insert_taxi_data,
  updateProductData,
} from "../../controllers/taxi/taxi.controllers.js";
import { uploadImage } from "../../middleware/taxiImage.uploadImage.js";
const route = Route();

route.get("/selectAll", queryTaxiDataAll);
route.get("/searchByName", searchTaxiData);
route.get("/selectByDistrictId", queryTaxiByProvinceIdAndDistrictId);
route.get("/selectByVillageId", queryTaxiByDistrictIdAndVillageId);
route.get("/selectOne", queryTaxiDataOne);
route.post("/insert", uploadImage, insert_taxi_data);
route.put("/updateData", updateProductData);
export default route;
