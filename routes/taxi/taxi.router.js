import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_taxi_dataall,search_taxi_data,query_taxi_by_provinceid_and_districtid,query_taxi_by_districtid_and_villageid, query_taxi_dataone, insert_taxi_data, delete_taxi_data } from "../../controllers/taxi/taxi.controllers.js";
import { uploadimage } from "../../middleware/taxiimage.uploadimage.js";
const route = Route();

route.get("/selectall", query_taxi_dataall); //
route.post("/searchbyname", search_taxi_data);
route.post("/selectbyprovinceanddistrictid", query_taxi_by_provinceid_and_districtid);
route.post("/selectbydistrictandvillageid", query_taxi_by_districtid_and_villageid);
route.post("/selectone", query_taxi_dataone);
route.post("/insert", uploadimage,insert_taxi_data);
route.put("/update", delete_taxi_data);
 
export default route;