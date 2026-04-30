import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryOtherServiceDataOne,
  updateProductData,
} from "../../controllers/otherservice/otherservice.controllers.js";
const route = Route();

route.get("/selectOne", queryOtherServiceDataOne);
route.put("/updateData", verifyJWT, updateProductData);
export default route;
