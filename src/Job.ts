import { Job, Queue, Worker, DelayedError } from "bullmq";
import { redisConnection } from "./constants";

import { generate_summary } from "./Task";
import { MarkdownTextSplitter } from "langchain/text_splitter";

export async function setupSummarizeJob() {
  const summariesQueue = new Queue("job", {
    connection: redisConnection,
  });

  //embeddingsQueue.obliterate({force: true});

  const worker = new Worker(
    "job",
    async (job: Job, token: string) => {
      console.log(Date.now() + " - Worker is processing a summaries job...");

      const markdown: string = job.data.markdown;

      const summary: { text: string } = await generate_summary({
        content: markdown,
      });

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

export async function add_summaries_job({ markdown }: { markdown: string }) {
  const summariesQueue = new Queue("job", {
    connection: redisConnection,
  });

  // Step 1: First split the markdown
  if (markdown.length > 100) {
    const splitter = new MarkdownTextSplitter();

    const splitMarkdown = await splitter.createDocuments([markdown]);

    for (const split of splitMarkdown) {
      // Step 2: Add to queue
      await summariesQueue.add(
        "summaries_" + Date.now(),
        {
          markdown: split.pageContent,
        },
        {
          attempts: 30,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        }
      );
      console.log("Added to queue");
    }
  }
}
