import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryChannelDataAll,
  queryChannelDataByOne,
  insertChannelDataDetail,
  updateChannelData,
} from "../../controllers/channel/channel.controllers.js";
import { uploadChannelFiles } from "../../middleware/channel.uploadimage.js";
const route = Route();

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
