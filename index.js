import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { cors } from "./config/corsOption.js";
import { requestLimiter } from "./config/requestLimited.js";
import { errorHandle } from "./middleware/errorHandle.js";
import path from "path";
import { fileURLToPath } from "url";

import muas from "./routes/muas/muas.router.js";
import cream from "./routes/cream/cream.router.js";
import taxi from "./routes/taxi/taxi.router.js";
import tshuaj from "./routes/tshuaj/tshuaj.router.js";
import khoomkho_tsheb from "./routes/khoomkho_tsheb/khoomkho_tsheb.router.js";
import district from "./routes/district/district.router.js";
import dormantal from "./routes/dormantal/dormantal.router.js";
import house from "./routes/house/house.router.js";
import land from "./routes/land/land.router.js";
import provnice from "./routes/province/province.router.js";
import village from "./routes/village/village.router.js";
import image from "./routes/image/image.router.js";
import order from "./routes/order/order.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors);
app.use(express.static(path.join(__dirname,'./houseimage')))
app.use(bodyParser.json());
app.use(cookieParser());
app.use(requestLimiter);


app.use("/api/muas", muas);
app.use("/api/cream", cream);
app.use("/api/taxi", taxi);
app.use("/api/tshuaj", tshuaj);
app.use("/api/khoomkho_tsheb", khoomkho_tsheb);
app.use("/api/district", district);
app.use("/api/dormantal", dormantal);
app.use("/api/house", house);
app.use("/api/land", land);
app.use("/api/provnice", provnice);
app.use("/api/village", village);
app.use("/api/image", image);
app.use("/api/order", order);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use(errorHandle);

const APPPORT = Number(process.env.APPPORT);

app.listen(APPPORT, () => {
  console.log(`App is running on port ${APPPORT}`);
});
