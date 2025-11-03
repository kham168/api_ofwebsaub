import Route from "express"; 
import { queryChannelDataAll,queryChannelDataByOne,insertChannelDataDetail
    ,insert_channel_video_url,update_channel_status,update_channel_detail,update_channel_people_inform,
    update_channel_video_url,delete_channel_image_url,
    insert_channel_image_url
 } from "../../controllers/channel/channel.controllers.js"; 
 import { uploadimage } from "../../middleware/channel.uploadimage.js";
const route = Route();

route.get("/selectAll", queryChannelDataAll);
route.get("/selectOne/:id", queryChannelDataByOne);
route.post("/insert", insertChannelDataDetail);
route.post("/insertVideo",insert_channel_video_url);
route.post("/insertImage", uploadimage,insert_channel_image_url);
route.put("/taxiImage", update_channel_status);
route.put("/tshuajImage", update_channel_detail);
route.put("/webProfileImage", update_channel_people_inform); 
route.put("/tshuajImaged", update_channel_video_url);
route.post("/webProfileImaged", delete_channel_image_url); 

export default route;











