# グループ分け Web アプリ — 仕様書 V4（React/TS版・共有URL設計更新）

## 0. このドキュメントについて
- 現行実装（React 19 + TypeScript + Vite + Tailwind + lz-string + sonner、Vercel デプロイ、PWA）を**正典**として記述し、旧 V3（vanilla JS・`#d=`＋base64 前提）を置き換える。
- 本改訂の主眼は **共有URLの設計を確定し、今後のURL短縮（後述 1・2・3）をロードマップとして明記**すること。
- 実装が食い違う箇所は基本コード優先。ただし**共有URLまわりは本書の方針（1・2・3）へ寄せていく**。

---

## 1. アーキテクチャ / 構成
- フロントのみ。バックエンドなし。状態は localStorage、メンバー受け渡しは URL。
- ディレクトリ:
  - `src/App.tsx` … タブ殻（登録 / 受付 / 班分け）、localStorage 永続化（key `group-divider-v4`）、起動時にURLから取込→URL掃除。
  - `src/components/` … タブごとに `RegistrationTab` / `CheckInTab` / `DivisionTab`。
  - `src/core/divider.ts` … **純粋関数**の班分けロジック（`shuffle` / `getTeamSizes` / `divide`）。React・DOM 非依存。
  - `src/utils/share.ts` … メンバーの URL エンコード/デコード（lz-string）。
  - `src/types/index.ts` … 共有型（`Member` / `Gender` / `DivOptions` / `DivResult`）。
- 原則: **純粋ロジックは `core`、副作用（localStorage・clipboard・URL・toast）は `components`/`utils`** に分離。

---

## 2. 運用フロー（役割分担）
```
[オーナー] メンバー登録（名前＋性別＋幹部）
   → 「URLをコピー」で共有リンク発行
   → LINEで担当者へ
[担当者] リンクを開く → メンバーが自動で入る（localStorage保存）
   → 当日：チェックイン → 班分け実行 → 結果をLINEへコピー
```
- 取込後は同じ端末ならリンク不要（localStorage に残る）。
- メンバーを変えたらリンクを再発行して送り直す（イベント前確定運用が前提）。

---

## 3. 共有URL設計（本改訂の中心）

**エンコード対象**: `[name, genderCode(0|1|2), core(0|1)]` のみ（`id`・`checkedIn` は載せない）。
genderCode: `male=0 / female=1 / other=2`。

### 3.0 現行（as-is, v0）と課題
- `?data=` クエリ ＋ `LZString.compressToEncodedURIComponent(JSON.stringify(...))`、URLSearchParams で往復。
- 課題:
  - (a) lz-string 出力に含まれる `+` / `$` が URLSearchParams で `%2B` / `%24` に**膨張**（短縮目標に反する）。
  - (b) クエリ文字列では `+` が空白に化ける**地雷**が残る（同一実装の往復では顕在化しないが脆い）。
  - (c) クエリは HTTP リクエストに乗る＝**メンバー名がサーバー/アクセスログに残る**。

### 3.1 採用する3つの決定（＝「1・2・3」）

#### 決定1：圧縮器は lz-string を継続採用（変更しない）
- 実測（URL に載る文字数）:

  | 方式 | 姓のみ15人 | 姓名15人 | 姓名30人 |
  |---|--:|--:|--:|
  | base64url(UTF-8 JSON) | 306 | 418 | 854 |
  | **lz-string（現状）** | 155 | 256 | 347 |
  | deflate-raw + base64url（CompressionStream相当） | 184 | 282 | 343 |
  | lz-string ＋ 構造削減（決定3） | **116** | **219** | **292** |

- lz-string は素朴 base64 の約半分。**deflate（ブラウザ標準）に替えても短くならず**、非同期化の手間だけ増える。→ 圧縮器はこのまま。
- 削れない本体は**日本語名そのもの**（ほぼ非圧縮）。圧縮器は主役ではない。

#### 決定2：ペイロードはクエリではなく URLフラグメント（`#`）に載せる
- 理由: `compressToEncodedURIComponent` の出力アルファベットは `+ - $` を含み、`+` と `$` はクエリでは本来エスケープが必要（公式の修正 PR #127 は未マージで、配布版 1.5.0 は依然 `+ - $`。本検証でも `?data=` 化で +5〜7 文字の膨張を確認）。
- **フラグメントでは `+ - $` がそのまま有効**。`%2B`/`%24` 膨張も `+`→空白の地雷も消える。
- 副次効果: フラグメントは HTTP リクエストに送られない＝**メンバー名がアクセスログ（Vercel含む）に残らない**。
- これは旧 V3 がハッシュを使っていた本来の理由と一致する。

#### 決定3：前処理でJSON構造を削ってから圧縮（＝今後実施予定のURL短縮）
- `[["田中",0,1],...]` の括弧/引用符/カンマをやめ、`flags(1文字/人) + 区切り + names(改行連結)` にしてから lz にかける。
- 効果（実測）: 256→219（約15%減）、30人で 347→292。**単独で最大の短縮効果**。
- フラグ: `genderCode*2 + core` → `0..5` の1文字。復元 `genderCode = floor(f/2)`, `core = f % 2`。
- 区切り: `\u001f`（Unit Separator、名前に出現しない）。名前区切り: `\n`。
- **バージョニングで段階移行**: フラグメント先頭に 1 文字のバージョンを付け、旧 `?data=` 形式と新 `#` 形式を**共存**させながら移行する（後方互換）。
- 制約: 名前に改行・制御文字を含めない（登録時に `trim` ＋制御文字除去でガード）。

> ステータス: 決定1は現状維持。決定2・3が「今後のURL短縮」本体で、`src/utils/share.ts` と `src/App.tsx`（取込/URL掃除）の改修で実施予定。下記 3.2 のワイヤ形式を確定仕様とする。

### 3.2 ワイヤ形式（確定仕様）
- 新リンク: `https://<host>/#1<payload>`
  - `1` … スキーマバージョン（将来 `2` 以降を追加可能）。
  - `<payload> = compressToEncodedURIComponent(packed)`、`packed = flags + "\u001f" + names`。
- 取込の優先順位（移行期）:
  1. `location.hash` が `#` ＋中身を持つ → 先頭1文字をバージョンとして分岐（`'1'` → packed をデコード）。
  2. 無ければ `?data=`（旧形式）→ 旧デコード（lz of JSON）で後方互換。
  3. どちらも無ければ localStorage。
- 取込後は `history.replaceState({}, '', location.pathname)` で `#`/`?` を除去しURLを掃除。

---

## 4. 班分けアルゴリズム（`src/core/divider.ts`・不変）
- 純粋関数 `divide(members, teamCount, { useCore, balG })`。
- `getTeamSizes(15,3) -> [5,5,5]`、`(14,3) -> [5,5,4]`。
- `useCore`: 幹部をラウンドロビンで各班へ先置き。`balG`: 残りを「その性別が最少の班（同数なら総人数最少）」へ。いずれも無ければ最も空いた班へ。
- 不変条件: 各メンバーは1班のみ／班サイズ合計＝対象人数／サイズ差は最大1。対象は**チェックイン済みのみ**。

---

## 5. 機能要件（現行コード準拠・要点）
- **F1 登録（オーナー）**: 名前＋性別（男/女/他）＋幹部フラグで追加。行内編集（名前/性別/幹部）・削除・全員削除。CSV 一括取込（Googleフォーム想定。見出しから「名前/氏名」「性別」列を検出、性別文字列→内部コードへ変換）。
- **F2 共有リンク**: 「URLをコピー」で発行（3.2 の形式）。起動時に自動取込（3.2 の優先順位）。
- **F3 チェックイン**: タップで出欠トグル。来場/未着/全体カウント、全員出席・全員リセット。
- **F4 班数設定**: 既定3、2〜10。チェックイン人数から定員プレビュー。
- **F5 モード選択＋実行**: `random | core` のセグメント切替（**選択状態を色で表示**）＋ 男女均等トグル ＋「実行」ボタン ＋ 再シャッフル。
- **F6 結果表示**: 班ごとカード（画面上は幹部に★を付けてよい）。
- **F7 結果共有（LINE向け）**: 「コピー」でテキスト生成。**★（幹部マーク）は付けない。班＋名前のみ。**

---

## 6. 受け入れ基準（更新）

| # | 項目 | 期待 |
|---|---|---|
| 1 | 新リンク（`#1…`）を別端末で開く | 同一メンバーが復元（日本語名も文字化けなし） |
| 2 | 旧 `?data=` リンクを開く | 引き続き復元できる（後方互換） |
| 3 | 取込後のURL | `#` / `?` が消えてクリーンになる |
| 4 | URL長 | 姓名15人で概ね 220 前後（構造削減後）、実用上限内 |
| 5 | 名前編集 | 一覧・結果・localStorage に反映 |
| 6 | モード選択 | 選択モードのボタン色が変わり視覚的に分かる |
| 7 | 実行ボタン | 選択モード＋男女均等で班分けされる |
| 8 | 共有テキスト | ★なし・班ごとに見やすい |
| 9 | 班分け不変条件 | 15人/3班→5・5・5、幹部分散・男女均等が機能 |
| 10 | リロード | チェックイン状態・メンバーが復元 |

---

## 7. 技術メモ / 制約
- TS strict。`verbatimModuleSyntax`→**型のみ import は `type` 修飾必須**。`erasableSyntaxOnly`→`enum`/`namespace`/パラメータプロパティ禁止。`any`/`as any` 回避。
- 純粋ロジックは `core`、副作用は `components`/`utils`。
- プライバシー: **名前はソースに直書きしない**（localStorage/URL のみ）。決定2でアクセスログにも残さない。
- 本件はイベント1回用途。高可用性・拡張性は不要。URL短縮は「短いほど良い」程度の最適化で、機能上は現行でも上限内（30人でも ~350 文字）。

---

## 8. デプロイ（Vercel）
- フレームワークプリセット = Vite、ビルド `npm run build`、出力 `dist`、SPA。
- クライアントルーティング未使用のため `vercel.json` は不要（将来ルーティング追加時のみ rewrite を足す）。
- フラグメント方式のため、メンバー名は Vercel のアクセスログに送られない。

---

## 付録：`src/utils/share.ts` 改訂スケッチ（決定2＋3、後方互換つき）
```ts
import LZString from 'lz-string';
import { type Member, type Gender } from '../types';

const G2C: Record<Gender, number> = { male: 0, female: 1, other: 2 };
const C2G: Record<number, Gender> = { 0: 'male', 1: 'female', 2: 'other' };
const US = '\u001f';        // 名前に出現しない区切り
const VERSION = '1';
const uid = () => Math.random().toString(36).slice(2, 10);

// 発行（オーナー）: #1<payload>
export function buildShareUrl(members: Member[]): string {
  const flags = members.map(m => String(G2C[m.gender] * 2 + (m.core ? 1 : 0))).join('');
  const names = members.map(m => m.name).join('\n');
  const payload = LZString.compressToEncodedURIComponent(flags + US + names);
  return location.origin + location.pathname + '#' + VERSION + payload;
}

// 取込（担当者）: 新形式 → 旧形式 の順
export function decodeMembersFromUrl(): Member[] | null {
  const hash = location.hash;                         // 例 "#1NoZQ…"
  if (hash.length > 2 && hash[1] === VERSION) {
    const m = decodeV1(hash.slice(2));
    if (m) return m;
  }
  const legacy = new URLSearchParams(location.search).get('data'); // 旧 ?data=
  if (legacy) return decodeLegacy(legacy);
  return null;
}

function decodeV1(payload: string): Member[] | null {
  try {
    const packed = LZString.decompressFromEncodedURIComponent(payload);
    if (!packed) return null;
    const i = packed.indexOf(US);
    if (i === -1) return null;
    const flags = packed.slice(0, i);
    const names = packed.slice(i + 1).split('\n');
    return names.map((name, idx) => {
      const f = Number(flags[idx] ?? '0');
      return { id: uid(), name, gender: C2G[Math.floor(f / 2)] ?? 'male', core: f % 2 === 1, checkedIn: false };
    });
  } catch { return null; }
}

function decodeLegacy(data: string): Member[] | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(data);
    if (!json) return null;
    const arr = JSON.parse(json) as [string, number, number][];
    return arr.map(a => ({ id: uid(), name: a[0], gender: C2G[a[1]] ?? 'male', core: a[2] === 1, checkedIn: false }));
  } catch { return null; }
}
```
- `App.tsx` 側: 取込後に `history.replaceState({}, document.title, location.pathname)` で `#`/`?` を除去。
- 登録時に `name = name.trim()` ＋ 改行/制御文字除去（区切り衝突の防止）。