import { Job, Queue, UnrecoverableError, Worker } from "bullmq";
import { redisConnection } from "./constants";

export async function setupSummarizeJob() {
  const summariesQueue = new Queue("job", {
    connection: redisConnection,
  });

  const worker = new Worker(
    "job",
    async (job: Job, token: string) => {
      console.log(Date.now() + " - Worker is processing a summaries job...");

      try {
        throw new Error("test");
      } catch (e) {
        console.log("error, removing job");
        await job.moveToFailed(e, token);
        throw new UnrecoverableError(e.response.data.detail);
        return;
      }

      return [];
    },
    {
      autorun: true,
      connection: redisConnection,
    }
  );
  worker.on("failed", (job: Job, error: Error) => {
    console.log("Summarize job failed. Error:", error);
  });
  worker.on("completed", async (job: Job, returnvalue) => {
    console.log("Summarize job completed. Adding summaries to payload...");

    worker.on("error", (err) => {
      // log the error
      console.error("Summarize Job error => ", err);
    });
  });
}

export async function add_summaries_job() {
  const summariesQueue = new Queue("job", {
    connection: redisConnection,
  });

  await summariesQueue.add(
    "summaries_" + Date.now(),
    {
      markdown: "test",
    },
    {
      attempts: 30,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    }
  );
}
