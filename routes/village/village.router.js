import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryVillageDataAll,
  queryVillageDataOne,
  queryVillageDataByDistrictId,
  searchVillageDataByDistrictIdAndVillageName,
  insertVillageData,
  updateVillageData,
} from "../../controllers/village/village.controllers.js";
const route = Route();

route.get("/selectAll", queryVillageDataAll);
route.get("/selectByVillageId", queryVillageDataOne);
route.get("/selectByDistrictId", queryVillageDataByDistrictId);
route.get("/searchVillageByDtIdAndVlName", searchVillageDataByDistrictIdAndVillageName);
route.post("/insert", verifyJWT, insertVillageData);
route.put("/update", verifyJWT, updateVillageData);

export default route;
