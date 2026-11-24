// 掲示板対象19サービスのマスタデータ（＋投稿フォームの「その他」カテゴリ）。
// コード・URL・特典・条件は台帳（referral-ledger.md）と MEMORY.md §3・§4 が正。
// 変更する前に必ず prepost_referral_check の手順で照合すること。
// operatorUrl が null のサービスは紹介URLが存在しない（勝手に作らない）。
// codeIsUrl が true のサービス（楽天モバイル）は、紹介コードの代わりに
// 紹介リンクそのものをコード欄に入れる「リンク型」。コード欄のURLはこの型に限り許可される。

export interface Service {
  slug: string;
  name: string;
  blogSlug: string;
  benefit: string;
  operatorCode: string;
  operatorUrl: string | null;
  codeIsUrl?: boolean;
  blurb: string;
  intro: string[];
  howTo: string[];
  notes: string[];
}

export const SERVICES: Service[] = [
  {
    slug: 'freecash',
    name: 'Freecash',
    blogSlug: 'freecash',
    benefit: '初回DLで1,430円分',
    operatorCode: '3BQLXB',
    operatorUrl: 'https://freecash.com/r/3BQLXB',
    blurb: 'ゲームを遊ぶだけで報酬が貯まる、海外発の人気ポイ活サービス。',
    intro: [
      'Freecashは、紹介リンクから登録して対象のゲームをプレイするだけで報酬がもらえる、海外発の人気ポイ活サービスです。スマホで簡単に始められ、ゲームを楽しみながらポイントを貯められます。',
      'このページでは、Freecashの紹介コードを投稿・検索できます。招待コードを入力して初回DLすると1,430円分がもらえます。毎日のルーレットやログインでも報酬がもらえます。',
    ],
    howTo: [
      '紹介リンクからFreecashに新規登録する',
      '対象のゲームを選んでプレイする',
      '条件を達成して報酬を受け取る',
    ],
    notes: ['毎日のルーレットで無条件ボーナス、ゲームにログインするだけでもらえる報酬もあります。'],
  },
  {
    slug: 'warau',
    name: 'ワラウ',
    blogSlug: 'warau',
    benefit: '最大2,500pt',
    operatorCode: 'bEs7',
    operatorUrl: 'https://www.warau.jp/friend/reg/bEs5',
    blurb: '老舗ポイントサイト。1pt＝1円、最低300ptから交換できます。',
    intro: [
      'ワラウは、1pt＝1円で分かりやすい老舗ポイントサイトです。300ptから交換でき、交換先はVポイント・dポイント・ギフトカード・現金など約40種類。ゲーム・アプリ・買い物・アンケートで毎日貯まります。',
      '紹介経由の登録なら初回ボーナスが300pt→500ptにアップし、最大2,500ptのチャンスがあります。このページではワラウの紹介コードを投稿・検索できます。',
    ],
    howTo: [
      '紹介リンクからワラウに新規登録する（自動で紹介が適用されます）',
      '登録後に届く案内に沿って初回ボーナスを受け取る',
    ],
    notes: [
      '紹介コードは bEs7、紹介URLの末尾は bEs5 です。コードとURL末尾が違うのが正しい表記です。',
      'ワラウコインは別物で、10コイン＝1ptです。ポイントのレートと混同しないようご注意ください。',
    ],
  },
  {
    slug: 'hapitas',
    name: 'ハピタス',
    blogSlug: 'hapitas',
    benefit: '最大2,300円分',
    operatorCode: 'INXAHV',
    operatorUrl: 'https://hapitas.jp/appinvite?i=26164523',
    blurb: 'お買い物やサービス利用で貯まるポイントサイト。1P＝1円。',
    intro: [
      'ハピタスは、1P＝1円・登録無料のポイントサイトです。お買い物以外にもゲームやアプリでもポイントが貯まり、貯めたポイントは現金や電子マネー、ギフト券に交換できます。',
      '紹介経由の登録＋条件達成で最大2,300P。このページではハピタスの紹介コードを投稿・検索できます。',
    ],
    howTo: [
      '紹介URLからハピタスに新規登録する（コード入力は不要です）',
      'メール認証と3日連続ログインで100P',
      '広告利用5,000P以上などで、さらにボーナスが加算されます',
    ],
    notes: ['特典は条件達成分を合計した最大値です。内訳はブログの紹介記事で確認できます。'],
  },
  {
    slug: 'moppy',
    name: 'モッピー',
    blogSlug: 'moppy',
    benefit: '最大7,000P',
    operatorCode: '7xaGA123',
    operatorUrl: 'https://pc.moppy.jp/entry/invite.php?invite=7xaGA123',
    blurb: '累計利用者1,400万人突破の人気ポイントサイト。',
    intro: [
      'モッピーは、累計利用者1,400万人突破、20年以上の運営実績がある人気ポイントサイトです。登録料・年会費は一切無料で、貯めたポイントは現金・PayPay・電子マネー・マイルに交換できます。',
      '新規登録＆広告利用で最大7,000Pのチャンス。このページではモッピーの紹介コードを投稿・検索できます。',
    ],
    howTo: [
      '紹介URLからモッピーに新規登録する',
      '広告利用で5,000P以上を達成すると、特典の対象になります',
    ],
    notes: ['5,000P達成には、クレジットカード発行や口座開設などの高額案件を活用する方法もあります。'],
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    blogSlug: 'tiktok',
    benefit: '6,000円分',
    operatorCode: '284097117',
    operatorUrl: 'https://www.tiktok.com/d/2/ZS9f73DUaTHEE-3fczb/',
    blurb: '世界中で人気のショート動画アプリ。新規登録で報酬獲得チャンス。',
    intro: [
      'TikTokは世界中で人気のショート動画アプリです。新規登録＋条件達成で最大6,000円分の報酬獲得チャンスがあります。',
      'このページではTikTokの招待コードを投稿・検索できます。登録時のコツを守ると、招待が反映されやすくなります。',
    ],
    howTo: [
      'Wi-FiをOFFにして、モバイル通信で招待URLを直接開く',
      '「ダウンロードを開く」ではなく、招待URLからそのまま進む',
      '新規登録して、イベント条件を達成する',
    ],
    notes: ['特典額はキャンペーン内容により変わることがあります。アプリ内の最新案内をご確認ください。'],
  },
  {
    slug: 'tiktok-lite',
    name: 'TikTok Lite',
    blogSlug: 'tiktok-lite',
    benefit: '1,400円分',
    operatorCode: '890270647',
    operatorUrl: 'https://lite.tiktok.com/t/ZS9f73unLbRXS-wsJMe/',
    blurb: 'TikTokの軽量版。動画視聴などでコツコツポイントが貯まります。',
    intro: [
      'TikTok LiteはTikTokの軽量版アプリです。動画視聴などでコツコツポイントが貯まる、ポイ活向きのアプリで、本家TikTokと両方登録するのもOKです。',
      '新規登録で1,400円分の報酬獲得チャンス。このページではTikTok Liteの招待コードを投稿・検索できます。',
    ],
    howTo: [
      'Wi-FiをOFFにして、モバイル通信で招待URLを直接開く',
      '「ダウンロードを開く」経由ではなく、招待URLからそのまま進む',
      '新規登録して、アクティビティに参加する',
    ],
    notes: ['「ダウンロードを開く」経由だと招待が反映されないことがあります。'],
  },
  {
    slug: 'orikuji',
    name: 'オリくじ',
    blogSlug: 'orikuji',
    benefit: '500ptプレゼント',
    operatorCode: 'AZ3pOY',
    operatorUrl: 'https://bit.ly/4fEUA8S',
    blurb: '0円でも楽しめるオンラインオリパ。コード入力は新規登録後24時間以内に。',
    intro: [
      'オリくじは、0円でも楽しめるオンラインオリパ（オリジナルパック）サービスです。招待コードを入力すると500ptがプレゼントされます。',
      'このページではオリくじの招待コードを投稿・検索できます。コードの入力期限が短いので、登録したらすぐに手続きするのがおすすめです。',
    ],
    howTo: [
      'オリくじに新規登録する',
      '登録後24時間以内に、招待コードを入力する',
      '500ptを受け取る',
    ],
    notes: ['招待コードの入力は新規登録後24時間以内が条件です。期限を過ぎると特典の対象外になります。'],
  },
  {
    slug: 'pokekatsu',
    name: 'ポケカツ',
    blogSlug: 'pokekatsu',
    benefit: '初回チャージ90%OFF',
    operatorCode: '2BGZ325P',
    operatorUrl: null,
    blurb: 'スロットガチャが目玉のオンラインオリパ。',
    intro: [
      'ポケカツは、スロットガチャが目玉のオンラインオリパサービスです。登録は無料で、初回チャージは90%OFF。7日間ガチャも実施中です。',
      'ポケカツは招待コードのみの紹介です。このページではポケカツの招待コードを投稿・検索できます。',
    ],
    howTo: [
      'ポケカツに新規登録する',
      'アプリ・サイト内で招待コードを入力する',
    ],
    notes: ['ポケカツには紹介URLがありません。コードを文字で入力してください。'],
  },
  {
    slug: 'muse',
    name: 'Muse',
    blogSlug: 'muse',
    benefit: '10億 Museトークン',
    operatorCode: 'WYKA9Y',
    operatorUrl: null,
    blurb: 'AIアシスタント「Muse」の招待コード。参加後48時間以内に設定で入力。',
    intro: [
      'Museは、調べものから文章作成、毎日の作業の手伝いまで頼めるAIアシスタントです。招待コードを入力すると10億Museトークンがもらえます。',
      'Museは招待コードのみの紹介です。このページではMuseの招待コードを投稿・検索できます。',
    ],
    howTo: [
      'Museに参加（新規登録）する',
      '参加後48時間以内に、設定の画面で招待コードを入力する',
      '10億Museトークンを受け取る',
    ],
    notes: ['コードの入力期限は参加後48時間以内です。登録したら早めに入力してください。'],
  },
  {
    slug: 'sampo',
    name: 'サンポ',
    blogSlug: 'sampo',
    benefit: '4,000pt',
    operatorCode: 'GTKZ6E',
    operatorUrl: null,
    blurb: '歩くだけでポイントが貯まる無料アプリ。1,000歩ごとに宝箱が届きます。',
    intro: [
      'サンポは、歩くだけでポイントが貯まる無料アプリです。毎日の通勤・通学・お散歩がそのままポイ活になり、1,000歩ごとに宝箱が届きます。',
      '招待コードの入力で4,000ptがもらえます。このページではサンポの招待コードを投稿・検索できます。',
    ],
    howTo: [
      'サンポのアプリを入れて新規登録する',
      'アプリ内で招待コードを入力する',
      '4,000ptを受け取る',
    ],
    notes: [
      'レートは110pt≒1円です。交換は33,000pt（300円分）から、PayPay・楽天ポイント・Amazonギフト券などに交換できます。',
      'サンポには紹介URLがありません。コードを文字で入力してください。',
    ],
  },
  {
    slug: 'butamaru',
    name: 'ぶたまる',
    blogSlug: 'butamaru',
    benefit: '500pt（50円分）',
    operatorCode: 'JUTN9FH',
    operatorUrl: 'https://app.moneypig.gy/friend_code?friend_code=JUTN9FH',
    blurb: 'ぶたの風船をタップして短いCMを見るだけでポイントが貯まるアプリ。',
    intro: [
      'ぶたまる（マネーピッグ）は、ぶたの風船をタップして短いCMを見るだけでポイントが貯まるアプリです。歩かなくてもOKなので、スキマ時間に気軽にポイ活できます。',
      '招待コードの入力などで500pt（50円分）がもらえます。このページではぶたまるの招待コードを投稿・検索できます。',
    ],
    howTo: [
      '紹介リンクからぶたまるに登録する',
      '初回起動時に招待コードを入力する',
      'ブタップ10回＋アカウント作成で条件達成',
    ],
    notes: ['交換は300円分から、Amazonギフトカード・PayPayマネーライトなど13種類から選べます。レートは10pt＝1円です。'],
  },
  {
    slug: 'mirapoi',
    name: 'ミラポイ',
    blogSlug: 'mirapoi',
    benefit: '招待特典あり',
    operatorCode: 'P3CQCWG3',
    operatorUrl:
      'https://mirapoi.go.link?adj_t=2582zjy0&adj_deep_link=mirapoi%3A%2F%2Fref%3Fcode%3DP3CQCWG3&adj_fallback=https%3A%2F%2Fmirapoi.jp%2F%3Fref%3DP3CQCWG3&adj_redirect_macos=https%3A%2F%2Fmirapoi.jp%2F%3Fref%3DP3CQCWG3',
    blurb: '野球の勝敗や天気など、未来を予想してコインが貯まるポイ活アプリ。',
    intro: [
      'ミラポイは、野球の勝敗や天気など、未来を予想して楽しむポイ活アプリです。予想が的中するとコインが貯まります。登録時には100ptの入会ボーナスがあります。',
      'このページではミラポイの招待コードを投稿・検索できます。貯めたコインは300コインからAmazonギフトカード・PayPayなどに交換できます。',
    ],
    howTo: [
      '紹介リンクからミラポイに登録する',
      '登録時に招待コードを入力する（後から入力できない場合があります）',
    ],
    notes: ['招待特典の内容はアプリ内でご確認ください。'],
  },
  {
    slug: 'tokueru',
    name: 'トクエル',
    blogSlug: 'tokueru',
    benefit: '5,000ポイント',
    operatorCode: '9459GJ',
    operatorUrl: 'https://tokueru.jp/invitations/9459GJ',
    blurb: '歩数・タロット・ミッションでポイントが貯まるポイ活アプリ。登録で5,000ポイント。',
    intro: [
      'トクエルは、歩数・タロット・ミッションでポイントが貯まるポイ活アプリです。歩くだけでなく、毎日のミッションでもコツコツ貯められます。',
      '新規登録時に招待コードを入力すると5,000ポイントがもらえます。このページではトクエルの招待コードを投稿・検索できます。',
    ],
    howTo: [
      '紹介リンクからトクエルに新規登録する',
      '登録時に招待コードを入力する',
      '5,000ポイントを受け取る',
    ],
    notes: ['交換先はPayPayポイント・Amazonギフトカードなどです。'],
  },
  {
    slug: 'dips',
    name: 'dipsファーム',
    blogSlug: 'dips',
    benefit: '水1,000g＋高級肥料10個',
    operatorCode: 'MEAPOI',
    operatorUrl: 'https://dips.underduck.io/farm/invite',
    blurb: '作物を育てて本物のギフトカードに挑戦できる無料ゲーム。コード入力は登録から24時間以内に。',
    intro: [
      'dipsファームは、作物を育てて楽しむ育成系のポイ活ゲームです。育てた作物で本物のギフトカードなどに挑戦できます。',
      '招待コードを入力すると、水1,000g＋高級肥料10個がもらえて、スタートダッシュに使えます。このページではdipsファームの招待コードを投稿・検索できます。',
      'さらに友達招待コード「9RNR7N」も入力すると高級肥料5個がもらえます。メア特別コード「MEAPOI」と友達招待コードは入力欄が別で、2つのコードは両方入力できるので、両方入れるのがお得です。',
    ],
    howTo: [
      '紹介リンクからdipsファームに新規登録する',
      '登録から24時間以内に、招待コードを入力する',
      '水1,000g＋高級肥料10個を受け取る',
      '友達招待コード「9RNR7N」も入力して高級肥料5個を受け取る',
    ],
    notes: ['コードの入力は登録から24時間以内が条件です。'],
  },
  {
    slug: 'rakuten-mobile',
    name: '楽天モバイル',
    blogSlug: 'rakuten-mobile',
    benefit: '最大13,000ポイント',
    operatorCode: 'https://r10.to/hgZk3d',
    operatorUrl: 'https://r10.to/hgZk3d',
    codeIsUrl: true,
    blurb: '紹介リンク型のキャンペーン。初めての申込で楽天ポイントがもらえます。',
    intro: [
      '楽天モバイルは、紹介リンクから初めて申し込むと楽天ポイントがもらえるキャンペーンを実施中です。他社から電話番号そのまま乗り換え（MNP）なら13,000ポイント、乗り換え以外のお申し込みでも12,000ポイントがもらえます。',
      '楽天モバイルは招待コードではなく紹介リンク型のサービスです。このページでは、みんなの紹介リンクを投稿・検索できます（この掲示板では、楽天モバイルに限りコード欄に紹介リンクを貼れます）。',
    ],
    howTo: [
      '紹介リンクから楽天IDでログインする（持っていない方は新規登録でもOK）',
      'ログイン後、翌々月末日までに楽天モバイルのプランを申し込む',
      'プランの利用を開始する',
      'Rakuten Linkアプリから発信通話をする',
    ],
    notes: [
      'ポイントがもらえるのは、初めてお申し込みされる方限定のキャンペーンです。',
      '紹介を受けた方の契約情報が紹介者に伝わることはありません。',
    ],
  },
  {
    slug: 'mercari',
    name: 'メルカリ',
    blogSlug: 'mercari',
    benefit: '500円分',
    operatorCode: 'HKRDNM',
    operatorUrl: 'https://link.jp.mercari.com/70tO/lpthbfqe',
    blurb: 'フリマアプリの定番。新規登録で500円分お得にお買い物できます。',
    intro: [
      'メルカリは、不用品を売ったりお得に買ったりできるフリマアプリです。招待コードを使って新規登録すると、500円分お得にお買い物できます。',
      'このページではメルカリの招待コードを投稿・検索できます。',
    ],
    howTo: [
      'メルカリのアプリをインストールする',
      '新規登録のときに招待コードを入力する',
      '500円分お得にお買い物できる特典を受け取る',
    ],
    notes: ['招待コードは新規登録のときに入力してください。'],
  },
  {
    slug: 'paypay',
    name: 'PayPay',
    blogSlug: 'paypay',
    benefit: '300pt',
    operatorCode: '02-49XLFP8',
    operatorUrl: 'https://s.paypay.ne.jp/5HWsZW',
    blurb: 'スマホ決済の定番。紹介コード入力＋1,000円以上の決済で300pt。',
    intro: [
      'PayPayは、スマホでかんたんに支払える決済アプリです。紹介コードを入力して条件を達成すると、300ptがもらえます。',
      'このページではPayPayの紹介コードを投稿・検索できます。',
    ],
    howTo: [
      'PayPayアプリをダウンロードして新規登録する',
      '新規登録画面または友だち紹介特典画面で紹介コードを入力する',
      '対象の支払い方法で1,000円以上の支払いをする',
      '後日、300ptが付与されます',
    ],
    notes: ['コード入力と1,000円以上の決済は、どちらも新規登録から60日以内が条件です（期限は登録日時の59日23時間59分後まで）。期限を過ぎると特典はもらえません。'],
  },
  {
    slug: 'airwallet',
    name: 'エアウォレット',
    blogSlug: 'airwallet',
    benefit: 'COIN+残高300円分',
    operatorCode: '6nzih9k',
    operatorUrl:
      'https://coinplus.go.link/jH372',
    blurb: '銀行口座間の送金が手数料無料でできるアプリ。新規登録でCOIN+残高300円分。',
    intro: [
      'エアウォレットは、銀行口座間の送金が手数料無料でできる便利なアプリです。招待コードを入力して新規登録すると、COIN+残高300円分がもらえます。',
      '紹介は招待コードの入力が基本です。このページではエアウォレットの招待コードを投稿・検索できます。',
    ],
    howTo: [
      'エアウォレットに新規登録して招待コードを入力する',
      'COIN+残高300円分を受け取る',
    ],
    notes: ['登録は無料で始められます。難しい操作は必要ありません。'],
  },
  {
    slug: 'smbc-olive',
    name: 'SMBC Olive',
    blogSlug: 'olive',
    benefit: 'Vポイント1,000円相当',
    operatorCode: 'FF89103-3439377',
    operatorUrl: 'https://www.smbc.co.jp/kojin/redirect/referral04/index.html',
    blurb: '三井住友銀行のOliveアカウント紹介プログラム。条件達成でVポイント1,000円相当。',
    intro: [
      'SMBC Oliveは、三井住友銀行の金融サービス「Oliveアカウント」の紹介プログラムです。紹介コードでエントリーして条件を達成すると、Vポイント1,000円相当がもらえます。',
      'このページではSMBC Oliveの紹介コードを投稿・検索できます。',
    ],
    howTo: [
      'エントリーフォームで紹介コードを入力してエントリーする',
      'Oliveアカウントを契約する',
      '契約日の翌月末時点で、残高が10,000円以上になるよう入金する',
      'Vポイント1,000円相当を受け取る',
    ],
    notes: ['特典はVポイント1,000円相当のみです。条件は「エントリー＋Oliveアカウント契約＋契約日の翌月末時点で残高10,000円以上」です。'],
  },
];

export const SERVICE_MAP: Record<string, Service> = Object.fromEntries(
  SERVICES.map((s) => [s.slug, s]),
);

export const SERVICE_SLUGS = SERVICES.map((s) => s.slug);

// 「その他」カテゴリ：19サービス以外の招待コードを、サービス名の自由記入つきで投稿できる。
// 専用ページや運営者コードは持たないため SERVICES には含めず、スラッグだけを別に定義する。
export const OTHER_SLUG = 'other';
export const OTHER_NAME = 'その他';

// リンク型サービス（コード欄にURLを貼る）のスラッグ一覧。
export const LINK_CODE_SLUGS = SERVICES.filter((s) => s.codeIsUrl).map((s) => s.slug);
