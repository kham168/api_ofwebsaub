import Route from "express";
import { query_district_dataall, query_district_dataone,query_district_data_by_province_id, insert_district_data, update_district_data } from "../../controllers/district/district.controllers.js";
const route = Route();

route.get("/selectall", query_district_dataall);
route.post("/selectbyprovinceid", query_district_data_by_province_id);
route.post("/selectone", query_district_dataone);
route.post("/insert", insert_district_data);
route.put("/update", update_district_data);
 
export default route;