import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { queryKhoomKhoTshebDataAll,searchKhoomKhoTshebData, queryKhoomKhoTshebDataOne, insertKhoomKhoTshebData, deleteKhoomKhoTshebData,reopenKhoomKhoTshebDataStatus0To1 } from "../../controllers/khoomkho_tsheb/khoomkho_tsheb.controllers.js";
import { uploadImage } from "../../middleware/khoomkho_tsheb.uploadimage.js";
const route = Route();

route.get("/selectAll", queryKhoomKhoTshebDataAll); // tiav 100 % lawm os
route.get("/selectOne", queryKhoomKhoTshebDataOne);  // tiav 100 % lawm os
route.get("/searchByName", searchKhoomKhoTshebData); // tiav 100 % lawm os
route.post("/insert", uploadImage,insertKhoomKhoTshebData); // tiav 100 % lawm os
route.put("/delete", deleteKhoomKhoTshebData);  // yuav tau saib ntxiv
route.put("/reopen", reopenKhoomKhoTshebDataStatus0To1); // yuav tau saib ntxiv
export default route; 