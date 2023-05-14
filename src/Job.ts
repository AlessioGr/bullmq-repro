import { Job, Queue, Worker, DelayedError } from "bullmq";
import { redisConnection } from "./constants";

import { getCompletions } from "./Langchain";

export async function setupSummarizeJob() {
  const summariesQueue = new Queue("job", {
    connection: redisConnection,
  });

  const worker = new Worker(
    "job",
    async (job: Job, token: string) => {
      console.log(Date.now() + " - Worker is processing a summaries job...");

      const completionPromise = getCompletions({
        input: "Hellooo",
        temperature: 0.0,
        model: "gpt-3.5-turbo",
        maxTokens: 512,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
        systemMessage: "You are a helpful assistant.",
      });

      //! REMOVING THIS FIXES THE ISSUE
      completionPromise.then(async (completion) => {
        const output = await completion.text;
      });

      const summary = await completionPromise;

      return [];
    },
    {
      autorun: true,
      connection: redisConnection,
      limiter: {
        max: 4,
        duration: 1000 * 10, // 10 seconds
      },
      removeOnComplete: {
        count: 2,
      },
      removeOnFail: {
        count: 10,
      },
      maxStalledCount: 10000000,
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
        delay: 5000,
      },
    }
  );
}
