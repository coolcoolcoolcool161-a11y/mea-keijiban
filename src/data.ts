// 紹介カード（運営者＝メアのコード）の表示データ。
// コード・URL・特典は台帳（site-migration-inventory.md §4.1）とブログ記事の記載に一致させている。
// 掲示板に表示するのは board_enabled=1 の14サービス分のみ。
// ブログ記事 URL は `${SITE.blogBaseUrl}/articles/<blogSlug>/`。

export interface ServiceCard {
  slug: string; // 掲示板の services.slug と一致
  blogSlug: string; // ポイ活ブログの記事スラッグ
  benefit: string; // 特典の短い表記（ブログ記事と同一）
  operatorCode: string | null; // メアの紹介コード（楽天モバイル等リンクのみの場合は null）
  operatorUrl: string | null; // メアの紹介URL（ないサービスは null。勝手に作らない）
  blurb: string; // 1行紹介
}

export const SERVICE_CARDS: Record<string, ServiceCard> = {
  freecash: {
    slug: "freecash",
    blogSlug: "freecash",
    benefit: "約1,430円相当",
    operatorCode: "3BQLXB",
    operatorUrl: "https://freecash.com/r/3BQLXB",
    blurb: "ゲームを遊ぶだけで報酬が貯まる、海外発の人気ポイ活サービス。",
  },
  warau: {
    slug: "warau",
    blogSlug: "warau",
    benefit: "最大2,500pt",
    operatorCode: "bEs7",
    operatorUrl: "https://www.warau.jp/friend/reg/bEs5",
    blurb: "老舗ポイントサイト。1pt＝1円、最低300ptから交換できます。",
  },
  hapitas: {
    slug: "hapitas",
    blogSlug: "hapitas",
    benefit: "最大2,300円分",
    operatorCode: "INXAHV",
    operatorUrl: "https://hapitas.jp/appinvite?i=26164523",
    blurb: "お買い物やサービス利用で貯まるポイントサイト。1P＝1円。",
  },
  moppy: {
    slug: "moppy",
    blogSlug: "moppy",
    benefit: "最大7,000P",
    operatorCode: "7xaGA123",
    operatorUrl: "https://pc.moppy.jp/entry/invite.php?invite=7xaGA123",
    blurb: "累計利用者1,400万人突破の人気ポイントサイト。",
  },
  tiktok: {
    slug: "tiktok",
    blogSlug: "tiktok",
    benefit: "6,000円分",
    operatorCode: "284097117",
    operatorUrl: "https://www.tiktok.com/d/2/ZS9f73DUaTHEE-3fczb/",
    blurb: "世界中で人気のショート動画アプリ。新規登録で報酬獲得チャンス。",
  },
  "tiktok-lite": {
    slug: "tiktok-lite",
    blogSlug: "tiktok-lite",
    benefit: "1,400円分",
    operatorCode: "890270647",
    operatorUrl: "https://lite.tiktok.com/t/ZS9f73unLbRXS-wsJMe/",
    blurb: "TikTokの軽量版。動画視聴などでコツコツポイントが貯まります。",
  },
  orikuji: {
    slug: "orikuji",
    blogSlug: "orikuji",
    benefit: "両方に500pt",
    operatorCode: "AZ3pOY",
    operatorUrl: "https://bit.ly/4fEUA8S",
    blurb: "0円でも楽しめるオンラインオリパ。コード入力は新規登録後24時間以内に。",
  },
  pokekatsu: {
    slug: "pokekatsu",
    blogSlug: "pokekatsu",
    benefit: "合計1,300円分",
    operatorCode: "2BGZ325P",
    operatorUrl: null,
    blurb: "スロットガチャが目玉のオンラインオリパ。",
  },
  muse: {
    slug: "muse",
    blogSlug: "muse",
    benefit: "10億 Museトークン",
    operatorCode: "WYKA9Y",
    operatorUrl: null,
    blurb: "AIアシスタント「Muse」の招待コード。参加後48時間以内に設定で入力。",
  },
  sampo: {
    slug: "sampo",
    blogSlug: "sampo",
    benefit: "4,000pt",
    operatorCode: "GTKZ6E",
    operatorUrl: null,
    blurb: "歩くだけでポイントが貯まる無料アプリ。1,000歩ごとに宝箱が届きます。",
  },
  butamaru: {
    slug: "butamaru",
    blogSlug: "butamaru",
    benefit: "500pt（50円分）",
    operatorCode: "JUTN9FH",
    operatorUrl: "https://app.moneypig.gy/friend_code?friend_code=JUTN9FH",
    blurb: "ぶたの風船をタップして短いCMを見るだけでポイントが貯まるアプリ。",
  },
  mirapoi: {
    slug: "mirapoi",
    blogSlug: "mirapoi",
    benefit: "招待特典あり",
    operatorCode: "P3CQCWG3",
    operatorUrl:
      "https://mirapoi.go.link?adj_t=2582zjy0&adj_deep_link=mirapoi%3A%2F%2Fref%3Fcode%3DP3CQCWG3&adj_fallback=https%3A%2F%2Fmirapoi.jp%2F%3Fref%3DP3CQCWG3&adj_redirect_macos=https%3A%2F%2Fmirapoi.jp%2F%3Fref%3DP3CQCWG3",
    blurb: "野球の勝敗や天気など、未来を予想してコインが貯まるポイ活アプリ。",
  },
  tokueru: {
    slug: "tokueru",
    blogSlug: "tokueru",
    benefit: "5,000ポイント",
    operatorCode: "9459GJ",
    operatorUrl: "https://tokueru.jp/invitations/9459GJ",
    blurb: "歩数・タロット・ミッションでポイントが貯まるポイ活アプリ。登録した方・紹介した方の両方に5,000ポイント。",
  },
  dips: {
    slug: "dips",
    blogSlug: "dips",
    benefit: "水1,000g＋高級肥料10個",
    operatorCode: "MEAPOI",
    operatorUrl: "https://dips.underduck.io/farm/invite",
    blurb: "作物を育てて本物のギフトカードに挑戦できる無料ゲーム。コード入力は登録から24時間以内に。",
  },
};
