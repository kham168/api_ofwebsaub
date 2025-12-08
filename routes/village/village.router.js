import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  query_village_dataall,
  query_village_dataone,
  query_village_data_by_district_id,
  insert_village_data,
  update_village_data,
} from "../../controllers/village/village.controllers.js";
const route = Route();

route.get("/selectall", verifyJWT, query_village_dataall);
route.post("/selectbyvillageid", verifyJWT, query_village_dataone);
route.post("/selectbydistrictid", verifyJWT, query_village_data_by_district_id);
route.post("/insert", verifyJWT, insert_village_data);
route.put("/update", verifyJWT, update_village_data);

export default route;
