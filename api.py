 # api.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

from prompt_designer import design_prompt  # ← さっきのファイルから import

class PromptRequest(BaseModel):
    userRequest: str

app = FastAPI()

# Next.js から叩けるように CORS 設定（開発用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 必要に応じて調整
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/design_prompt")
async def design_prompt_endpoint(body: PromptRequest):
    result = await design_prompt(body.userRequest)
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
