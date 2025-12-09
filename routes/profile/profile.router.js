import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryAdvertData,
  insertAdvertDataDetail,
  updateProfileDataDetail,
} from "../../controllers/profile/profileimage.controllers.js";
import { uploadImage } from "../../middleware/profile.uploadimage.js";
const route = Route();

route.get("/selectAll", queryAdvertData);
route.post("/insert", verifyJWT, uploadImage, insertAdvertDataDetail);
route.put("/updateStatus", verifyJWT, updateProfileDataDetail);

export default route;
