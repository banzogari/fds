import { useState } from 'react';
import { simulate } from '../api/fdsApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  // 단건 시뮬레이션 실행
  const handleNext = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await simulate(currentIndex);
      setResults((prev) => [...prev, data]);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      setError('요청 실패. 백엔드 서버를 확인하세요.');
    } finally {
      setRunning(false);
    }
  };

  // 통계 계산
  const total = results.length;
  const correct = results.filter((r) => r.is_correct).length;
  const fraudDetected = results.filter((r) => r.predicted_label === 1).length;
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;

  // 차트 데이터
  const chartData = [
    { name: '정상', value: results.filter((r) => r.predicted_label === 0).length },
    { name: '사기', value: fraudDetected },
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>FDS 대시보드</h1>

      {/* 실행 버튼 */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={handleNext}
          disabled={running}
          style={{
            padding: '10px 30px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {running ? '처리 중...' : `다음 거래 예측 (Row ${currentIndex})`}
        </button>
        <button
          onClick={() => { setResults([]); setCurrentIndex(0); }}
          style={{
            marginLeft: '10px',
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          초기화
        </button>
      </div>

      {/* 에러 */}
      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* 통계 카드 */}
      {total > 0 && (
        <>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <StatCard title="총 건수" value={total} color="#2196F3" />
            <StatCard title="정확도" value={`${accuracy}%`} color="#4CAF50" />
            <StatCard title="사기 탐지" value={fraudDetected} color="#f44336" />
            <StatCard title="정상" value={total - fraudDetected} color="#9E9E9E" />
          </div>

          {/* 차트 */}
          <div style={{ marginBottom: '30px' }}>
            <h2>예측 결과 분포</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#2196F3" name="건수" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 결과 리스트 */}
          <h2>예측 이력</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Row</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>실제</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>예측</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>확률</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>정확도</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: r.is_correct ? 'white' : '#fff0f0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <td style={{ padding: '10px' }}>{r.row_index}</td>
                  <td style={{ padding: '10px' }}>
                    {r.actual_label === 1 ? '🚨 사기' : '✅ 정상'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {r.predicted_label === 1 ? '🚨 사기' : '✅ 정상'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {(r.fraud_probability * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '10px' }}>
                    {r.is_correct ? '✅' : '❌'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: color,
        color: 'white',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}