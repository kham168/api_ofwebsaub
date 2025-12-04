import Route from "express";
import { verifyJWT } from "../../middleware/jwt.js";
import {
  queryDonationListAll,
  queryCustomerDonationList,
  searchDonationLogByCustomerTel,
  customerDonation,
  insertDonationList,
  insertBankAccountForDonation,
  updateDonationMainInformation01,
  updateDonationMainInformation02,
} from "../../controllers/donation/donation.controllers.js";
import { uploadImage } from "../../middleware/donationa.uploadimage.js";
const route = Route();

route.get("/selectDonation", queryDonationListAll);
route.get("/selectCustDonationList", queryCustomerDonationList);
route.get("/searchByCustomerTel", searchDonationLogByCustomerTel);
route.post("/insertCustomerDonation", uploadImage, customerDonation);
route.post("/insertDonationList", uploadImage, insertDonationList); 
route.post("/insertBankInformForDonation", uploadImage, insertBankAccountForDonation); 
route.put("/updateDonationData01", uploadImage, updateDonationMainInformation01); 
route.put("/updateDonationData02", uploadImage, updateDonationMainInformation02); 
export default route;
