import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./notepriceimage");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "saub-" + uniqueSuffix + "-" + file.originalname);
  },
});

// MULTIPLE FIELD UPLOAD
export const uploadProductImage = multer({ storage }).fields([ 
  { name: "file", maxCount: 1 },  // qr
]);
