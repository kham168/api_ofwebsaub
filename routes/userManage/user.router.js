import Route from "express";
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

route.post("/insert01", uploadImage, insertDataOfAnyFunction);
route.get("/selectAll", queryUserDataAll);
route.get("/selectOne", queryUserDataOne);
route.post("/login", userLogin);
route.post("/insert", createNewUser);
route.post("/insert02", uploadImage, insertDormitoryData);
route.put("/update", updateUserData);
route.put("/updateProductStatus", updateProductStatus);
export default route;
