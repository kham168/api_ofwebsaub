import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryChannelDataAll,
  queryChannelDataByOne,
  insertChannelDataDetail,
  updateChannelData,
} from "../../controllers/channel/channel.controllers.js";
import { sendWhatsasppMessage,sendWhatsappMessaged } from "../../controllers/test/test.js";
import { uploadChannelFiles } from "../../middleware/channel.uploadimage.js";
const route = Route();

route.post("/12", sendWhatsasppMessage);
route.post("/1234", sendWhatsappMessaged);
route.get("/selectAll", queryChannelDataAll);
route.get("/selectOne", queryChannelDataByOne);
route.post("/insert", verifyJWT, insertChannelDataDetail);
route.put(
  "/updateChannelData",
  verifyJWT,
  uploadChannelFiles,
  updateChannelData
);

export default route;
