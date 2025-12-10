import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
import {
  queryUserDataAll,
  queryUserDataOne,
  createNewUser,
  insertDormitoryData,
  insertDataOfAnyFunction,
  userLogin,
  updateUserData,
  updateProductStatus,
} from "../../controllers/userManage/user.controllers.js";
import { uploadImage } from "../../middleware/upload.Image.js";
const route = Route();
 
route.post("/insert01", //verifyJWT,
   uploadImage, insertDataOfAnyFunction);
route.get("/selectAll", verifyJWT, queryUserDataAll);
route.get("/selectOne", verifyJWT, queryUserDataOne);
route.post("/login", userLogin);
route.post("/insert", verifyJWT, createNewUser);
route.post("/insert02", verifyJWT, uploadImage, insertDormitoryData);
route.put("/update",verifyJWT, updateUserData);
route.put("/updateProductStatus",verifyJWT, updateProductStatus);
export default route;
