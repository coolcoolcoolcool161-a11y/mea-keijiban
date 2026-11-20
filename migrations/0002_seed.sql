-- サービスマスタ初期データ（19件）— マイグレーション版
-- 元データ: seeds/services.sql（同一内容。デプロイ時に Workers Builds / wrangler d1 migrations apply で
-- 0001_init.sql の後に自動投入されるよう、マイグレーションとしても用意したもの）
-- board_enabled はサービス×媒体マトリクス（2026-11-20 ユーザー決定）の掲示板列に従う。
-- 掲示板の選択肢に出るのは board_enabled=1 の14件のみ。
-- slug は UNIQUE のため、既存行と競合しないよう INSERT OR IGNORE で冪等にしている（再適用しても安全）。
INSERT OR IGNORE INTO services (slug, name, code_label, has_url, board_enabled, category, sort_order, created_at) VALUES
  ('freecash',       'Freecash',       '紹介コード', 1, 1, 'others',       1,  CAST(strftime('%s','now') AS INTEGER)),
  ('warau',          'ワラウ',         '紹介コード', 1, 1, 'point-sites',  2,  CAST(strftime('%s','now') AS INTEGER)),
  ('hapitas',        'ハピタス',       '紹介コード', 1, 1, 'point-sites',  3,  CAST(strftime('%s','now') AS INTEGER)),
  ('moppy',          'モッピー',       '紹介コード', 1, 1, 'point-sites',  4,  CAST(strftime('%s','now') AS INTEGER)),
  ('tiktok',         'TikTok',         '紹介コード', 1, 1, 'sns-video',    5,  CAST(strftime('%s','now') AS INTEGER)),
  ('tiktok-lite',    'TikTok Lite',    '紹介コード', 1, 1, 'sns-video',    6,  CAST(strftime('%s','now') AS INTEGER)),
  ('orikuji',        'オリくじ',       '招待コード', 1, 1, 'point-sites',  7,  CAST(strftime('%s','now') AS INTEGER)),
  ('pokekatsu',      'ポケカツ',       '招待コード', 0, 1, 'point-sites',  8,  CAST(strftime('%s','now') AS INTEGER)),
  ('muse',           'Muse',           '招待コード', 0, 1, 'others',       9,  CAST(strftime('%s','now') AS INTEGER)),
  ('sampo',          'サンポ',         '招待コード', 0, 1, 'new-apps',     10, CAST(strftime('%s','now') AS INTEGER)),
  ('butamaru',       'ぶたまる',       '招待コード', 1, 1, 'new-apps',     11, CAST(strftime('%s','now') AS INTEGER)),
  ('mirapoi',        'ミラポイ',       '招待コード', 1, 1, 'new-apps',     12, CAST(strftime('%s','now') AS INTEGER)),
  ('tokueru',        'トクエル',       '招待コード', 1, 1, 'new-apps',     13, CAST(strftime('%s','now') AS INTEGER)),
  ('dips',           'dipsファーム',   '招待コード', 1, 1, 'new-apps',     14, CAST(strftime('%s','now') AS INTEGER)),
  ('rakuten-mobile', '楽天モバイル',   '紹介リンク', 1, 0, 'payment-bank', 15, CAST(strftime('%s','now') AS INTEGER)),
  ('mercari',        'メルカリ',       '招待コード', 1, 0, 'others',       16, CAST(strftime('%s','now') AS INTEGER)),
  ('paypay',         'PayPay',         '紹介コード', 1, 0, 'payment-bank', 17, CAST(strftime('%s','now') AS INTEGER)),
  ('airwallet',      'エアウォレット', '紹介コード', 1, 0, 'payment-bank', 18, CAST(strftime('%s','now') AS INTEGER)),
  ('smbc-olive',     'SMBC Olive',     '紹介コード', 1, 0, 'payment-bank', 19, CAST(strftime('%s','now') AS INTEGER));
