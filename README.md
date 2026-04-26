# 文字並び替えnPn / narabikae-nPn

[English](#english) | [日本語](#日本語)

---

## English

A web application that generates all permutations ($nPn$) of input characters. It supports large datasets using Web Workers and features a sleek dark-mode UI.

### INDEX
- [文字並び替えnPn / narabikae-nPn](#文字並び替えnpn--narabikae-npn)
  - [English](#english)
    - [INDEX](#index)
    - [Features](#features)
    - [How to Use](#how-to-use)
    - [License](#license)
  - [日本語](#日本語)
    - [目次](#目次)
    - [特徴](#特徴)
    - [使い方](#使い方)
    - [ライセンス](#ライセンス)

### Features
- **High Performance**: Uses Inline Web Workers to perform heavy calculations without freezing the UI.
- **Security**: Designed as an Inline Worker to work in various environments (local `file://` and `https://`).
- **Dark Mode**: Focused UI based on "Yuzuko Special Dark" design guidelines.
- **Flexible Export**: Download results as `.txt` or `.md` files.

### How to Use
1. Enter characters (e.g., `A,B,C` or `ABC`).
2. Click **Start Calculation**.
3. View the preview and click **Download** to save all results.

### License
This project is licensed under the [MIT License](LICENSE).

---

## 日本語

入力された文字からすべての並び替えパターン（$nPn$：順列）を生成するウェブアプリケーションです。Web Workerを活用した高速な計算と、洗練されたダークモードUIを特徴としています。

### 目次
- [特徴](#特徴)
- [使い方](#使い方)
- [ライセンス](#ライセンス)

### 特徴
- **ハイパフォーマンス**: インラインWeb Workerにより、UIを固まらせることなく膨大な組み合わせを計算可能。
- **高い互換性**: セキュリティ制限を回避する設計により、ローカル環境（`file://`）とホスティング環境（`https://`）の両方で動作。
- **ダークモード**: 「ユズコ専用ダーク」デザインガイドに基づいた、目に優しく集中できるUI。
- **エクスポート機能**: 生成結果を `.txt` または `.md` 形式でダウンロード可能。ファイル名は入力文字に自動連動。

### 使い方
1. 文字を入力します（例: `A,B,C` または `ABC`）。
2. **計算スタート** ボタンをクリックします。
3. プレビューを確認し、保存ボタンから全結果をダウンロードします。

### ライセンス
このプロジェクトは [MIT License](LICENSE) の下で公開されています。
