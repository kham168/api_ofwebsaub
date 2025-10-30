import Route from "express"; 
import { query_profile_image_data_all,query_profile_image_data_by_id,insert_profile_data_detail,
    update_profile_image_data_detail_row
    ,update_profile_image_status
 } from "../../controllers/profile/profileimage.controllers.js"; 
 import { uploadimage } from "../../middleware/profile.uploadimage.js";
const route = Route();

route.get("/selectall", query_profile_image_data_all);
route.post("/selectone", query_profile_image_data_by_id);
route.post("/insert", uploadimage,insert_profile_data_detail);
route.put("/selectvidioone", update_profile_image_data_detail_row);
route.put("/insert", update_profile_image_status);

export default route;












