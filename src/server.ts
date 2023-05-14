import express from "express";
import dotenv from "dotenv";
import { add_summaries_job, setupSummarizeJob } from "./Job";
import fs from "fs";

dotenv.config();

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);

  setupSummarizeJob();

  console.log("Job setup complete.");

  // Read text from text.txt
  const text = fs.readFileSync("./text.txt", "utf-8");

  add_summaries_job({
    page_title: "test",
    markdown: text,
    siteDocId: "test" + Date.now(),
  });
});
