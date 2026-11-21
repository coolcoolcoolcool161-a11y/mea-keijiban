// Supabase（投稿データの保存先）の接続設定。
//
// ★ セットアップ後にここへ値を入れる（手順は README.md と supabase/schema.sql の冒頭コメント参照）
//   - SUPABASE_URL: プロジェクトの URL（https://xxxxxxxxxxxx.supabase.co）
//   - SUPABASE_ANON_KEY: anon public キー（公開前提のキー。ブラウザに埋め込んでよい）
// ※ service_role キーは絶対にここへ書かないこと（管理者権限のため公開禁止）。
// ※ 空の間は、掲示板の投稿・閲覧エリアに「公開準備中」が表示され、静的ページだけが公開される。
export const SUPABASE_URL = 'https://uqqehsrqjeioeawcrorz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcWVoc3JxamVpb2Vhd2Nyb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMjE4ODEsImV4cCI6MjExMDc5Nzg4MX0.avWISRhnKhpo-XdYuqP54JWOpNcn-suSISKFNe9CLA8';

export const boardConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';
