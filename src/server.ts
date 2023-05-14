import express from "express";
import dotenv from "dotenv";
import { add_summaries_job, setupSummarizeJob } from "./Job";

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

  add_summaries_job({
    markdown: "hii",
  });
});
