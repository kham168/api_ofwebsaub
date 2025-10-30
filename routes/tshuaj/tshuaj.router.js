import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_tshuaj_dataall,search_tshuaj_data, query_tshuaj_dataone, insert_tshuaj_data, delete_tshuaj_data,reopen_tshuaj_data_status_0_to_1 } from "../../controllers/tshuaj/tshuaj.controllers.js";
import { uploadimage } from "../../middleware/tshuaj.uploadimage.js";
const route = Route();

route.get("/selectall", query_tshuaj_dataall);
route.post("/searchbyname", search_tshuaj_data);
route.post("/selectone", query_tshuaj_dataone);
route.post("/insert", uploadimage,insert_tshuaj_data);
route.put("/delete", delete_tshuaj_data);
route.put("/reopen", reopen_tshuaj_data_status_0_to_1);

export default route;