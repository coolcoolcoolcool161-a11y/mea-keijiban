// 投稿バリデーション・自動ブロック判定。
// Workers版（src/security.ts）の判定をそのまま移植したもの。
// クライアント側で即時チェックし、最終防衛は Supabase 側の CHECK 制約＋トリガーで行う
// （supabase/schema.sql に同じ条件を実装してある）。

export const LIMITS = {
  codeMaxLength: 64,
  displayNameMaxLength: 30,
  commentMaxLength: 200,
  reportDetailMaxLength: 500,
  duplicateCodeWindowMin: 10, // 同一コードの再投稿ブロック（10分）
  minPostIntervalSec: 60, // 連続投稿ブロック（1分）
};

const URL_PATTERN = /(https?:\/\/|www\.)/i;
// ドメインらしき文字列（既存掲示板の判定を継承）
const DOMAIN_PATTERN = /[a-z0-9-]+\.(com|net|org|jp|io|to|ly|me|app|site|online|xyz|info|biz|click|link)\b/i;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_HYPHEN_PATTERN = /0\d{1,4}-\d{1,4}-\d{4}/;

export function looksLikePhone(value) {
  if (PHONE_HYPHEN_PATTERN.test(value)) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11 && digits.startsWith('0');
}

/** URL・メールアドレス・電話番号のいずれかを含んでいたら理由文を返す。なければ null。 */
export function spamProblem(values) {
  for (const value of values) {
    if (!value) continue;
    if (URL_PATTERN.test(value) || DOMAIN_PATTERN.test(value)) {
      return 'URLの投稿は禁止されています。紹介コードのみ投稿してください。';
    }
    if (EMAIL_PATTERN.test(value)) {
      return 'メールアドレスなどの個人情報は投稿できません。';
    }
    if (looksLikePhone(value)) {
      return '電話番号などの個人情報は投稿できません。';
    }
  }
  return null;
}

const CODE_ALLOWED = /^[A-Za-z0-9_-]+$/;

/** 投稿入力を検証し、問題があれば { error } を、問題なければ { input } を返す。 */
export function validatePostInput(raw, validSlugs) {
  const serviceSlug = (raw.serviceSlug ?? '').trim();
  const displayName = (raw.displayName ?? '').trim();
  const inviteCode = (raw.inviteCode ?? '').trim();
  const comment = (raw.comment ?? '').trim();

  if (!serviceSlug || !validSlugs.includes(serviceSlug)) {
    return { error: 'サービスを選んでください。' };
  }
  if (!inviteCode) return { error: '紹介コードを入力してください。' };
  if (inviteCode.length > LIMITS.codeMaxLength) {
    return { error: `紹介コードは${LIMITS.codeMaxLength}文字以内で入力してください。` };
  }
  if (!CODE_ALLOWED.test(inviteCode)) {
    return { error: '紹介コードに使えるのは英数字・ハイフン・アンダースコアだけです。' };
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

/** 通報入力の検証。 */
export function validateReportInput(raw) {
  const reason = (raw.reason ?? '').trim();
  const detail = (raw.detail ?? '').trim();
  const reasons = ['spam', 'false_info', 'personal_info', 'abuse', 'other'];
  if (!reasons.includes(reason)) return { error: '通報の理由を選んでください。' };
  if (detail.length > LIMITS.reportDetailMaxLength) {
    return { error: `詳しい内容は${LIMITS.reportDetailMaxLength}文字以内で入力してください。` };
  }
  const problem = spamProblem([detail]);
  if (problem) return { error: problem };
  return { input: { reason, detail } };
}
