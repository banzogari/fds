import { useState } from 'react';
import { simulate } from '../api/fdsApi';

export default function Simulation() {
  const [rowIndex, setRowIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulate(rowIndex);
      setResult(data);
    } catch {
      setError('시뮬레이션 요청 실패. 백엔드 서버를 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>FDS 시뮬레이션</h1>

      {/* Row Index 입력 */}
      <div style={{ marginBottom: '20px' }}>
        <label>Row Index: </label>
        <input
          type="number"
          value={rowIndex}
          onChange={(e) => setRowIndex(Number(e.target.value))}
          min={0}
          style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
        />
        <button
          onClick={handleSimulate}
          disabled={loading}
          style={{
            marginLeft: '10px',
            padding: '5px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {loading ? '처리 중...' : '예측 실행'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
      )}

      {/* 결과 출력 */}
      {result && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: result.predicted_label === 1 ? '#fff0f0' : '#f0fff0',
          }}
        >
          <h2>예측 결과</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Row Index</td>
                <td>{result.row_index}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>실제 Label</td>
                <td>{result.actual_label === 1 ? '🚨 사기' : '✅ 정상'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>예측 Label</td>
                <td>{result.predicted_label === 1 ? '🚨 사기' : '✅ 정상'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>사기 확률</td>
                <td>{(result.fraud_probability * 100).toFixed(2)}%</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Threshold</td>
                <td>{result.threshold}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>예측 정확도</td>
                <td>{result.is_correct ? '✅ 정확' : '❌ 오류'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>모델 모드</td>
                <td>{result.model_mode}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}