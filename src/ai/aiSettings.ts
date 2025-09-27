import * as vscode from "vscode";

export async function aiSettings(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const userKey = await vscode.window.showInputBox({
    title: "OpenAI API Key 입력",
    prompt: "OpenAI API 키를 입력하세요.",
    ignoreFocusOut: true,
    password: true,
    placeHolder: "sk-... 형식의 API 키",
    validateInput: (value) => {
      if (!value.startsWith("sk-") || value.length < 20) {
        return "유효한 OpenAI API 키를 입력하세요.";
      }
      return null;
    },
  });

  if (!userKey) {
    vscode.window.showErrorMessage("[A11y Fix] API 키 입력이 취소되었습니다.");
    return false;
  }

  const model = await vscode.window.showQuickPick(
    ["gpt-3.5-turbo", "gpt-4", "gpt-4o", "gpt-4o-mini"],
    {
      title: "사용할 GPT 모델을 선택하세요",
      placeHolder: "GPT 모델 선택",
      ignoreFocusOut: true,
    }
  );

  if (!model) {
    vscode.window.showErrorMessage("[A11y Fix] 모델 선택이 취소되었습니다.");
    return false;
  }

  await context.globalState.update("OPENAI_API_KEY", userKey);
  await context.globalState.update("AI_MODEL", model);

  vscode.window.showInformationMessage(
    `[A11y Fix] 새로운 GPT 설정이 저장되었습니다 (${model})`
  );

  return true;
}
