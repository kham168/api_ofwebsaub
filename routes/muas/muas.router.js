import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_muas_dataall,search_muas_data, query_muas_dataone, insert_muas_data, delete_muas_data,reopen_muas_data_status_0_to_1 } from "../../controllers/muas/muas.controllers.js";
import { uploadimage } from "../../middleware/muas.uploadimage.js";
const route = Route();

route.get("/selectall", query_muas_dataall);
route.post("/searchbyname", search_muas_data);
route.post("/selectone", query_muas_dataone);
route.post("/insert",uploadimage, insert_muas_data);
route.put("/delete", delete_muas_data);
route.put("/reopen", reopen_muas_data_status_0_to_1);
export default route;