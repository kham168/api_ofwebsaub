import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./channelimage");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "saub-" + uniqueSuffix + "-" + file.originalname);
  },
});

// MULTIPLE FIELD UPLOAD
export const uploadChannelFiles = multer({ storage }).fields([
  { name: "files", maxCount: 5 }, // imageArray
  { name: "file", maxCount: 1 },  // qr
]);
