// バリデーション・自動ブロック・ハッシュ等のセキュリティまわり（設計書 §5）。
// 自動ブロックのパターンは既存掲示板（server/src/actions.ts）の判定を継承し、設計書 §5.3 で強化している。

import { LIMITS } from "./config";

// ---------- HTMLエスケープ（XSS対策） ----------
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------- 自動ブロック判定 ----------
const URL_PATTERN = /(https?:\/\/|www\.)/i;
// ドメインらしき文字列（既存掲示板の判定を継承）
const DOMAIN_PATTERN = /[a-z0-9-]+\.(com|net|org|jp|io|to|ly|me|app|site|online|xyz|info|biz|click|link)\b/i;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// 電話番号（ハイフン形式）
const PHONE_HYPHEN_PATTERN = /0\d{1,4}-\d{1,4}-\d{4}/;

export function looksLikePhone(value: string): boolean {
  if (PHONE_HYPHEN_PATTERN.test(value)) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11 && digits.startsWith("0");
}

/** URL・メールアドレス・電話番号のいずれかを含んでいたら、その理由文を返す。なければ null。 */
export function spamProblem(values: string[]): string | null {
  for (const value of values) {
    if (!value) continue;
    if (URL_PATTERN.test(value) || DOMAIN_PATTERN.test(value)) {
      return "URLの投稿は禁止されています。紹介コードのみ投稿してください。";
    }
    if (EMAIL_PATTERN.test(value)) {
      return "メールアドレスなどの個人情報は投稿できません。";
    }
    if (looksLikePhone(value)) {
      return "電話番号などの個人情報は投稿できません。";
    }
  }
  return null;
}

// ---------- 投稿入力のバリデーション（設計書 §5.2） ----------
export interface PostInput {
  serviceSlug: string;
  displayName: string;
  inviteCode: string;
  comment: string;
}

const CODE_ALLOWED = /^[A-Za-z0-9_-]+$/;

/** 入力を正規化し、問題があれば理由文を返す。 */
export function validatePostInput(raw: {
  serviceSlug: string;
  displayName: string;
  inviteCode: string;
  comment: string;
}): { input: PostInput } | { error: string } {
  const serviceSlug = (raw.serviceSlug ?? "").trim();
  const displayName = (raw.displayName ?? "").trim();
  const inviteCode = (raw.inviteCode ?? "").trim();
  const comment = (raw.comment ?? "").trim();

  if (!serviceSlug) return { error: "サービスを選んでください。" };
  if (!inviteCode) return { error: "紹介コードを入力してください。" };
  if (inviteCode.length > LIMITS.codeMaxLength) {
    return { error: `紹介コードは${LIMITS.codeMaxLength}文字以内で入力してください。` };
  }
  if (!CODE_ALLOWED.test(inviteCode)) {
    return { error: "紹介コードに使えるのは英数字・ハイフン・アンダースコアだけです。" };
  }
  if (displayName.length > LIMITS.displayNameMaxLength) {
    return { error: `表示名は${LIMITS.displayNameMaxLength}文字以内で入力してください。` };
  }
  if (comment.length > LIMITS.commentMaxLength) {
    return { error: `コメントは${LIMITS.commentMaxLength}文字以内で入力してください。` };
  }
  const problem = spamProblem([displayName, inviteCode, comment]);
  if (problem) return { error: problem };
  return { input: { serviceSlug, displayName, inviteCode, comment } };
}

// ---------- IPハッシュ（生IPは保存しない） ----------
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function ipHashOf(request: Request, salt: string): Promise<string> {
  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown";
  return sha256Hex(`${salt}:${ip}`);
}

// ---------- 日時表示（JST） ----------
const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(unixSec: number): string {
  return dateFmt.format(new Date(unixSec * 1000));
}

export function isoOf(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString();
}
