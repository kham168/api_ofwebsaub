import multer from 'multer';
  
const storage = multer.diskStorage({
 
  destination: function (req, file, cb) {
  
    cb(null, './muasimage');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'saub-' + uniqueSuffix + '-' + file.originalname); 
  }
});
 
export const uploadimage = multer({ storage: storage }).array('files', 5);



