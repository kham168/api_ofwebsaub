import Route from "express";
import { query_search_order_data,insert_order_data } from "../../controllers/order/order.controllers.js";
import { query_orderdetail_dataall_by_channel,query_orderdetail_dataone,update_staffconfirm_data,update_sellstatus_data } from "../../controllers/order/orderdetail.controllers.js";
const route = Route();

route.post("/searchorderdata", query_search_order_data);
route.post("/insertorderdata", insert_order_data);
route.post("/queryorderdetailbychannel", query_orderdetail_dataall_by_channel);  
route.post("/queryorderdetailbyorderid", query_orderdetail_dataone); 
route.put("/staffconfirm", update_staffconfirm_data); 
route.put("/sellconfirm", update_sellstatus_data); 
export default route;


 