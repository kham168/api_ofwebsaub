import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";   // keep this
import corsOptions from "./config/corsOption.js"; // import your options
import { requestLimiter } from "./config/requestLimited.js";
import { errorHandle } from "./middleware/errorHandle.js";
import path from "path";
import { fileURLToPath } from "url";
import corsed from "./config/corsOption.js";

// routes
import muas from "./routes/muas/muas.router.js";
import cream from "./routes/cream/cream.router.js";
import taxi from "./routes/taxi/taxi.router.js";
import tshuaj from "./routes/tshuaj/tshuaj.router.js";
import khoomKhoTsheb from "./routes/khoomkho_tsheb/khoomkho_tsheb.router.js";
import district from "./routes/district/district.router.js";
import dormantal from "./routes/dormantal/dormantal.router.js";
import house from "./routes/house/house.router.js";
import land from "./routes/land/land.router.js";
import province from "./routes/province/province.router.js";
import village from "./routes/village/village.router.js";
import channel from "./routes/channel/channel.router.js";
import order from "./routes/order/order.router.js";
import profile from "./routes/profile/profile.router.js";
 


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ apply cors with your options
app.use(cors());
// app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname,'./creamimage')));
app.use(express.static(path.join(__dirname,'./muasimage')));
app.use(express.static(path.join(__dirname,'./landimage')));
app.use(express.static(path.join(__dirname,'./houseimage')));
app.use(express.static(path.join(__dirname,'./khoomkho_tshebimage')));
app.use(express.static(path.join(__dirname,'./dormitoryimage')));
app.use(express.static(path.join(__dirname,'./taxiimage')));
app.use(express.static(path.join(__dirname,'./tshuajimage')));
app.use(express.static(path.join(__dirname,'./channelimage')));
app.use(express.static(path.join(__dirname,'./profileimage')));
app.use("/", express.static(path.join(process.cwd(), "uploads")));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(requestLimiter);

app.use("/api/muas", muas);
app.use("/api/cream", cream);
app.use("/api/taxi", taxi);
app.use("/api/tshuaj", tshuaj);
app.use("/api/khoomKhoTsheb", khoomKhoTsheb);
app.use("/api/district", district);
app.use("/api/dormitory", dormantal);
app.use("/api/house", house);
app.use("/api/land", land);
app.use("/api/province", province);
app.use("/api/village", village);
app.use("/api/channel", channel);
app.use("/api/order", order);
app.use("/api/profile", profile);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
 

app.use(corsed);
app.use(errorHandle);

const APPPORT = Number(process.env.APPPORT) || 5151;
app.listen(APPPORT, () => {
  console.log(`App is running on port ${APPPORT}`);
});

 