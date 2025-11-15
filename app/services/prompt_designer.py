# app/services/prompt_designer.py

import os
import asyncio
from dotenv import load_dotenv
from agents import Agent, Runner, trace, enable_verbose_stdout_logging

# .env 読み込み
load_dotenv()

# コンソールに詳細ログを出したくない場合は、この1行はコメントアウトしてOK
enable_verbose_stdout_logging()

# model定義
ai_model = "gpt-4.1-mini"

# 1) 構成エージェント
structure_agent = Agent(
    name="prompt_structure_agent",
    instructions="""
あなたは「プロンプト構成エージェント」です。
ユーザーが「〇〇ができるプロンプトを作りたい」と説明した内容をもとに、
プロンプトの構成要素を洗い出します。

出力では、以下の項目を必ず日本語で整理してください：

# 1. プロンプトの目的
# 2. 想定するユーザー / 対象
# 3. 入力情報
# 4. 出力イメージ
# 5. 制約条件・ルール
# 6. 思考プロセス
# 7. 出力フォーマット指定
""",
    model=ai_model,
)

# 2) 作成エージェント（ライター）
writer_agent = Agent(
    name="prompt_writer_agent",
    instructions="""
あなたは「プロンプト作成エージェント（Writer）」です。
構成エージェントが出力した構成に基づいて、完成度の高いプロンプト本文を1つ作成します。

ルール：
- 日本語
- ChatGPTなどのLLMにそのまま貼り付けられる形式
- 以下の構造を含める：

---
# 役割
# ゴール
# 入力時の指示（ユーザーへの案内文）
# モデルへの具体的な指示
# 出力フォーマット
# 守るべきルール
---

説明文は書かず、「プロンプト本文」だけを出力してください。
""",
    model=ai_model,
)

# 3) 検査エージェント（Reviewer）
reviewer_agent = Agent(
    name="prompt_reviewer_agent",
    instructions="""
あなたは「プロンプト検査エージェント（Reviewer）」です。
与えられたプロンプト本文をレビューし、必要に応じて修正を加えた最終版を出力します。

出力フォーマット：

# 1. 評価（OK / 要修正）
...

# 2. 問題点・改善ポイント
- ...

# 3. 修正済みの最終プロンプト
...
""",
    model=ai_model,
)


async def design_prompt(user_request: str):
    """
    ユーザーの要望から
    1) 構成 → 2) プロンプト作成 → 3) レビュー
    を1つの trace として実行する
    """
    with trace(workflow_name="PromptDesigner", metadata={"user_request": user_request}):
        # ① ユーザー要望 → 構成エージェント
        structure_input = (
            "ユーザーの要望：\n"
            f"{user_request}\n\n"
            "この要望に基づき、プロンプト構成を整理してください。"
        )
        structure_result = await Runner.run(structure_agent, structure_input)
        structure_text = structure_result.final_output

        # ② 構成 → 作成エージェント
        writer_input = f"""以下がプロンプト構成です。この構成に厳密に沿ってプロンプト本文を作成してください。

【ユーザーの要望】
{user_request}

【プロンプト構成】
{structure_text}
"""
        writer_result = await Runner.run(writer_agent, writer_input)
        draft_prompt = writer_result.final_output

        # ③ 作成済みプロンプト → 検査エージェント
        reviewer_input = f"""以下のプロンプトをレビューし、必要に応じて修正した最終版を出力してください。

【ユーザーの要望】
{user_request}

【作成済みプロンプト】
{draft_prompt}
"""
        review_result = await Runner.run(reviewer_agent, reviewer_input)
        review_text = review_result.final_output

        return {
            "structure": structure_text,
            "draft_prompt": draft_prompt,
            "review": review_text,
        }
