import express from "express";
import { resolve } from "node:path";
const app = express();
app.use("/Operations-Platform", express.static(resolve("dist-pages")));
app.listen(3110, "127.0.0.1", () =>
  console.log("Pages test server ready on port 3110"),
);
