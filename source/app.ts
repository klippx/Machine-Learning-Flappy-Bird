import express from "express";
import path from "path";

const app = express();

// app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.static("./"));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(8080, () => {
  console.log({ static: path.join(__dirname, "..", "public") });
  console.log("App listening on http://localhost:8080");
});
