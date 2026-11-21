import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 公開URL：GitHub Pages（プロジェクトサイト）。他8サイトと同じ構成。
export default defineConfig({
  site: 'https://coolcoolcoolcool161-a11y.github.io',
  base: '/mea-keijiban',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
