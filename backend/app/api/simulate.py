from fastapi import APIRouter, HTTPException
from app.schemas.transaction import SimulateRequest, SimulateResponse
from app.services.simulator import simulator

router = APIRouter()


@router.post("/simulate", response_model=SimulateResponse)
def simulate(request: SimulateRequest) -> SimulateResponse:
    """
    단건 시뮬레이션 엔드포인트

    - CSV에서 지정한 row를 읽어 예측 수행
    - 실제 label과 예측 label 비교 결과 반환
    """
    try:
        return simulator.simulate(request.row_index)
    except IndexError as e:
        raise HTTPException(status_code=400, detail=str(e))