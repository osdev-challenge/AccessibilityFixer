import axios from "axios";
import * as vscode from "vscode";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export function createGptCaller(context: vscode.ExtensionContext) {
  return async function callGpt(prompt: string): Promise<string> {
    const apiKey = context.globalState.get<string>("OPENAI_API_KEY");
    const aiModel =
      context.globalState.get<string>("AI_MODEL") || "gpt-4o-mini";

    if (!apiKey) {
      throw new Error("[A11y Fix] OpenAI API Key가 설정되지 않았습니다.");
    }

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: aiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  };
}
