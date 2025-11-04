import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryTaxiDataAll,
  searchTaxiData,
  queryTaxiByProvinceIdAndDistrictId,
  queryTaxiByDistrictIdAndVillageId,
  queryTaxiDataOne,
  insert_taxi_data,
  delete_taxi_data,
} from "../../controllers/taxi/taxi.controllers.js";
import { uploadImage } from "../../middleware/taxiImage.uploadImage.js";
const route = Route(); // l?page=0&limit=25

route.get("/selectAll", queryTaxiDataAll); // done 100 % lawm os
route.get("/searchByName", searchTaxiData); // done 100 % lawm os
route.get("/selectByDistrictId", queryTaxiByProvinceIdAndDistrictId); // done 100 % lawm os
route.get("/selectByVillageId", queryTaxiByDistrictIdAndVillageId); // done 100 % lawm os
route.get("/selectOne", queryTaxiDataOne); // done 100 % lawm os
route.post("/insert", uploadImage, insert_taxi_data); // done 100 % lawm os
route.put("/update", delete_taxi_data); // yuav tau saib ntxiv

export default route;
