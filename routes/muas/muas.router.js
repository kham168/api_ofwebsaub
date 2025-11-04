import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { queryMuasDataAll,searchMuasData, queryMuasDataOne, insertMuasData, deleteMuasData,reopenMuasDataStatus0To1 } from "../../controllers/muas/muas.controllers.js";
import { uploadImage } from "../../middleware/muas.uploadimage.js";
const route = Route();

route.get("/selectAll", queryMuasDataAll); // done 100 % lawm os
route.get("/searchByName", searchMuasData); // done 100 % lawm os
route.get("/selectOne", queryMuasDataOne); // done 100 % lawm os
route.post("/insert",uploadImage, insertMuasData); // done 100 % lawm os
route.put("/delete", deleteMuasData); // yuav tau saib ntxiv
route.put("/reopen", reopenMuasDataStatus0To1); // yuav tau saib ntxiv
export default route;

