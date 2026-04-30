from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """
    단건 예측 요청 스키마
    모델 입력 feature만 포함
    """
    time: float = Field(
        ...,
        description="Seconds elapsed between this transaction and the first transaction in the dataset"
    )
    v1: float = Field(..., description="PCA-transformed feature V1")
    v2: float = Field(..., description="PCA-transformed feature V2")
    v3: float = Field(..., description="PCA-transformed feature V3")
    v4: float = Field(..., description="PCA-transformed feature V4")
    v5: float = Field(..., description="PCA-transformed feature V5")
    v6: float = Field(..., description="PCA-transformed feature V6")
    v7: float = Field(..., description="PCA-transformed feature V7")
    v8: float = Field(..., description="PCA-transformed feature V8")
    v9: float = Field(..., description="PCA-transformed feature V9")
    v10: float = Field(..., description="PCA-transformed feature V10")
    v11: float = Field(..., description="PCA-transformed feature V11")
    v12: float = Field(..., description="PCA-transformed feature V12")
    v13: float = Field(..., description="PCA-transformed feature V13")
    v14: float = Field(..., description="PCA-transformed feature V14")
    v15: float = Field(..., description="PCA-transformed feature V15")
    v16: float = Field(..., description="PCA-transformed feature V16")
    v17: float = Field(..., description="PCA-transformed feature V17")
    v18: float = Field(..., description="PCA-transformed feature V18")
    v19: float = Field(..., description="PCA-transformed feature V19")
    v20: float = Field(..., description="PCA-transformed feature V20")
    v21: float = Field(..., description="PCA-transformed feature V21")
    v22: float = Field(..., description="PCA-transformed feature V22")
    v23: float = Field(..., description="PCA-transformed feature V23")
    v24: float = Field(..., description="PCA-transformed feature V24")
    v25: float = Field(..., description="PCA-transformed feature V25")
    v26: float = Field(..., description="PCA-transformed feature V26")
    v27: float = Field(..., description="PCA-transformed feature V27")
    v28: float = Field(..., description="PCA-transformed feature V28")
    amount: float = Field(
        ...,
        ge=0,
        description="Transaction amount"
    )


class PredictionResponse(BaseModel):
    """
    RF 단일 모델 예측 응답 스키마
    """
    transaction_id: int = Field(..., description="Saved transaction ID")
    prediction_id: int = Field(..., description="Saved prediction ID")

    fraud_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Predicted fraud probability"
    )
    predicted_label: int = Field(
        ...,
        ge=0,
        le=1,
        description="Final predicted class (0: normal, 1: fraud)"
    )
    threshold: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Threshold used to convert probability into label"
    )
    model_mode: str = Field(..., description="rf")
    message: str = Field(..., description="Human-readable prediction message")