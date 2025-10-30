import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_land_dataall, query_land_dataone,query_land_data_by_district_or_arean,query_land_data_by_district_and_villageid, 
    insert_land_data, update_active_status_land_data,query_land_data_by_province_and_districtid, update_side_and_price_land_data, 
    update_new_link_and_detail_land_data } from "../../controllers/land/land.controllers.js";
import { uploadimage } from "../../middleware/land.uploadimage.js";
const route = Route();

route.get("/selectall", query_land_dataall); 
route.post("/selectone", query_land_dataone);
route.post("/selectbyprovinceidanddistrictid", query_land_data_by_province_and_districtid);
route.post("/selectbydistrictidandvillageid", query_land_data_by_district_and_villageid);
route.post("/selectbydistrictidandarean", query_land_data_by_district_or_arean);
route.post("/insert",uploadimage,insert_land_data);
route.put("/update_active_status_land_data", update_active_status_land_data);
route.put("/update_side_and_price_land_data", update_side_and_price_land_data);
route.put("/update_new_link_and_detail_land_data", update_new_link_and_detail_land_data); 

export default route;
