import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryDistrictDataAll,
  queryDistrictDataByProvinceId,
  queryDistrictDataOne,
  insertDistrictData,
  updateDistrictData,
} from "../../controllers/district/district.controllers.js";
const route = Route();

route.get("/selectAll", queryDistrictDataAll);
route.get("/selectByProvinceId", queryDistrictDataByProvinceId);
route.get("/selectOne", queryDistrictDataOne);
route.post("/insert", verifyJWT, insertDistrictData);
route.put("/update", verifyJWT, updateDistrictData);

export default route;
