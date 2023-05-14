import { Job, Queue, Worker } from "bullmq";
import { redisConnection } from "./constants";

import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";

export async function setupSummarizeJob() {
  const summariesQueue = new Queue("job", {
    connection: redisConnection,
  });

  const worker = new Worker(
    "job",
    async (job: Job, token: string) => {
      console.log(Date.now() + " - Worker is processing a summaries job...");

      const chat = new ChatOpenAI({
        temperature: 1.0,
        modelName: "gpt-3.5-turbo",
        openAIApiKey: "invalid key which will throw an error",
        maxTokens: 512,
        presencePenalty: 0.0,
        frequencyPenalty: 0.0,
      });

      const response = chat.call([
        new SystemChatMessage("You are a helpful assistant."),
        new HumanChatMessage("input"),
      ]);

      //! REMOVING THIS response.then FIXES THE ISSUE. Removing BOTH response.then and summary = await response will cause the issue to persist.
      response.then(async (completion) => {
        const output = await completion.text;
      });

      const summary = await response;

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
