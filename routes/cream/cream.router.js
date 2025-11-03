import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryCreamDataAll,
  searchCreamData,
  queryCreamDataOne,
  insertCreamData,
  deleteCreamData,
  reopenCreamDataStatus0To1,
} from "../../controllers/cream/cream.controllers.js";
import { uploadImage } from "../../middleware/cream.uploadImage.js";
const route = Route();

route.get("/selectAll/:page/:limit", queryCreamDataAll); // done 100 % lawm os
route.get("/searchByName/:name/:page/:limit", searchCreamData); // done 100 % lawm os
route.get("/selectOne/:id", queryCreamDataOne); // done 100 % lawm os
route.post("/insert", uploadImage, insertCreamData); // done 100 % lawm os
route.put("/delete", deleteCreamData);  // yuav tau saib ntxiv
route.put("/reopen", reopenCreamDataStatus0To1); // yuav tau saib ntxiv
export default route;
