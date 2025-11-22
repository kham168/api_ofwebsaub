
import Route from "express"; 
import { queryUserDataAll, queryUserDataOne, createNewUser, userLogin,updateUserData } from "../../controllers/userManage/user.controllers.js";
const route = Route();

route.get("/selectAll", queryUserDataAll); // done 100 % lawm os
route.get("/selectOne", queryUserDataOne); // done 100 % lawm os
route.post("/login", userLogin); // done 100 % lawm os
route.post("/insert", createNewUser); // done 100 % lawm os  
route.put("/update", updateUserData); // yuav tau saib ntxiv     
export default route;



