import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryVillageDataAll,
  queryVillageDataOne,
  queryVillageDataByDistrictId,
  insertVillageData,
  updateVillageData,
} from "../../controllers/village/village.controllers.js";
const route = Route();

route.get("/selectAll", queryVillageDataAll);
route.post("/selectByVillageId", queryVillageDataOne);
route.post("/selectByDistrictId", queryVillageDataByDistrictId);
route.post("/insert", verifyJWT, insertVillageData);
route.put("/update", verifyJWT, updateVillageData);

export default route;
