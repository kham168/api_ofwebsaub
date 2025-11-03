import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import { queryHouseDataAll,searchHouseData,queryHouseDataByDistrictId,queryHouseDataByVillageId, queryHouseDataOne, 
    insertHouseData, updateActiveStatusHouseData, updatePriceHouseData, 
    updateLocationAndDetailHouseData } from "../../controllers/house/house.controllers.js";
import { uploadImages } from "../../middleware/house.uploadimage.js";
const route = Route();


route.get("/selectAll/:page/:limit", queryHouseDataAll); // done 100 % lawm os
route.get("/searchByName/:name/:page/:limit", searchHouseData); // done 100 % lawm os
route.get("/selectByDistrictId/:districtId/:page/:limit", queryHouseDataByDistrictId); // done 100 % lawm os
route.get("/selectByVillageId/:villageId/:page/:limit", queryHouseDataByVillageId); // done 100 % lawm os
route.get("/selectOne/:id", queryHouseDataOne); // done 100 % lawm os
route.post("/insert", uploadImages,insertHouseData); // done 100 % lawm os
route.put("/updateActiveStatusHouseData", updateActiveStatusHouseData); // yuav tau saib ntxiv
route.put("/updatePriceHouseData", updatePriceHouseData); // yuav tau saib ntxiv
route.put("/updateLocationAndDetailDouseData", updateLocationAndDetailHouseData); // yuav tau saib ntxiv
 

export default route;