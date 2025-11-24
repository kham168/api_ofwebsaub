import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryHouseDataAll,
  searchHouseData,
  queryHouseDataByDistrictId,
  queryHouseDataByVillageId,
  queryHouseDataOne,
  insertHouseData,
  updateProductData,
} from "../../controllers/house/house.controllers.js";
import { uploadImages } from "../../middleware/house.uploadimage.js";
const route = Route();

route.get("/selectAll", queryHouseDataAll); // done 100 % lawm os
route.get("/searchByName", searchHouseData); // done 100 % lawm os
route.get("/selectByDistrictId", queryHouseDataByDistrictId); // done 100 % lawm os
route.get("/selectByVillageId", queryHouseDataByVillageId); // done 100 % lawm os
route.get("/selectOne", queryHouseDataOne); // done 100 % lawm os
route.post("/insert", uploadImages, insertHouseData); // done 100 % lawm os
route.put("/updateData", updateProductData); // done 100 % lawm os

export default route;
