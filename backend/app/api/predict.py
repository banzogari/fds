from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.predictor import predictor
from app.db import crud
from app.dependencies.db import get_db

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def predict(
    request: PredictionRequest,
    db: Session = Depends(get_db)
) -> PredictionResponse:
    """
    단건 예측 엔드포인트

    1. 거래 데이터 DB 저장
    2. RF 모델 예측 수행
    3. 예측 결과 DB 저장
    4. 실제 DB ID 포함한 응답 반환
    """
    # 거래 데이터 저장
    transaction = crud.create_transaction(db=db, request=request)

    # 예측 수행
    result = predictor.predict(request)

    # 예측 결과 저장
    prediction = crud.create_prediction(
        db=db,
        transaction_id=transaction.id,
        result=result
    )

    # 실제 DB ID로 교체 후 반환
    result.transaction_id = transaction.id
    result.prediction_id = prediction.id

    return result