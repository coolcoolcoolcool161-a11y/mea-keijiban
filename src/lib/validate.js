// 投稿バリデーション・自動ブロック判定。
// Workers版（src/security.ts）の判定をそのまま移植したもの。
// クライアント側で即時チェックし、最終防衛は Supabase 側の CHECK 制約＋トリガーで行う
// （supabase/schema.sql に同じ条件を実装してある）。

export const LIMITS = {
  codeMaxLength: 64,
  linkCodeMaxLength: 200, // リンク型サービス（コード欄＝紹介リンク）の上限
  displayNameMaxLength: 30,
  serviceNameMaxLength: 50, // 「その他」カテゴリのサービス名（自由記入）
  commentMaxLength: 200,
  reportDetailMaxLength: 500,
  duplicateCodeWindowMin: 10, // 同一コードの再投稿ブロック（10分）
  minPostIntervalSec: 60, // 連続投稿ブロック（1分）
};

// リンク型サービス：紹介コードの代わりに紹介リンクをコード欄へ貼る。
// この型に限り、コード欄のURLは自動ブロックの対象外にする
// （コメント欄などのURLブロックは従来どおり）。services.ts の codeIsUrl と一致させること。
export const LINK_CODE_SERVICES = ['rakuten-mobile'];

// 「その他」カテゴリのスラッグ（services.ts の OTHER_SLUG と一致させること）。
export const OTHER_SERVICE_SLUG = 'other';

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

/** メールアドレス・電話番号だけをチェックする（リンク型のコード欄用）。問題があれば理由文、なければ null。 */
export function personalInfoProblem(values) {
  for (const value of values) {
    if (!value) continue;
    if (EMAIL_PATTERN.test(value)) {
      return 'メールアドレスなどの個人情報は投稿できません。';
    }
    if (looksLikePhone(value)) {
      return '電話番号などの個人情報は投稿できません。';
    }
  }
  return null;
}

/** 投稿入力を検証し、問題があれば { error } を、問題なければ { input } を返す。 */
export function validatePostInput(raw, validSlugs) {
  const serviceSlug = (raw.serviceSlug ?? '').trim();
  const displayName = (raw.displayName ?? '').trim();
  const inviteCode = (raw.inviteCode ?? '').trim();
  const comment = (raw.comment ?? '').trim();
  const serviceName = (raw.serviceName ?? '').trim();

  if (!serviceSlug || !validSlugs.includes(serviceSlug)) {
    return { error: 'サービスを選んでください。' };
  }
  const isLinkCode = LINK_CODE_SERVICES.includes(serviceSlug);
  const isOther = serviceSlug === OTHER_SERVICE_SLUG;

  if (!inviteCode) return { error: '紹介コードを入力してください。' };
  if (isLinkCode) {
    // リンク型：コード欄には紹介リンク（URL）をそのまま貼る
    if (inviteCode.length > LIMITS.linkCodeMaxLength) {
      return { error: `紹介リンクは${LIMITS.linkCodeMaxLength}文字以内で入力してください。` };
    }
    if (!/^https?:\/\//i.test(inviteCode)) {
      return { error: 'このサービスは紹介リンク型です。紹介リンク（URL）をそのまま入力してください。' };
    }
  } else {
    if (inviteCode.length > LIMITS.codeMaxLength) {
      return { error: `紹介コードは${LIMITS.codeMaxLength}文字以内で入力してください。` };
    }
    if (!CODE_ALLOWED.test(inviteCode)) {
      return { error: '紹介コードに使えるのは英数字・ハイフン・アンダースコアだけです。' };
    }
  }
  if (isOther) {
    if (!serviceName) return { error: '「その他」の場合はサービス名を入力してください。' };
    if (serviceName.length > LIMITS.serviceNameMaxLength) {
      return { error: `サービス名は${LIMITS.serviceNameMaxLength}文字以内で入力してください。` };
    }
  }
  if (displayName.length > LIMITS.displayNameMaxLength) {
    return { error: `表示名は${LIMITS.displayNameMaxLength}文字以内で入力してください。` };
  }
  if (comment.length > LIMITS.commentMaxLength) {
    return { error: `コメントは${LIMITS.commentMaxLength}文字以内で入力してください。` };
  }
  // スパム判定：表示名・コメント・サービス名は従来どおり全面チェック。
  // コード欄は、リンク型のときだけURL判定を外し、個人情報チェックのみ行う。
  const problem = spamProblem([displayName, comment, isOther ? serviceName : '']);
  if (problem) return { error: problem };
  const codeProblem = isLinkCode ? personalInfoProblem([inviteCode]) : spamProblem([inviteCode]);
  if (codeProblem) return { error: codeProblem };
  return {
    input: {
      serviceSlug,
      displayName,
      inviteCode,
      comment,
      serviceName: isOther ? serviceName : '',
    },
  };
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
