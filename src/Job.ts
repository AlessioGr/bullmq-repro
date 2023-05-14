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
      const page_title: string = job.data.page_title;
      const count: number = job.data.count;

      /*
       * STEP 2: Summaries from markdown
       */
      const newSummaries: string[] = [];
      let putBackInQueue = false;
      try {
        if (markdown.length > 100) {
          const summary: { text: string } = await generate_summary({
            content: markdown,
            page_title: page_title,
            summary_id: count,
          });

          const splitRegex = /(?:\n|\\n)\s*-\s*/g;

          //While it has already split the document itself, we now need to split each summary. SO each bullet point
          const split = ("\n" + summary.text).split(splitRegex);

          for (let splitSummary of split) {
            splitSummary = splitSummary.trim();
            newSummaries.push(splitSummary);
          }
        }
      } catch (e) {
        console.warn("Error generating summaries. Retrying later.", e);
        putBackInQueue = true;
        throw e;
        return;
      }

      if (putBackInQueue) {
        console.log("Delaying job...");
        await job.moveToDelayed(Date.now() + 10000, token);
        console.log("Job delayed!");
        throw new DelayedError("Error generating summaries. Delaying job.");
        return;
      }

      return newSummaries;
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

export async function add_summaries_job({
  siteDocId,
  markdown,
  page_title,
}: {
  siteDocId: string;
  markdown: string;
  page_title: string;
}) {
  const summariesQueue = new Queue("job", {
    connection: redisConnection,
  });

  // Step 1: First split the markdown
  if (markdown.length > 100) {
    const splitter = new MarkdownTextSplitter();

    const splitMarkdown = await splitter.createDocuments([markdown]);

    let count = 0;
    for (const split of splitMarkdown) {
      count++;
      const savedCount = count;
      // Step 2: Add to queue
      const added = await summariesQueue.add(
        "summaries_" + siteDocId,
        {
          siteDocId: siteDocId,
          markdown: split.pageContent,
          page_title: page_title,
          count: savedCount,
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
