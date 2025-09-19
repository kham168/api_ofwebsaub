import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_khoomkho_tsheb_dataall, query_khoomkho_tsheb_dataone, insert_khoomkho_tsheb_data, delete_khoomkho_tsheb_data,reopen_khoomkho_tsheb_data_status_0_to_1 } from "../../controllers/khoomkho_tsheb/khoomkho_tsheb.controllers.js";
const route = Route();

route.get("/selectall", query_khoomkho_tsheb_dataall);
route.post("/selectone", query_khoomkho_tsheb_dataone);
route.post("/insert", insert_khoomkho_tsheb_data);
route.put("/delete", delete_khoomkho_tsheb_data);
route.put("/reopen", reopen_khoomkho_tsheb_data_status_0_to_1);
export default route;