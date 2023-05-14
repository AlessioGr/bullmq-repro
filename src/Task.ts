import { getCompletions } from "./Langchain";

export type SummarizeContentInput = {
  content: string;
  page_title: string;
  summary_id: number;
};

//const splitRegex = /(?:\n|\\n)\s*-\s*/g;
export async function generate_summary({
  content,
  page_title,
  summary_id,
}: SummarizeContentInput) {
  console.log("  Creating summary for title", page_title, "...");

  let completionPromise;

  completionPromise = getCompletions({
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

    // console.log('CREATED PROMPT HISTORY with output', output);
  });

  const summary = await completionPromise;
  console.log("  Summary created!");

  return summary;
}

/*export async function getCleanContent({
    url,
    forceReadability,
  }) {*/
