import Route from "express";

import { selectDataAll } from "../../controllers/apiClassMethod/selectAll.controllers.js";
import { searchDataAll } from "../../controllers/apiClassMethod/searchAll.controllers.js";

const route = Route();

route.get("/selectDataAll", selectDataAll);
route.get("/searchDataAll", searchDataAll);

export default route;
