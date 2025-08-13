export function parseFixedCodeJson(resp: string): string {
  try {
    const json = JSON.parse(resp);
    if (typeof json.fixedCode === "string") return json.fixedCode.trim();
  } catch {}
  return resp.trim();
}
