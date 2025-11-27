import Route from "express";
import { querySearchOrderData,insertOrderDetailData } from "../../controllers/order/order.controllers.js";
import { queryOrderDetailDataAllByChannelAndSellStatus,queryOrderDetailDataAllByChannelAndStaffConfirmStatus,queryOrderDetailDataOne,updateOrderListStatus } from "../../controllers/order/orderdetail.controllers.js";
import { uploadImage } from "../../middleware/paymentImage.updoadImage.js";
const route = Route();

route.get("/searchByTel", querySearchOrderData); //done 100% lawm os
route.post("/insert",uploadImage, insertOrderDetailData); // done 100% lawm os
route.get("/selectAllByStaffStatus", queryOrderDetailDataAllByChannelAndStaffConfirmStatus); // done 100% lawm os
route.get("/selectAllBySellStatus",queryOrderDetailDataAllByChannelAndSellStatus); 
route.get("/selectOne", queryOrderDetailDataOne); // done 100% lawm os 
route.put("/updateOrderListStatus", updateOrderListStatus); // yuabb tau saib ntxiv os
export default route;


 