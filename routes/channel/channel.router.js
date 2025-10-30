import Route from "express"; 
import { query_channel_data_all,query_channel_data_by_one,query_channel_video_data_all,query_channel_vieo_data_by_one,
    insert_channel_data_detail,insert_channel_video_url,update_channel_status,update_channel_detail,update_channel_people_inform,
    update_channel_video_url,delete_channel_image_url,
    insert_channel_image_url
 } from "../../controllers/channel/channel.controllers.js"; 
 import { uploadimage } from "../../middleware/channel.uploadimage.js";
const route = Route();

route.get("/selectall", query_channel_data_all);
route.post("/selectone", query_channel_data_by_one);
route.get("/selectvidioall", query_channel_video_data_all);
route.post("/selectvidioone", query_channel_vieo_data_by_one);
route.post("/insert", insert_channel_data_detail);
route.post("/insertvideo",insert_channel_video_url);
route.post("/insertimage", uploadimage,insert_channel_image_url);
route.put("/taxiimage", update_channel_status);
route.put("/tshuajimage", update_channel_detail);
route.put("/webprofileimage", update_channel_people_inform); 
route.put("/tshuajimage", update_channel_video_url);
route.post("/webprofileimage", delete_channel_image_url); 

export default route;











