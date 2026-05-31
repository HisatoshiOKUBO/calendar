# サイボクファーム カレンダー（Cloudflare + GitHub + Supabase 版）

InfinityFree（PHP + MySQL）から、**サーバ側コードのいらない構成**へ移行したバージョンです。

- **Cloudflare Pages** … 画面（index.html など）を配信する。GitHubに置いたファイルを自動で公開。
- **GitHub** … ファイルの置き場所。ここを更新すると Cloudflare が自動で再公開。
- **Supabase** … データベース＋API。ブラウザから直接読み書きするので、PHPのAPIは不要。
- **Word / Excel 出力** … ブラウザの中で生成（サーバ不要）。出力内容は従来と同じ。

すべて無料枠で動かせます。

---

## ファイル構成（これだけ）

```
farm-calendar/
├── index.html          ← 画面＋全ロジック（編集不要）
├── config.js           ← ★ここだけ編集（SupabaseのURLとキー）
├── supabase_setup.sql  ← Supabaseで1回だけ実行（テーブル作成）
├── import_data.sql     ← Supabaseで1回だけ実行（既存データ取り込み）
└── README.md           ← この手順書
```

> 旧PHPファイル（config.php / events.php / haccp.php / export.php）は **不要** になりました。

---

## 移行手順

### 手順0：アカウントを用意（持っていれば飛ばす）
- GitHub … <https://github.com>
- Cloudflare … <https://dash.cloudflare.com>
- Supabase … <https://supabase.com>

すべて「GitHubでサインイン」でまとめると楽です。

---

### 手順1：Supabaseでデータベースを作る

1. Supabaseにログイン →「New project」。
   - Name：farm-calendar（任意）
   - Database Password：強いパスワードを設定（控えておく）
   - Region：`Northeast Asia (Tokyo)` を推奨
2. プロジェクトができたら、左メニューの **SQL Editor** を開く。
3. `supabase_setup.sql` の中身を全部貼り付けて **Run**。（テーブルが5つ作られる）
4. 続けて `import_data.sql` の中身を貼り付けて **Run**。（既存の予定データが入る）
5. 左メニュー **Table Editor** → `events` を開き、データが入っていれば成功。

---

### 手順2：接続情報を config.js に書く

1. 左メニュー **歯車（Project Settings）→ API** を開く。
2. 次の2つを控える：
   - **Project URL**（例 `https://abcdxyz.supabase.co`）
   - **Project API keys** の **anon public** キー（`eyJ…` で始まる長い文字列）
3. `config.js` をメモ帳などで開き、2行を書き換える：

   ```js
   window.SUPABASE_URL      = 'https://abcdxyz.supabase.co';   // ← Project URL
   window.SUPABASE_ANON_KEY = 'eyJhbGciOi...';                 // ← anon public キー
   ```

> anon publicキーはブラウザに公開されても問題ない種類のキーです。
> （ただし誰でも読み書きできる状態になります。詳しくは末尾「セキュリティ」を参照）

---

### 手順3：GitHubにファイルを置く

1. GitHubで **New repository** → 名前 `farm-calendar` → Create。
2. 「uploading an existing file」から、次の4ファイルをドラッグして **Commit**：
   - `index.html`
   - `config.js`（手順2で編集済みのもの）
   - `supabase_setup.sql`
   - `import_data.sql`
   - `README.md`（任意）

---

### 手順4：Cloudflare Pages で公開

1. Cloudflareダッシュボード → 左メニュー **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 先ほどの `farm-calendar` リポジトリを選択。
3. ビルド設定は **すべて空のまま**でOK：
   - Framework preset：`None`
   - Build command：空欄
   - Build output directory：`/`（ルート）
4. **Save and Deploy** を押す。
5. 1〜2分で `https://farm-calendar-xxxx.pages.dev` のような公開URLが発行される。

---

### 手順5：動作確認

- 公開URLを開く → 既存の予定（5月・6月分）が表示されれば成功。
- 予定を追加・編集・削除してみる → Supabaseの Table Editor に即反映されるか確認。
- HACCPタブ →「資料① Word出力」「資料② Excel出力」でファイルがダウンロードされるか確認。

以後は、GitHubのファイルを更新するたびに Cloudflare が自動で再公開します。
（独自ドメインを使いたい場合は Pages の「Custom domains」から設定できます）

---

## 旧環境からの切り替えメモ

- データは手順1で取り込み済みなので、InfinityFree側はそのまま残しても・止めてもOK。
- 旧URLを使っている人がいれば、新しい `*.pages.dev` のURLに案内してください。
- 旧PHP・MySQLはバックアップとして残しておくと安心です。

---

## セキュリティについて（重要）

今回は社内向けの簡易ツールとして、`supabase_setup.sql` 内で
**誰でも（ログイン無しで）読み書きできる**設定（RLSポリシー `allow_all`）にしています。
URLとキーを知っている人なら誰でも編集できる状態です。

社外に出したくない・編集を制限したい場合は、次のいずれかを検討してください：

1. **読み取り専用にする**：`allow_all` ポリシーの `for all` を `for select` に変更。
2. **ログイン必須にする**：Supabase Authを有効化し、ポリシーの対象を `authenticated` のみに変更。
   （index.html側にログイン処理の追加が必要）
3. **URLを共有範囲にとどめる**：Cloudflare Accessでアクセス制限をかける。

必要になったら設定変更のお手伝いができます。

---

## 困ったときは

- 予定が表示されない／「デモ表示」になる
  → `config.js` のURL・キーの貼り間違い、または手順1のSQL未実行の可能性。
    ブラウザの「検証 → Console」にエラーが出ていないか確認。
- Word/Excelが出ない
  → 同じく Console を確認。広告ブロッカーがCDN（jsdelivr）を止めていないか確認。
