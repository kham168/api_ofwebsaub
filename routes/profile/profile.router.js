import Route from "express"; 
import { queryAdvertData,insertAdvertDataDetail,
    updateProfileDataDetail
 } from "../../controllers/profile/profileimage.controllers.js"; 
 import { uploadImage } from "../../middleware/profile.uploadimage.js";
const route = Route();

route.get("/selectAll", queryAdvertData);
route.post("/insert", uploadImage,insertAdvertDataDetail);
route.put("/updateStatus", updateProfileDataDetail);

export default route;
 