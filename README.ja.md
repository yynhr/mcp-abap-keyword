# MCP ABAP キーワードサーバー

SAPの公式ドキュメントサイト(https://help.sap.com)からABAPキーワードドキュメントにアクセスするためのModel Context Protocol(MCP)サーバーです。

## 特徴

- 🔍 公式ABAPインデックスでABAPキーワードを検索
- 📖 ABAPグロッサリーで用語を検索  
- 📚 ABAPトピックを参照(辞書、CDS、プログラミング言語、RAPなど)
- 🗂️ メインドキュメント構造をナビゲート
- ⚡ 高速な繰り返しクエリのためのインテリジェントなキャッシュシステム(1年のキャッシュTTL)
- 🚀 キャッシュされたコンテンツで最大44倍のレスポンス高速化

## 必要要件

- Node.js 18.0.0以上
- npm 9.0.0以上
- TypeScript 5.3.0以上

## Node.js セットアップガイド

### macOS

#### オプション1: Homebrewを使用(推奨)
```bash
# Homebrewがインストールされていない場合はインストール
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.jsのインストール
brew install node

# インストール確認
node --version
npm --version
```

#### オプション2: 直接ダウンロード
1. https://nodejs.org/ にアクセス
2. macOS用のLTS(長期サポート)バージョンをダウンロード
3. インストーラーを実行し、プロンプトに従う
4. ターミナルを開いて以下を実行し、インストール確認:
```bash
node --version
npm --version
```

### Windows

#### オプション1: インストーラーを使用(推奨)
1. https://nodejs.org/ にアクセス
2. Windows用のLTSバージョンをダウンロード
3. `.msi`インストーラーを実行
4. インストールウィザードに従う(デフォルト設定で構いません)
5. コマンドプロンプトを開いて確認:
```bash
node --version
npm --version
```

#### オプション2: Chocolateyを使用
```powershell
# Chocolateyがインストールされている場合
choco install nodejs

# インストール確認
node --version
npm --version
```

#### オプション3: Windows Package Managerを使用
```powershell
winget install OpenJS.NodeJS

# インストール確認
node --version
npm --version
```

## インストール

```bash
npm install
```

## ビルド

```bash
npm run build
```

## 開発

```bash
npm run dev
```

## テスト

テストスクリプトは`test/`ディレクトリにあります(バージョン管理から除外)。

```bash
# キャッシュパフォーマンステストを実行
node test/test-cache.js

# RAP動作定義テストを実行
node test/test-rap-detailed.js

# 基本機能テストを実行
node test/test.js
```

詳細は [test/README.md](test/README.md) を参照してください。

## 利用可能なツール

### 1. search_abap_keyword

公式ABAPインデックスでABAPキーワードを検索します。

**パラメーター:**
- `keyword` (必須): 検索するABAPキーワード(例: 'SELECT', 'DATA', 'CLASS')

**例:**
```json
{
  "keyword": "SELECT"
}
```

### 2. lookup_glossary

ABAPグロッサリーで用語を検索し、その定義と説明を取得します。

**パラメーター:**
- `term` (必須): 検索する用語(例: 'ABAP Objects', 'CDS', 'RAP')

**例:**
```json
{
  "term": "ABAP Objects"
}
```

### 3. get_abap_topic

特定のABAPトピック領域に関する詳細情報を取得します。

**パラメーター:**
- `topic` (必須): 調査するトピック。利用可能なトピック:
  - `dictionary` または `ddic` - ABAP辞書
  - `cds` - ABAPコアデータサービス
  - `programming` または `language` - ABAPプログラミング言語
  - `rap` または `restful` - ABAPレスティアアプリケーションプログラミングモデル
  - `examples` - ABAPの例
  - `news` または `releases` - リリースニュース

**例:**
```json
{
  "topic": "cds"
}
```

### 4. browse_main_topics

ABAPキーワードドキュメントのすべてのメイントピックを参照します。利用可能なドキュメントセクションのカテゴリー概要を返します。

**パラメーター:** なし

## 設定

### Claude Desktop / Claude Code

Claude DesktopまたはClaude CodeでこのMCPサーバーを使用するには、Claudeの設定ファイルに設定を追加します:

#### macOS/Linux

`~/Library/Application Support/Claude/claude_desktop_config.json`(Claude Desktop)または`~/.config/claude-code/config.json`(Claude Code)を編集:

```json
{
  "mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-abap-keyword/build/index.js"]
    }
  }
}
```

**コマンドラインでの追加方法:**

```bash
# claudeコマンドを使用してMCPサーバーを追加
claude mcp add mcp-abap-keyword node /absolute/path/to/mcp-abap-keyword/build/index.js
```

#### Windows

`%APPDATA%\Claude\claude_desktop_config.json`(Claude Desktop)または`%APPDATA%\claude-code\config.json`(Claude Code)を編集:

```json
{
  "mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\mcp-abap-keyword\\build\\index.js"]
    }
  }
}
```

**コマンドラインでの追加方法:**

```powershell
# claudeコマンドを使用してMCPサーバーを追加
claude mcp add mcp-abap-keyword node C:\absolute\path\to\mcp-abap-keyword\build\index.js
```

**注意:** 設定を追加した後、変更を有効にするためにClaude DesktopまたはClaude Codeを再起動してください。

### Cline (VS Code拡張機能)

[Cline](https://github.com/cline/cline)でこのMCPサーバーを使用するには、以下の手順に従ってください:

#### macOS

1. VS CodeでCline拡張機能をインストール
2. VS Code設定を開く(Code > Preferences > Settings または Cmd+,)
3. "Cline"を検索してMCP設定セクションを見つける
4. `settings.json`にサーバー設定を追加:

```json
{
  "cline.mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-abap-keyword/build/index.js"]
    }
  }
}
```

または、ワークスペースの`.vscode/settings.json`を編集:

```json
{
  "cline.mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["${workspaceFolder}/../mcp-abap-keyword/build/index.js"]
    }
  }
}
```

#### Windows

1. VS CodeでCline拡張機能をインストール
2. VS Code設定を開く(File > Preferences > Settings または Ctrl+,)
3. "Cline"を検索してMCP設定セクションを見つける
4. `settings.json`にサーバー設定を追加:

```json
{
  "cline.mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["C:\\\\absolute\\\\path\\\\to\\\\mcp-abap-keyword\\\\build\\\\index.js"]
    }
  }
}
```

または、ワークスペースの`.vscode\settings.json`を編集:

```json
{
  "cline.mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["${workspaceFolder}\\\\..\\\\mcp-abap-keyword\\\\build\\\\index.js"]
    }
  }
}
```

パスはプロジェクトのbuildディレクトリの実際の絶対パスに置き換えてください。

## データソース

すべての情報はSAPの公式ABAPキーワードドキュメントから取得されます:
https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABENABAP.html

## キャッシング

サーバーはパフォーマンスを向上させるための効率的なファイルベースのキャッシュ系統を実装しています:

- **キャッシュ位置**: スクリプトの位置を基准とした`cache/`ディレクトリ
- **キャッシュ形式**: Gzip圧縮消捷したHTMLファイル(`.html.gz`)
- **ファイル名付け**: ページURLのSHA256ハッシュ(12文字16進数) + `.html.gz`拡張子
- **キャッシュTTL**: 365日(1年) - 設定可能
- **HTMLクリーニング**: キャッシャル前に不要な要素を自動的に削除:
  - 外部スクリプト(`<script src>`)
  - スタイルシートリンク(`<link>タグ`)
  - メタビタ(`<meta>タグ`)
  - インラインスタイル(`<style>タグ`)
  - Noscript代死(と粗`<noscript>タグ`)
  - HTMLコメント
- **圧縮**: 最大圧縮境界(level 9)を使用した効率的なٱ保管
- **自動管理**: 手動キャッシュ管理は不要
- **キャッシュ之救時間**: 365日瀝過二荐動的に無効化
- **パフォーマンス**: キャッシュされたコンテンツに対して最夤44倍高速なレスポンス

キャッシュを手動で削除:
```bash
rm -rf cache
```

## ライセンス

MIT
