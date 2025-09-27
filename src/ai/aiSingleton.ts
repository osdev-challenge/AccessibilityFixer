import { createGptCaller } from "./aiCallerFactory";
import * as vscode from "vscode";

let callGptInstance: ((prompt: string) => Promise<string>) | null = null;

export function initGpt(context: vscode.ExtensionContext) {
  callGptInstance = createGptCaller(context);
}

export function getGpt() {
  if (!callGptInstance) {
    throw new Error("[A11y Fix] GPT 서비스가 초기화되지 않았습니다.");
  }
  return callGptInstance;
}
