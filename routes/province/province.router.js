import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  quer_province_dataall,
  quer_province_dataone,
} from "../../controllers/province/province.controllers.js"; //"../../controllers/provice/provice.controllers.js";
const route = Route();

route.get("/selectall", verifyJWT, quer_province_dataall);
route.post("/selectone", verifyJWT, quer_province_dataone);

export default route;
