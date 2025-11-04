import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { queryLandDataAll, queryLandDataOne,queryLandDataByDistrictId,queryLandDataByVillageId, 
    insertLandData, updateActiveStatusLandData, updateSideAndPriceLandData, 
    updateNewLinkAndDetailLandData } from "../../controllers/land/land.controllers.js";
import { uploadImage } from "../../middleware/land.uploadimage.js";
const route = Route();

route.get("/selectAll", queryLandDataAll);  // done 100 % lawm os 
route.get("/selectOne", queryLandDataOne); // done 100 % lawm os
route.get("/selectByDistrictId", queryLandDataByDistrictId); // done 100 % lawm os
route.get("/selectByVillageId", queryLandDataByVillageId); // done 100 % lawm os
route.post("/insert",uploadImage,insertLandData); // done 100 % lawm os
route.put("/updateActiveStatusLandData", updateActiveStatusLandData); // yuav tau saib ntxiv 
route.put("/updateSideAndPriceLandData", updateSideAndPriceLandData);  // yuav tau saib ntxiv
route.put("/updateNewLinkAndDetailLandData", updateNewLinkAndDetailLandData);  // yuav tau saib ntxiv

export default route;

