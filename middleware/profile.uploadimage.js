
import multer from 'multer';
  
const storage = multer.diskStorage({
 
  destination: function (req, file, cb) {
  
    cb(null, './profileimage');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'saub-' + uniqueSuffix + '-' + file.originalname); 
  }
});
 
export const uploadImage = multer({ storage: storage }).array('files', 5);










