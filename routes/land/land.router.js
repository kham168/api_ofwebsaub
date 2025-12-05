import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryLandDataAll,
  queryLandDataOne,
  queryLandDataByDistrictId,
  queryLandDataByVillageId,
  updateProductData,
} from "../../controllers/land/land.controllers.js"; 
const route = Route();

route.get("/selectAll", queryLandDataAll);
route.get("/selectOne", queryLandDataOne);
route.get("/selectByDistrictId", queryLandDataByDistrictId);
route.get("/selectByVillageId", queryLandDataByVillageId);
//route.post("/insert", uploadImage, insertLandData);
route.put("/updateData", updateProductData);

export default route;
