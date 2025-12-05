 
import multer from "multer";
import fs from "fs";

// Channel-to-folder mapping
const folderMap = {
  1: "./creamImage",
  2: "./dormitoryImage",
  3: "./houseImage",
  4: "./khoomkho_tshebImage",
  5: "./landImage",
  6: "./tshuajImage",
  7: "./taxiImage",
  8: "./muasImage",
};

// Middleware to handle file uploads with dynamic folder routing
export const uploadImage = (req, res, next) => {
  // Use a temporary multer instance to parse everything
  const tempUpload = multer({ storage: multer.memoryStorage() }).any();

  tempUpload(req, res, (err) => {
    if (err) {
      return res.status(400).send({
        status: false,
        message: "File parsing error: " + err.message,
        data: null,
      });
    }

    // Separate channel from files
    let channel = null;
    let files = [];

    // req.fields contains all fields when using .any()
    if (req.files && Array.isArray(req.files)) {
      for (const field of req.files) {
        if (field.fieldname === "channel") {
          channel = field.buffer.toString("utf-8").trim();
        } else if (field.fieldname === "files") {
          files.push(field);
        }
      }
    }

    // Also check req.body for channel (in case it was text)
    if (!channel && req.body?.channel) {
      channel = req.body.channel;
    }

    //console.log("🔍 DEBUG - Channel:", channel, "Files:", files.length);

    if (!channel) {
      return res.status(400).send({
        status: false,
        message: "Channel is required",
        data: null,
      });
    }

    // Determine folder
    const folder = folderMap[channel] || "./default";

    // Create folder if not exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // Save files to disk
    req.files = files.map((file) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = "saub-" + uniqueSuffix + "-" + file.originalname;
      const filepath = `${folder}/${filename}`;

      // Write file to disk
      try {
        fs.writeFileSync(filepath, file.buffer);
       // console.log("✅ File saved:", filepath);
      } catch (saveErr) {
       // console.error("❌ Error saving file:", saveErr.message);
      }

      return {
        filename: filename,
        path: filepath,
        originalname: file.originalname,
      };
    });

    // Store channel in body for controller
    req.body.channel = channel;

    //console.log("✅ Ready for controller - Files:", req.files.length);

    next();
  });
};
