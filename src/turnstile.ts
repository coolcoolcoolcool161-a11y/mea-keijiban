// Turnstile（設計書 §5.1 層3）のサーバー側検証。
// シークレットキーが未設定の環境（ローカル開発など）では検証をスキップする。
// デプロイ時は wrangler secret put TURNSTILE_SECRET_KEY と vars の TURNSTILE_SITE_KEY を設定すること。

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true; skipped: boolean }
  | { ok: false; skipped: false; error: string };

export async function verifyTurnstile(
  token: string | null,
  remoteIp: string | null,
  secret: string | undefined,
): Promise<TurnstileResult> {
  if (!secret) {
    // ローカル開発用: キー未設定なら無効化（フォーム側もウィジェットを出さない）
    return { ok: true, skipped: true };
  }
  if (!token) {
    return { ok: false, skipped: false, error: "認証（Turnstile）が完了していません。もう一度お試しください。" };
  }
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);
  let data: { success?: boolean };
  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
    data = (await res.json()) as { success?: boolean };
  } catch {
    return { ok: false, skipped: false, error: "認証の確認に失敗しました。時間をおいてもう一度お試しください。" };
  }
  if (!data.success) {
    return { ok: false, skipped: false, error: "認証（Turnstile）に失敗しました。もう一度お試しください。" };
  }
  return { ok: true, skipped: false };
}
