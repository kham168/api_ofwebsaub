import Route from "express";
import { refreshToken, verifyJWT } from "../../middleware/auth.js";
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
route.post("/insertDonationList", verifyJWT, uploadImage, insertDonationList);
route.post(
  "/insertBankInformForDonation",
  verifyJWT,
  uploadImage,
  insertBankAccountForDonation
);
route.put(
  "/updateDonationData01",
  verifyJWT,
  uploadImage,
  updateDonationMainInformation01
);
route.put(
  "/updateDonationData02",
  verifyJWT,
  uploadImage,
  updateDonationMainInformation02
);
export default route;
