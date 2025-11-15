from pydantic import BaseModel

class PromptRequest(BaseModel):
    userRequest: str


class PromptResponse(BaseModel):
    structure: str
    draft_prompt: str
    review: str