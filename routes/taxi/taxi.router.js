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
const route = Route();

route.get("/selectAll/:page/:limit", queryTaxiDataAll); // done 100 % lawm os
route.get("/searchByName/:name/:page/:limit", searchTaxiData); // done 100 % lawm os
route.get(
  "/selectByDistrictId/:districtId/:page/:limit",
  queryTaxiByProvinceIdAndDistrictId
); // done 100 % lawm os
route.get(
  "/selectByVillageId/:villageId/:page/:limit",
  queryTaxiByDistrictIdAndVillageId
); // done 100 % lawm os
route.get("/selectOne/:id", queryTaxiDataOne); // done 100 % lawm os
route.post("/insert", uploadImage, insert_taxi_data); // done 100 % lawm os
route.put("/update", delete_taxi_data); // yuav tau saib ntxiv

export default route;
