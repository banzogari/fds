import pandas as pd
from app.core.config import settings
from app.schemas.prediction import PredictionRequest
from app.schemas.transaction import SimulateResponse
from app.services.predictor import predictor


class Simulator:
    """
    시뮬레이션 서비스 클래스

    역할:
    - CSV에서 row를 읽어 PredictionRequest로 변환
    - predictor에 전달 후 결과 반환
    - 실제 label과 예측 label 비교
    """

    def __init__(self):
        self._df = None

    def _load_data(self) -> pd.DataFrame:
        """
        CSV 지연 로딩 (lazy loading)
        처음 호출 시에만 읽고 이후 재사용
        """
        if self._df is None:
            self._df = pd.read_csv(settings.SIMULATION_DATA_PATH)
        return self._df

    def simulate(self, row_index: int) -> SimulateResponse:
        """
        단건 시뮬레이션

        1. CSV에서 row_index 행 읽기
        2. PredictionRequest로 변환
        3. predictor 호출
        4. 실제 label과 비교 후 반환
        """
        df = self._load_data()

        # row_index 유효성 검사
        if row_index >= len(df):
            raise IndexError(
                f"row_index {row_index} is out of range. Dataset has {len(df)} rows."
            )

        row = df.iloc[row_index]

        # 실제 label 추출 (Class 컬럼)
        actual_label = int(row["Class"])

        # CSV row → PredictionRequest 변환
        # CSV 컬럼명(대문자) → PredictionRequest 필드명(소문자)
        request = PredictionRequest(
            time=row["Time"],
            v1=row["V1"],   v2=row["V2"],   v3=row["V3"],   v4=row["V4"],
            v5=row["V5"],   v6=row["V6"],   v7=row["V7"],   v8=row["V8"],
            v9=row["V9"],   v10=row["V10"], v11=row["V11"], v12=row["V12"],
            v13=row["V13"], v14=row["V14"], v15=row["V15"], v16=row["V16"],
            v17=row["V17"], v18=row["V18"], v19=row["V19"], v20=row["V20"],
            v21=row["V21"], v22=row["V22"], v23=row["V23"], v24=row["V24"],
            v25=row["V25"], v26=row["V26"], v27=row["V27"], v28=row["V28"],
            amount=row["Amount"],
        )

        # 예측 수행
        result = predictor.predict(request)

        return SimulateResponse(
            row_index=row_index,
            actual_label=actual_label,
            fraud_probability=result.fraud_probability,
            predicted_label=result.predicted_label,
            threshold=result.threshold,
            model_mode=result.model_mode,
            message=result.message,
            is_correct=(result.predicted_label == actual_label),
        )


# 싱글톤 인스턴스
simulator = Simulator()