import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { query_taxi_dataall, query_taxi_dataone, insert_taxi_data, delete_taxi_data } from "../../controllers/taxi/taxi.controllers.js";
const route = Route();

route.get("/selectall", query_taxi_dataall);
route.post("/selectone", query_taxi_dataone);
route.post("/insert", insert_taxi_data);
route.put("/update", delete_taxi_data);
 
export default route;