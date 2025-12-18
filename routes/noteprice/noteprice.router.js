import Route from "express";
import { verifyJWT } from "../../middleware/auth.js";
import {
  queryDataAllByName,
  insertDataPriceDetail,
  updateProductData
} from "../../controllers/ືnotePrice/notePrice.controllers.js";
import { uploadProductImage } from "../../middleware/noteprice.uploadimage.js";
const route = Route();

route.get("/searchByName", queryDataAllByName);
route.post("/insert", verifyJWT,uploadProductImage, insertDataPriceDetail);
route.put("/update", verifyJWT,uploadProductImage, updateProductData);
export default route;
