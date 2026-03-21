# コード仕様

## 目標

- `index.html` 単体起動
- HTML5 Canvas + Vanilla JavaScript
- 機能別ファイル分割
- Webゲーム投稿サイトへそのまま載せやすい
- 会話、探索、戦闘、章進行、セーブ、控えめな支援導線を最初から分離

## 操作

- `Arrow Keys`: 移動 / メニュー移動 / 戦闘中のソウル移動
- `Z` or `Enter`: 決定 / 話す / 調べる
- `X` or `Shift`: 戻る / 会話送り / キャンセル
- `C` or `Ctrl`: ステータス表示

## システム構成

### エントリー

- [index.html](C:\Users\ookub\OneDrive\ドキュメント\manatsu-web-rpg\index.html)
  - Canvasを1枚だけ持つ
  - スクリプトを依存順に読み込む

### コア

- `src/core/constants.js`
  - 解像度、色、入力定義
- `src/core/input.js`
  - キー入力の押下 / 単発押しを管理
- `src/core/state.js`
  - セーブ対象の進行状態
- `src/core/sceneManager.js`
  - 現在のシーン差し替え
- `src/core/game.js`
  - ゲームループ、状態遷移、章進行

### データ

- `src/data/chapters.js`
  - 第1章から第7章までの台本、マップ、敵、台詞、報酬
- `src/data/monetization.js`
  - 控えめな支援パック定義

### UI / 描画

- `src/render/renderer.js`
  - Canvas描画ユーティリティ
- `src/ui/dialogueBox.js`
  - 文字送り付き会話ボックス
- `src/ui/menuBox.js`
  - タイトル / 戦闘 / 支援画面の選択UI

### システム

- `src/systems/save.js`
  - `localStorage` 保存
- `src/systems/monetization.js`
  - 支援パックの解放状態と導線
- `src/systems/battleHelpers.js`
  - 弾幕生成とダメージ計算

### シーン

- `src/scenes/titleScene.js`
  - タイトル、続きから、章選択
- `src/scenes/supportScene.js`
  - 控えめな支援導線
- `src/scenes/overworldScene.js`
  - 探索、NPC会話、出口、目的表示
- `src/scenes/battleScene.js`
  - FIGHT / ACT / ITEM / MERCY、ソウル回避
- `src/scenes/endingScene.js`
  - 章7クリア後のエンディング

## 章進行

- 1章につき 1マップ + 2〜3人のNPC + 1戦闘
- NPCと会話して出口条件を満たす
- 戦闘で `ACT / MERCY` を多く選ぶと `kindness`
- `FIGHT` で押し切ると `fear`
- 第7章クリア時に最終会話が分岐

## 支援導線

### 方針

- 本編導線を邪魔しない
- 勝敗に関わる課金はしない
- 目立たない位置に `SUPPORT` を置く
- 内容は主に cosmetic と設定資料

### 収録パック

- `サポーターパス`
  - UI配色の切り替え
  - タイトルに小さな支援バッジ
- `放課後会話集`
  - クリア後の追加会話
- `ジュークボックス`
  - トラック名一覧表示の拡張
- `カラーパレット集`
  - 画面カラー変更

### 実運用時の差し替え箇所

- [src/systems/monetization.js](C:\Users\ookub\OneDrive\ドキュメント\manatsu-web-rpg\src\systems\monetization.js)
  - 現在はローカル検証用の簡易解放
  - 投稿サイトや販売プラットフォームのSDKへ差し替え可能

## 投稿サイト向けの注意

- 相対パスのみ利用
- `fetch()` を使わず、すべて script 読み込み
- 画像や音を後で入れる場合も同じフォルダ構造に追加しやすい
