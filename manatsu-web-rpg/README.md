# 真夏町の先輩

`index.html` を直接開いて遊べる、HTML5 + JavaScript 製の会話重視RPGです。  
矢印キー移動、`Z` 決定、`X` 戻る、`C` ステータスという、レトロRPG寄りの操作感で統一しています。

## 起動方法

1. [index.html](C:\Users\ookub\OneDrive\ドキュメント\manatsu-web-rpg\index.html) をブラウザで開く
2. タイトル画面で `START` または `CONTINUE`

ビルド工程や外部ライブラリはありません。Web投稿サイトへ置く場合は、このフォルダごとアップロードすれば動作します。

## フォルダ構成

- `index.html`: エントリーポイント
- `styles/`: 画面スタイル
- `src/core/`: ゲームループ、入力、状態管理
- `src/data/`: 章データ、台本、支援要素データ
- `src/render/`: Canvas描画
- `src/scenes/`: タイトル、探索、戦闘、エンディング
- `src/systems/`: セーブ、支援導線、戦闘補助
- `src/ui/`: 会話ボックス、メニュー
- `docs/`: コード仕様と全7章の台本

## 実装メモ

- `file://` で開けるように ES Modules は使わず、グローバル名前空間 `window.ManatsuRPG` に機能を分割しています。
- セーブは `localStorage` を利用します。
- 支援導線は控えめで、プレイ進行を妨げない cosmetic / bonus log 型にしています。

## 追加しやすいもの

- Canvas画像やBGMの差し替え
- NPC数の増加
- 弾幕パターンの追加
- 章ごとのマップ大型化
- 投稿サイト向け決済SDKへの差し替え
