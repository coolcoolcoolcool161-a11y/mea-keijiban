-- 掲示板 初期スキーマ（設計書 board-new-build-design-20261120.md §4.2）
-- services には判断事項 #11（カテゴリーは v1.5 以降）への備えとして category 列を追加している。

-- サービスマスタ（19サービス。掲示板の選択肢は board_enabled で制御）
CREATE TABLE services (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,   -- 'freecash', 'warau', 'tiktok' 等
  name          TEXT NOT NULL,          -- 'Freecash', 'ワラウ' 等
  code_label    TEXT NOT NULL DEFAULT '紹介コード',
  has_url       INTEGER NOT NULL DEFAULT 1, -- 紹介URLの有無（ポケカツ・Muse・サンポは0）
  board_enabled INTEGER NOT NULL DEFAULT 1, -- 掲示板の選択肢に出すか（1=出す、0=出さない）
  category      TEXT NOT NULL DEFAULT '',   -- カテゴリー（v1.5 以降で使用。v1 では表示に使わない）
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL        -- Unix秒
);

-- 投稿（中核テーブル）
CREATE TABLE posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id    INTEGER NOT NULL REFERENCES services(id),
  display_name  TEXT NOT NULL DEFAULT '某関西人',  -- 表示名（任意。未入力時は既定値）
  invite_code   TEXT NOT NULL,          -- 紹介コード（必須）
  comment       TEXT,                   -- 一言コメント（任意）
  status        TEXT NOT NULL DEFAULT 'published'
                CHECK (status IN ('published','pending','hidden','deleted')),
  ip_hash       TEXT NOT NULL,          -- 投稿者IPのハッシュ（SHA-256。生IPは保存しない）
  user_agent    TEXT,                   -- 監査用（任意）
  turnstile_ok  INTEGER NOT NULL DEFAULT 1,
  report_count  INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,       -- Unix秒
  updated_at    INTEGER NOT NULL
);

-- 通報
CREATE TABLE reports (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id       INTEGER NOT NULL REFERENCES posts(id),
  reason        TEXT NOT NULL,          -- 'spam' / 'false_info' / 'personal_info' / 'abuse' / 'other'
  detail        TEXT,
  ip_hash       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','resolved','dismissed')),
  created_at    INTEGER NOT NULL
);

-- モデレーション履歴（誰が・いつ・何をしたか）
CREATE TABLE moderation_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id       INTEGER,
  action        TEXT NOT NULL,          -- 'hide' / 'delete' / 'approve' / 'restore'
  reason        TEXT,
  actor         TEXT NOT NULL DEFAULT 'admin',
  created_at    INTEGER NOT NULL
);

-- レート制限（IP単位の投稿回数制御。window_start は1時間バケットの開始時刻）
CREATE TABLE rate_limits (
  ip_hash       TEXT NOT NULL,
  window_start  INTEGER NOT NULL,       -- 計測開始時刻（Unix秒）
  count         INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);

-- インデックス
CREATE INDEX idx_posts_service_created ON posts (service_id, created_at DESC);
CREATE INDEX idx_posts_status_created ON posts (status, created_at DESC);
CREATE INDEX idx_posts_code_created   ON posts (invite_code, created_at DESC);
CREATE INDEX idx_posts_ip_created     ON posts (ip_hash, created_at DESC);
CREATE INDEX idx_reports_post         ON reports (post_id, created_at DESC);
CREATE INDEX idx_reports_ip           ON reports (ip_hash, created_at DESC);
CREATE INDEX idx_rate_limits_ip       ON rate_limits (ip_hash, window_start DESC);
