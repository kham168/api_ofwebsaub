import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_village_dataall,query_village_dataone,query_village_data_by_district_id, insert_village_data, update_village_data } from "../../controllers/village/village.controllers.js";
const route = Route();

route.get("/selectall", query_village_dataall); 
route.post("/selectbyvillageid", query_village_dataone); 
route.post("/selectbydistrictid", query_village_data_by_district_id);
route.post("/insert", insert_village_data);
route.put("/update", update_village_data);

export default route;
