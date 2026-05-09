from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.transaction import SimulateRequest, SimulateResponse
from app.services.simulator import simulator
from app.services.predictor import predictor
from app.db import crud
from app.dependencies.db import get_db

router = APIRouter()

@router.post("/simulate", response_model=SimulateResponse)
def simulate(
    request: SimulateRequest,
    db: Session = Depends(get_db)
) -> SimulateResponse:
    """
    단건 시뮬레이션 엔드포인트

    1. CSV에서 row 읽기
    2. 거래 데이터 DB 저장
    3. RF 모델 예측 수행
    4. 예측 결과 DB 저장
    5. 실제 label과 비교 후 반환
    """
    try:
        # CSV row 읽기
        pred_request, actual_label = simulator.simulate(request.row_index)

        # 거래 데이터 DB 저장
        transaction = crud.create_transaction(
            db=db,
            request=pred_request,
            actual_label=actual_label
        )

        # 예측 수행
        result = predictor.predict(pred_request)

        # 예측 결과 DB 저장
        prediction = crud.create_prediction(
            db=db,
            transaction_id=transaction.id,
            result=result
        )

        return SimulateResponse(
            row_index=request.row_index,
            actual_label=actual_label,
            fraud_probability=result.fraud_probability,
            predicted_label=result.predicted_label,
            threshold=result.threshold,
            model_mode=result.model_mode,
            message=result.message,
            is_correct=(result.predicted_label == actual_label),
        )

    except IndexError as e:
        raise HTTPException(status_code=400, detail=str(e))