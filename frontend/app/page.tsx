"use client";

import { useState } from "react";

type DesignResult = {
  structure: string;
  draftPrompt: string;
  review: string;
};

// Reviewer の出力から「最終プロンプト本文」だけを抽出
function extractFinalPrompt(review: string): string {
  if (!review) return "";

  // 1. ``` で囲まれたコードブロックがあれば、その中身を優先
  const firstFence = review.indexOf("```");
  if (firstFence !== -1) {
    let afterFirst = review.slice(firstFence + 3);

    // 言語指定（```markdown など）を1行スキップ
    const firstNewline = afterFirst.indexOf("\n");
    if (firstNewline !== -1) {
      const firstLine = afterFirst.slice(0, firstNewline).trim();
      if (/^[a-zA-Z]+$/.test(firstLine)) {
        afterFirst = afterFirst.slice(firstNewline + 1);
      }
    }

    const secondFence = afterFirst.indexOf("```");
    const codeBlock =
      secondFence !== -1 ? afterFirst.slice(0, secondFence) : afterFirst;
    const trimmed = codeBlock.trim();
    if (trimmed) return trimmed;
  }

  // 2. フォールバック：テキスト内の「# 役割」以降
  const roleIdx = review.indexOf("# 役割");
  if (roleIdx !== -1) {
    return review.slice(roleIdx).trim();
  }

  return review.trim();
}


export default function Home() {
  const [userRequest, setUserRequest] = useState("");
  const [finalBody, setFinalBody] = useState(""); // プロンプト本文（#役割〜）
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!userRequest.trim()) return;

    setLoading(true);
    setError(null);
    setFinalBody("");
    setCopied(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/design_prompt`, 
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userRequest }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "API Error");
      }

      const data = (await res.json()) as DesignResult;
      const extracted = extractFinalPrompt(data.review);
      setFinalBody(extracted);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUserRequest("");
    setFinalBody("");
    setError(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!finalBody) return;
    try {
      await navigator.clipboard.writeText(finalBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("コピーに失敗しました:", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* ヘッダー */}
        <header style={{ marginBottom: "24px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Prompt Studio ~ 誰でも理想のプロンプトを生成 ~
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            あなたの「〇〇ができるプロンプトを作りたい」という要望から、
            実際に使える完成プロンプトを自動生成します。
          </p>
        </header>

        {/*　プロンプトエディタカード */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#111827",
            }}
          >
            プロンプト設計書
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "12px",
            }}
          >
            テキストボックスに「どのようなプロンプトを作りたいか(=設計書)」を日本語で入力してください。<br />
            設計書の内容を元に、複数のAIエージェントが様々な観点から最適なプロンプトを生成します。
          </p>

          {/* テキストエリア */}
          <textarea
            style={{
              width: "100%",
              minHeight: "160px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "12px",
              fontSize: "14px",
              outline: "none",
              resize: "vertical",
            }}
            placeholder="例：最新のAI関連記事をもとに「要約・重要ポイント・今後の予測」を出力するプロンプトを作りたい"
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
          />

          {/* ボタン行 */}
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#0067c0",
                color: "#ffffff",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "生成中..." : "プロンプト生成開始"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#0067c0",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              入力内容をクリア
            </button>
          </div>

          {error && (
            <p
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: "#b91c1c",
              }}
            >
              エラー: {error}
            </p>
          )}
        </section>

        {/* 🔹 プロンプトプレビューカード */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                プロンプト生成結果
              </h2>
              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                以下のプロンプトがあなたに理想のプロンプトです。
                プロンプトをコピーし、実際に活用してみましょう。
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!finalBody}
              style={{
                fontSize: "12px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: finalBody
                  ? copied
                    ? "#16a34a"
                    : "#f3f4f6"
                  : "#e5e7eb",
                color: finalBody ? (copied ? "#ffffff" : "#111827") : "#9ca3af",
                cursor: finalBody ? "pointer" : "default",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "コピーしました" : "Copy"}
            </button>
          </div>

          <div
            style={{
              borderRadius: "8px",
              backgroundColor: "#f3f4f6",
              color: "#111827",
              padding: "12px",
              fontSize: "13px",
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              minHeight: "200px",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {finalBody || "ここに最終プロンプトが表示されます。"}
          </div>
        </section>

        {/* 機能説明カード（必要なければ削除してもOK） */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#111827",
            }}
          >
            機能概要
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "16px",
            }}
          >
            PromptStudio は、プロンプト作成を「シンプル」「効率的」「再利用しやすい」形でサポートします。<br />
            業務・学習・AI活用のあらゆるシーンに最適なプロンプトを、誰でも短時間で生成できます。
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
              fontSize: "13px",
              color: "#374151",
            }}
          >
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                プロンプト設計
              </h3>
              <ul style={{ paddingLeft: "16px", margin: 0 }}>
                <li>
                  <strong>要件ベースの自動プロンプト生成</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - 入力内容に応じて最適なプロンプトを自動生成します。
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>プロンプト構造化</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - 実務で使いやすい構造に整理し、テンプレート化します。
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>クオリティチェック</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - 曖昧さや過不足を自動チェックし、精度を向上します。
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                出力・コピー
              </h3>
              <ul style={{ paddingLeft: "16px", margin: 0 }}>
                <li>
                  <strong>最終プロンプトのみをクリーン表示</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - 余計な説明等を除去した純粋なプロンプトだけを抽出
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>ワンクリックコピー</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - ChatGPTやClaudeなど各ツールに貼り付けやすい形で出力
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>LLM向け最適化フォーマット</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - 曖昧さや過不足を自動チェックし、精度を向上します。
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: "4px" }}>
                利用シーン
              </h3>
              <ul style={{ paddingLeft: "16px", margin: 0 }}>
                <li>
                  <strong>自社業務プロセスのプロンプト標準化</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - レポート生成／問い合わせ対応／ナレッジ整理など
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>社内向け AI 活用ガイドの作成</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - AI教育用プロンプトの整備・テンプレート化
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>個人の作業フロー効率化・自動化</strong>
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", marginBottom: "8px" }}>
                    <li style={{ fontSize: "14px", color: "#555" }}>
                      - プロンプトの再利用／テンプレート管理／日常業務の効率UP
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
