import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { queryTshuajDataAll,searchTshuajData, queryTshuajDataOne, insertTshuajData, deleteTshuajData,reopenTshuajDataStatus0To1 } from "../../controllers/tshuaj/tshuaj.controllers.js";
import { uploadImage } from "../../middleware/tshuaj.uploadimage.js";
const route = Route();

route.get("/selectAll", queryTshuajDataAll); // done 100 % lawm os
route.get("/searchByName", searchTshuajData); // done 100 % lawm os
route.get("/selectOne", queryTshuajDataOne); // done 100 % lawm os
route.post("/insert", uploadImage,insertTshuajData); // done 100 % lawm os
route.put("/delete", deleteTshuajData); // yuav tau saib ntxiv    
route.put("/reopen", reopenTshuajDataStatus0To1); // yuav tau saib ntxiv

export default route;