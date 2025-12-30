import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryUserDataAll,
  queryUserDataOne,
  createNewUser,
  insertDataOfAnyFunction02,
  insertDataOfAnyFunction01,
  userLogin,
  updateUserData,
  updateProductStatus,queryProductionAllOfEachChannel
} from "../../controllers/userManage/user.controllers.js";
import { uploadImage } from "../../middleware/upload.Image.js";
const route = Route();

route.post("/insert01", verifyJWT,
   uploadImage, insertDataOfAnyFunction01);
route.get("/selectAll", verifyJWT, queryUserDataAll);
route.get("/selectOne", verifyJWT, queryUserDataOne);
route.get("/selectProduct", verifyJWT, queryProductionAllOfEachChannel);
route.post("/login", userLogin);
route.post("/insert",  createNewUser);
route.post("/insert02", uploadImage, insertDataOfAnyFunction02);
route.put("/update",verifyJWT, updateUserData);
route.put("/updateProductStatus",verifyJWT, updateProductStatus);
export default route;
