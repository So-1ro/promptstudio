# api/services/prompt_service.py
from app.services.prompt_designer import design_prompt  

# Next.js からのリクエストを受けて実際の処理を呼び出すサービス関数
async def design_prompt_service(user_request: str):
    # 必要ならここで前処理・ログ・例外処理などを挟む
    result = await design_prompt(user_request)
    return result