import Route from "express";
import { querySearchOrderData,insertOrderData } from "../../controllers/order/order.controllers.js";
import { queryOrderDetailDataAllByChannel,queryOrderDetailDataOne,updateStaffConfirmOrderData,updateSellStatusData } from "../../controllers/order/orderdetail.controllers.js";
import { uploadImage } from "../../middleware/paymentImage.updoadImage.js";
const route = Route();

route.get("/searchByTel", querySearchOrderData); //done 100% lawm os
route.post("/insert",uploadImage, insertOrderData); // done 100% lawm os
route.get("/selectAll", queryOrderDetailDataAllByChannel); // done 100% lawm os
route.get("/selectOne", queryOrderDetailDataOne); // done 100% lawm os
route.put("/staffConfirm", updateStaffConfirmOrderData); // yuabb tau saib ntxiv os
route.put("/sellConfirm", updateSellStatusData); // yuabb tau saib ntxiv os
export default route;


 