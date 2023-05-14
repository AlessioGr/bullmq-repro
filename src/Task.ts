import { getCompletions } from "./Langchain";

export type SummarizeContentInput = {
  content: string;
};

export async function generate_summary({ content }: SummarizeContentInput) {
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

  return summary;
}

/*export async function getCleanContent({
    url,
    forceReadability,
  }) {*/
