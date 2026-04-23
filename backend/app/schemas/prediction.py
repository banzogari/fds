from typing import List
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

    # 거래 금액
    amount: float = Field(
        ...,
        ge=0,                               # 금액은 0 이상이어야 함(음수 방지)
        description="Transaction amount"
    )

# 사용자에게 보여줄 최종 판단 결과
class PredictionResponse(BaseModel):
    """
    추후 모델 기반 예측 응답 스키마
    프론트가 바로 사용할 수 있는 구조
    """
    
    transaction_id: int = Field(..., description="Saved transaction ID")    # DB에 저장된 거래 ID
    prediction_id: int = Field(..., description="Saved prediction ID")      # DB에 저장된 예측 결과 ID

    # 사기 확률
    fraud_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Predicted probability that the transaction is fraudulent"
    )
    # threshold 적용 후 최종 분류 결과
    # 0 or 1
    predicted_label: int = Field(
        ...,
        ge=0,
        le=1,
        description="Final predicted class after applying threshold (0: normal, 1: fraud)"
    )
    # threshold 조건 정의
    # greater than 0 or equal 0 / less than 1 or equal 1
    threshold: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Threshold used to convert probability into final label"
    )
    model_mode: str = Field(
        ...,
        description="Ensemble"         
    )
    # 사용자용 메시지
    message: str = Field(
        ...,
        description="Human-readable prediction message"
    )


class ModelPredictionResult(BaseModel):
    """
    앙상블에서 각 모델별 개별 결과 스키마
    """

    model_name: str = Field(..., description="Model name, e.g. rf, xgb")
    fraud_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Fraud probability predicted by the individual model"
    )
    threshold: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Threshold used by the individual model"
    )
    predicted_label: int = Field(
        ...,
        ge=0,
        le=1,
        description="Predicted label from the individual model"
    )

# 각 모델이 어떻게 판단했는지 기록
class EnsemblePredictionResponse(BaseModel):
    """
    앙상블 예측 응답 스키마
    각 모델 결과 + 최종 앙상블 결과를 함께 반환
    """

    transaction_id: int = Field(..., description="Saved transaction ID")    # DB에 저장된 거래 ID
    prediction_id: int = Field(..., description="Saved prediction ID")      # DB에 저장된 예측 결과 ID  

    # model 개별 예측 결과
    model_results: List[ModelPredictionResult] = Field(
        ...,
        description="Per-model prediction results"
    )
    # model 통합 예측 결과
    ensemble_fraud_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Final fraud probability after ensemble aggregation"
    )
    # model 통합 threshold
    ensemble_threshold: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Threshold used for final ensemble prediction"
    )
    # model 통합 threshold 적용 후 최종 판단 결과
    # 0 or 1
    ensemble_predicted_label: int = Field(
        ...,
        ge=0,
        le=1,
        description="Final predicted label after applying ensemble threshold"
    )

    model_mode: str = Field(
        ...,
        description="Prediction mode: ensemble"
    )
    message: str = Field(
        ...,
        description="Human-readable ensemble prediction message"
    )