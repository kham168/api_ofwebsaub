import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryProvinceDataAll,
  queryProvinceDataOne,
} from "../../controllers/province/province.controllers.js";
const route = Route();

route.get("/selectAll", queryProvinceDataAll);
route.post("/selectOne", queryProvinceDataOne);

export default route;
