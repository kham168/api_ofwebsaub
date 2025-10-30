import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_cream_dataall,search_cream_data, query_cream_dataone, insert_cream_data, delete_cream_data,reopen_cream_data_status_0_to_1 } from "../../controllers/cream/cream.controllers.js";
import { uploadimage } from "../../middleware/cream.uploadimage.js";
const route = Route();

route.get("/selectall", query_cream_dataall);
route.post("/searchbyname", search_cream_data);
route.post("/selectone", query_cream_dataone);
route.post("/insert", uploadimage,insert_cream_data);
route.put("/delete", delete_cream_data);
route.put("/reopen", reopen_cream_data_status_0_to_1);
export default route;