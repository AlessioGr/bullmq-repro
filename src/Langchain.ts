import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  BaseChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from "langchain/schema";

export async function getCompletions({
  input,
  temperature,
  model,
  maxTokens,
  systemMessage,
  presence_penalty,
  frequency_penalty,
}: {
  input: string;
  temperature: number;
  model: "gpt-3.5-turbo" | "gpt-4";
  maxTokens: number;
  systemMessage?: string;
  presence_penalty?: number;
  frequency_penalty?: number;
}): Promise<BaseChatMessage /* | { error: any }*/> {
  let response: BaseChatMessage;
  try {
    const chat = new ChatOpenAI({
      temperature: temperature,
      modelName: model,
      openAIApiKey: process.env.OPENAI_SECRET,
      maxTokens: maxTokens,
      presencePenalty: presence_penalty ?? 0.0,
      frequencyPenalty: frequency_penalty ?? 0.0,
    });

    response = await chat.call([
      new SystemChatMessage(systemMessage ?? "You are a helpful assistant."),
      new HumanChatMessage(input),
    ]);
  } catch (e) {
    throw e;
    /* return {
      error: e,
    };*/
  }

  return response;
}
