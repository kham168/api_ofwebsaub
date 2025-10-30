import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_house_dataall,search_house_data,query_house_data_byprovinceid_and_districtid,query_house_data_districtid_and_villageid, query_house_dataone,query_house_data_by_district_or_arean, 
    insert_house_data, update_active_status_house_data, update_price_house_data, 
    update_location_and_detail_house_data } from "../../controllers/house/house.controllers.js";
import { uploadImages } from "../../middleware/house.uploadimage.js";
const route = Route();


route.get("/selectall", query_house_dataall);
//route.get("/selectallwithimage", query_land_dataall_with_images);
route.post("/searchbyname", search_house_data);
route.post("/selectbyprovinceidandfistrictid", query_house_data_byprovinceid_and_districtid);
route.post("/selectbydistrictidandvillageid", query_house_data_districtid_and_villageid);
route.post("/selectone", query_house_dataone);
route.post("/selectbydistrictandarean", query_house_data_by_district_or_arean);
route.post("/insert", uploadImages,insert_house_data);
route.put("/update_active_status_house_data", update_active_status_house_data);
route.put("/update_price_house_data", update_price_house_data);
route.put("/update_location_and_detail_house_data", update_location_and_detail_house_data);
 

export default route;