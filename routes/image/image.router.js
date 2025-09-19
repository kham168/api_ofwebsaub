import Route from "express"; 
import { query_cream_image,query_house_image,query_dormantal_image,query_khoomkho_tsheb_image,query_land_image,query_muas_image,
    query_taxi_image,query_tshuaj_image,query_webprofile_image
 } from "../../controllers/image/image.controllers.js"; 
const route = Route();

route.get("/creamimage", query_cream_image);
route.get("/houseimage", query_house_image);
route.get("/dormantalimage", query_dormantal_image);
route.get("/khoomkho_tshebimage",query_khoomkho_tsheb_image);
route.get("/landimage", query_land_image);
route.get("/muasimage", query_muas_image);
route.get("/taxiimage", query_taxi_image);
route.get("/tshuajimage", query_tshuaj_image);
route.get("/webprofileimage", query_webprofile_image); 

export default route;











