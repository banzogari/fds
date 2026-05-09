from pydantic import BaseModel, Field


class SimulateRequest(BaseModel):
    """
    시뮬레이션 요청 스키마
    CSV에서 읽을 row index를 지정
    """
    row_index: int = Field(
        ...,
        ge=0,
        description="Row index to read from the dataset (0-based)"
    )


class SimulateResponse(BaseModel):
    """
    시뮬레이션 응답 스키마
    실제 label + 예측 결과를 함께 반환
    """
    row_index: int = Field(..., description="Row index used for simulation")
    actual_label: int = Field(
        ...,
        ge=0,
        le=1,
        description="Actual class label from dataset (0: normal, 1: fraud)"
    )
    fraud_probability: float = Field(..., ge=0.0, le=1.0)
    predicted_label: int = Field(..., ge=0, le=1)
    threshold: float = Field(..., ge=0.0, le=1.0)
    model_mode: str = Field(...)
    message: str = Field(...)
    is_correct: bool = Field(
        ...,
        description="Whether prediction matched actual label"
    )