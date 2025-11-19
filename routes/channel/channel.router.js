import Route from "express"; 
import { queryChannelDataAll,queryChannelDataByOne,insertChannelDataDetail
    ,update_channel_status,update_channel_detail,update_channel_image
 } from "../../controllers/channel/channel.controllers.js"; 
 import { uploadChannelFiles } from "../../middleware/channel.uploadimage.js";
const route = Route(); 

route.get("/selectAll", queryChannelDataAll);
route.get("/selectOne", queryChannelDataByOne);
route.post("/insert", insertChannelDataDetail);
route.put("/updateStatus", update_channel_status);
route.put("/updateData", update_channel_detail);
route.put("/updateImage",uploadChannelFiles, update_channel_image);

export default route;











