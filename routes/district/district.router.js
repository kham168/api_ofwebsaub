import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  query_district_dataall,
  query_district_dataone,
  query_district_data_by_province_id,
  insert_district_data,
  update_district_data,
} from "../../controllers/district/district.controllers.js";
const route = Route();

route.get("/selectall", verifyJWT, query_district_dataall);
route.post(
  "/selectByProvinceId",
  verifyJWT,
  query_district_data_by_province_id
);
route.post("/selectOne", verifyJWT, query_district_dataone);
route.post("/insert", verifyJWT, insert_district_data);
route.put("/update", verifyJWT, update_district_data);

export default route;
