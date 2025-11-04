import Route from "express"; 
import { queryAdvertData,insertAdvertDataDetail,
    update_profile_image_data_detail_row
    ,update_profile_image_status
 } from "../../controllers/profile/profileimage.controllers.js"; 
 import { uploadImage } from "../../middleware/profile.uploadimage.js";
const route = Route();

route.get("/selectAll", queryAdvertData);
route.post("/insert", uploadImage,insertAdvertDataDetail);
route.put("/selectVideoOne", update_profile_image_data_detail_row);
route.put("/insert", update_profile_image_status);

export default route;
 