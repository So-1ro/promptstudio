# api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.prompt_route import router as prompt_router

app = FastAPI()

# Next.js（ローカルと将来の Vercel）から叩けるように CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",            # ローカル開発時の Next.js
        # "https://xxx.vercel.app",        # デプロイ後に Vercel の URL を追加
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(prompt_router)


# ローカル実行用
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)