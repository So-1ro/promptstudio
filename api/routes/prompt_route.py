# api/routes/prompt_route.py
from fastapi import APIRouter

from api.schemas.prompt_schema import PromptRequest, PromptResponse
from api.services.prompt_service import design_prompt_service

router = APIRouter()

@router.post("/design_prompt", response_model=PromptResponse)
async def design_prompt_endpoint(body: PromptRequest):
    result = await design_prompt_service(body.userRequest)
    return result
