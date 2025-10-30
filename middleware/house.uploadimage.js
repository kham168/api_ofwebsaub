import multer from 'multer';
  
const storage = multer.diskStorage({
 
  destination: function (req, file, cb) {
    // Ensure the directory path is correct and accessible
 
    cb(null, './houseimage');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'saub-' + uniqueSuffix + '-' + file.originalname);  // filenamek
  }
});
  
export const uploadImages = multer({ storage: storage }).array('files', 5); 
// 'files' = field name in Postman
// 5 = max number of files allowed

  
