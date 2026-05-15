import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import { uploadImage } from "../../middleware/upload.Image.js";
import {
  InsertData,
  querydata,
} from "../../controllers/apiClassMethod/xeemhmoov.controller.js";
const route = Route();

route.post("/insert", uploadImage, InsertData);
route.get("/select", querydata);
export default route;
