import pandas as pd
from app.core.config import settings
from app.schemas.prediction import PredictionRequest


class Simulator:
    """
    시뮬레이션 서비스 클래스

    역할:
    - CSV에서 row를 읽어 PredictionRequest로 변환
    - actual_label과 함께 반환
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

    def simulate(self, row_index: int):
        df = self._load_data()

        if row_index >= len(df):
            raise IndexError(
                f"row_index {row_index} is out of range. Dataset has {len(df)} rows."
            )

        row = df.iloc[row_index]
        actual_label = int(row["Class"])

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

        return request, actual_label


# 싱글톤 인스턴스
simulator = Simulator()