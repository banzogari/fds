from fastapi import APIRouter
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.predictor import predictor

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    """
    단건 예측 엔드포인트
    - RF 단일 모델 기반 예측
    """
    return predictor.predict(request)