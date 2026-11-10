import { useState, useEffect, useRef } from 'react';
import { simulate } from '../api/fdsApi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

const COLORS = {
  bg: '#0e0f12',
  card: '#17181c',
  border: '#25272d',
  text: '#f2f3f5',
  sub: '#8b8f98',
  green: '#4ade80',
  red: '#f87171',
  amber: '#fbbf24',
};

const RESULTS_LIMIT = 200;   // 표시용 버퍼 (통계는 stats 누적 카운터 사용)
const CHART_LIMIT = 100;
const FEED_LIMIT = 50;
const MISSED_LIMIT = 100;
const DEFAULT_THRESHOLD = 0.5;
const SPEED_OPTIONS = [
  { value: 500, label: '0.5s' },
  { value: 1000, label: '1s' },
  { value: 2000, label: '2s' },
];

const EMPTY_STATS = { total: 0, tp: 0, fp: 0, fn: 0, tn: 0, startedAt: null, activeMs: 0 };
const EMPTY_HISTOGRAM = Array.from({ length: 10 }, (_, i) => ({
  bucket: `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`,
  normal: 0,
  fraud: 0,
}));

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '14px',
  padding: '20px',
  minWidth: 0,
};

const labelStyle = { fontSize: '12px', color: COLORS.sub };

const tooltipStyle = {
  contentStyle: {
    background: '#1f2025', border: `1px solid ${COLORS.border}`,
    borderRadius: '8px', color: COLORS.text, fontSize: '12px',
  },
  labelStyle: { color: COLORS.sub },
  itemStyle: { color: COLORS.text },
  cursor: { fill: 'rgba(255,255,255,0.03)', stroke: COLORS.border },
};

const axisProps = {
  stroke: COLORS.sub,
  tick: { fill: COLORS.sub, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: COLORS.border },
};

// ---------- helpers ----------

const ratio = (num, den) => (den > 0 ? num / den : null);
const fmtPct = (v, digits = 1) => (v == null ? '—' : `${(v * 100).toFixed(digits)}%`);
const fmtProb = p => `${(p * 100).toFixed(2)}%`;
const alpha = (hex, a) => `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`;

function classify(r) {
  if (r.actual_label === 1) return r.predicted_label === 1 ? 'tp' : 'fn';
  return r.predicted_label === 1 ? 'fp' : 'tn';
}

function deriveMetrics(stats) {
  const { total, tp, fp, fn, tn, activeMs } = stats;
  const precision = ratio(tp, tp + fp);
  const recall = ratio(tp, tp + fn);
  const f1 = precision != null && recall != null && precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : null;
  return {
    precision,
    recall,
    f1,
    accuracy: ratio(tp + tn, total),
    fraudRate: ratio(tp + fp, total),
    throughput: activeMs > 0 ? total / (activeMs / 1000) : null,
  };
}

// ---------- main ----------

export default function Dashboard() {
  const [results, setResults] = useState([]);           // 최근 RESULTS_LIMIT건 (표시용)
  const [stats, setStats] = useState(EMPTY_STATS);      // 누적 카운터
  const [histogram, setHistogram] = useState(EMPTY_HISTOGRAM);
  const [missed, setMissed] = useState([]);             // 누적 FN (최근순)
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1000);
  const [error, setError] = useState(null);
  const indexRef = useRef(0);
  const speedRef = useRef(1000);

  // TODO: test set 사기 비율이 약 0.17%라 row_index 순차 재생 시 사기 건이 거의 나오지 않음.
  //       시연용으로 백엔드에서 샘플 순서(test set 사기 전체 + 정상 일부 셔플)를 제공받아
  //       그 순서대로 호출하도록 변경 필요 (백엔드 작업 선행).
  useEffect(() => {
    if (!running) return undefined;

    let stopped = false;
    let timeoutId;
    let lastTick = Date.now();

    const applyResult = (data) => {
      const now = Date.now();
      const elapsed = now - lastTick;
      lastTick = now;
      const kind = classify(data);

      setResults(previous => [data, ...previous].slice(0, RESULTS_LIMIT));
      setStats(previous => ({
        ...previous,
        total: previous.total + 1,
        [kind]: previous[kind] + 1,
        startedAt: previous.startedAt ?? now,
        activeMs: previous.activeMs + elapsed,
      }));
      const bucket = Math.min(9, Math.max(0, Math.floor(data.fraud_probability * 10)));
      const series = data.actual_label === 1 ? 'fraud' : 'normal';
      setHistogram(previous => previous.map((b, i) => (
        i === bucket ? { ...b, [series]: b[series] + 1 } : b
      )));
      if (kind === 'fn') {
        setMissed(previous => [data, ...previous].slice(0, MISSED_LIMIT));
      }
    };

    const simulateNext = async () => {
      try {
        const data = await simulate(indexRef.current);
        if (stopped) return;
        indexRef.current += 1;
        applyResult(data);
        timeoutId = setTimeout(simulateNext, speedRef.current);
      } catch (err) {
        if (stopped) return;
        setError(
          err.response?.data?.detail ||
          (err.response
            ? '시뮬레이션 요청에 실패했습니다. 데이터 경로를 확인하세요.'
            : '백엔드 서버 연결 오류')
        );
        setRunning(false);
      }
    };

    simulateNext();
    return () => {
      stopped = true;
      clearTimeout(timeoutId);
    };
  }, [running]);

  const toggleSimulation = () => {
    if (running) {
      setRunning(false);
    } else {
      setError(null);
      setRunning(true);
    }
  };

  const changeSpeed = (e) => {
    const value = Number(e.target.value);
    speedRef.current = value;
    setSpeed(value);
  };

  const metrics = deriveMetrics(stats);
  const latest = results[0];
  const model = {
    mode: latest?.model_mode ?? '—',
    threshold: latest?.threshold ?? DEFAULT_THRESHOLD,
  };

  return (
    <div className="fds-shell" style={{ background: COLORS.bg, color: COLORS.text, minHeight: '100vh' }}>
      <Sidebar running={running} model={model} hasData={stats.total > 0} />

      <main className="fds-main" id="overview" style={{ padding: '24px', minWidth: 0 }}>
        {/* row0: header */}
        <header className="fds-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px', marginBottom: '20px',
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em', margin: 0, color: COLORS.text }}>
              실시간 사기 탐지
            </h1>
            <p style={{ ...labelStyle, marginTop: '4px' }}>
              Credit Card Fraud Detection · Random Forest
            </p>
          </div>
          <div className="fds-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Pill color={running ? COLORS.green : COLORS.red}>
              <Dot color={running ? COLORS.green : COLORS.red} pulse={running} />
              {running ? 'LIVE' : 'STOPPED'}
            </Pill>
            <select
              aria-label="시뮬레이션 속도"
              value={speed}
              onChange={changeSpeed}
              className="fds-select"
            >
              {SPEED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              type="button"
              onClick={toggleSimulation}
              className={running ? 'fds-btn' : 'fds-btn fds-btn-primary'}
            >
              {running ? '중지' : '시작'}
            </button>
          </div>
        </header>

        {error && (
          <div style={{
            background: alpha(COLORS.red, 0.1), border: `1px solid ${alpha(COLORS.red, 0.4)}`,
            borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
            color: COLORS.red, fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* row1: KPI */}
        <div className="fds-kpis fds-row">
          <KpiCard
            label="총 처리"
            value={stats.total.toLocaleString()}
            pill={metrics.throughput == null ? null : `+${metrics.throughput.toFixed(1)}건/초`}
            pillColor={COLORS.green}
          />
          <KpiCard
            label="사기 탐지"
            value={(stats.tp + stats.fp).toLocaleString()}
            pill={metrics.fraudRate == null ? null : fmtPct(metrics.fraudRate, 2)}
            pillColor={COLORS.red}
          />
          <KpiCard
            label="Precision"
            value={fmtPct(metrics.precision)}
            pill={stats.tp + stats.fp > 0 ? `TP ${stats.tp} / 예측 ${stats.tp + stats.fp}` : null}
            pillColor={stats.fp > 0 ? COLORS.amber : COLORS.green}
          />
          <KpiCard
            label="Recall"
            value={fmtPct(metrics.recall)}
            pill={stats.tp + stats.fn > 0 ? `TP ${stats.tp} / 실제 ${stats.tp + stats.fn}` : null}
            pillColor={stats.fn > 0 ? COLORS.red : COLORS.green}
          />
        </div>

        {/* row2: 확률 추이 + 혼동행렬 */}
        <div className="fds-split fds-row" id="model">
          <ProbabilityChart results={results} threshold={model.threshold} />
          <ConfusionMatrix stats={stats} metrics={metrics} />
        </div>

        {/* row3: 히스토그램 + 놓친 사기 */}
        <div className="fds-split fds-row">
          <Histogram data={histogram} total={stats.total} />
          <MissedFraudList items={missed} />
        </div>

        {/* row4: 피드 + 이력 */}
        <div className="fds-half fds-row">
          <LiveFeed results={results} />
          <HistoryTable results={results} />
        </div>
      </main>

      <style>{`
        /* index.css(Vite 템플릿)의 #root 폭 제한·중앙 정렬 무력화 */
        #root { width: auto; max-width: none; margin: 0; border: 0; text-align: left; display: block; }
        .fds-shell {
          display: grid; grid-template-columns: 220px minmax(0, 1fr);
          font-size: 14px; line-height: 1.45; letter-spacing: normal;
        }
        .fds-row { display: grid; gap: 16px; margin-bottom: 16px; }
        .fds-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .fds-split { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
        .fds-half { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .fds-num { font-variant-numeric: tabular-nums; }

        .fds-sidebar {
          position: sticky; top: 0; height: 100vh;
          display: flex; flex-direction: column; gap: 24px;
          padding: 24px 16px; border-right: 1px solid ${COLORS.border};
          background: ${COLORS.bg};
        }
        .fds-nav-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 9px 12px; border: 0; border-radius: 10px;
          background: transparent; color: ${COLORS.sub};
          font: inherit; font-size: 13px; text-align: left; cursor: pointer;
        }
        .fds-nav-item:hover:not(:disabled) { color: ${COLORS.text}; background: rgba(255,255,255,0.03); }
        .fds-nav-item.active { color: ${COLORS.text}; background: ${COLORS.card}; }
        .fds-nav-item:disabled { opacity: 0.45; cursor: not-allowed; }

        .fds-btn, .fds-select {
          height: 34px; padding: 0 14px; border-radius: 10px;
          border: 1px solid ${COLORS.border}; background: ${COLORS.card};
          color: ${COLORS.text}; font: inherit; font-size: 13px; cursor: pointer;
        }
        .fds-select { padding: 0 10px; }
        .fds-btn:hover, .fds-select:hover { border-color: #3a3d45; }
        .fds-btn-primary { background: ${COLORS.green}; border-color: ${COLORS.green}; color: #0b0c0e; font-weight: 600; }
        .fds-btn-primary:hover { border-color: ${COLORS.green}; filter: brightness(1.05); }

        .fds-tab {
          padding: 5px 10px; border-radius: 8px; border: 0;
          background: transparent; color: ${COLORS.sub};
          font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap;
        }
        .fds-tab.active { background: #222329; color: ${COLORS.text}; }

        .fds-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .fds-table th {
          position: sticky; top: 0; background: ${COLORS.card};
          padding: 8px 10px; text-align: left; font-weight: 500; color: ${COLORS.sub};
          border-bottom: 1px solid ${COLORS.border};
        }
        .fds-table td { padding: 8px 10px; border-bottom: 1px solid ${COLORS.border}; }

        .fds-fade { animation: fdsFade 0.4s ease-out; }
        @keyframes fdsFade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes fdsPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .fds-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .fds-scroll::-webkit-scrollbar-track { background: transparent; }
        .fds-scroll::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }

        @media (max-width: 1024px) {
          .fds-shell { grid-template-columns: 64px minmax(0, 1fr); }
          .fds-sidebar { padding: 20px 10px; align-items: center; }
          .fds-sidebar .fds-hide-compact { display: none !important; }
          .fds-nav-item { justify-content: center; padding: 10px; }
          .fds-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .fds-shell { grid-template-columns: minmax(0, 1fr); }
          .fds-sidebar { display: none; }
          .fds-main { padding: 16px !important; }
          .fds-split, .fds-half { grid-template-columns: minmax(0, 1fr); }
          .fds-header { flex-wrap: wrap; align-items: flex-start !important; }
        }
        @media (max-width: 480px) {
          .fds-kpis { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </div>
  );
}

// ---------- small UI ----------

function Dot({ color, pulse = false, size = 8 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'inline-block', flexShrink: 0,
      animation: pulse ? 'fdsPulse 1.5s infinite' : 'none',
    }} />
  );
}

function Pill({ color, children }) {
  return (
    <span className="fds-num" style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '3px 9px', borderRadius: '999px',
      background: alpha(color, 0.15), color,
      fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function LabelPill({ value }) {
  return value === 1
    ? <Pill color={COLORS.red}>사기</Pill>
    : <Pill color={COLORS.green}>정상</Pill>;
}

function CardHeader({ title, right }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: '12px', marginBottom: '16px', flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: '13px', fontWeight: 500, color: COLORS.text }}>{title}</p>
      {right}
    </div>
  );
}

function EmptyState({ text, height = 160 }) {
  return (
    <div style={{
      height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: COLORS.sub, fontSize: '12px', textAlign: 'center',
      border: `1px dashed ${COLORS.border}`, borderRadius: '10px',
    }}>
      {text}
    </div>
  );
}

function Icon({ name }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    feed: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    model: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

// ---------- sections ----------

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'feed', label: 'Live Feed', icon: 'feed' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'model', label: 'Model', icon: 'model' },
];

function Sidebar({ running, model, hasData }) {
  const [active, setActive] = useState('overview');

  const go = (id) => {
    setActive(id);
    if (id === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const statusColor = running ? COLORS.green : COLORS.red;

  return (
    <aside className="fds-sidebar">
      <div style={{ padding: '0 4px' }}>
        <p style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.04em' }}>FDS</p>
        <p className="fds-hide-compact" style={{ ...labelStyle, fontSize: '11px', marginTop: '2px' }}>
          Fraud Detection System
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            title={item.label}
            onClick={() => go(item.id)}
            className={`fds-nav-item${active === item.id ? ' active' : ''}`}
          >
            <Icon name={item.icon} />
            <span className="fds-hide-compact">{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', width: '100%' }}>
        <div className="fds-hide-compact" style={{ ...cardStyle, padding: '14px', marginBottom: '12px' }}>
          <p style={{ ...labelStyle, marginBottom: '10px' }}>모델 상태</p>
          <dl style={{ display: 'grid', gap: '8px', fontSize: '12px' }}>
            <SidebarRow label="Mode" value={model.mode} />
            <SidebarRow label="Threshold" value={hasData ? model.threshold.toFixed(2) : '—'} />
            <SidebarRow label="Dataset" value="Credit Card · test" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <dt style={{ color: COLORS.sub }}>Simulation</dt>
              <dd style={{ display: 'flex', alignItems: 'center', gap: '6px', color: statusColor }}>
                <Dot color={statusColor} pulse={running} size={6} />
                {running ? 'Running' : 'Stopped'}
              </dd>
            </div>
          </dl>
        </div>
        <button type="button" className="fds-nav-item" disabled title="Settings">
          <Icon name="settings" />
          <span className="fds-hide-compact">Settings</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
      <dt style={{ color: COLORS.sub }}>{label}</dt>
      <dd className="fds-num" style={{ color: COLORS.text, textAlign: 'right' }}>{value}</dd>
    </div>
  );
}

function KpiCard({ label, value, pill, pillColor }) {
  return (
    <div style={cardStyle}>
      <p style={labelStyle}>{label}</p>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: '8px', marginTop: '10px', flexWrap: 'wrap',
      }}>
        <p className="fds-num" style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1.1 }}>
          {value}
        </p>
        {pill && <Pill color={pillColor}>{pill}</Pill>}
      </div>
    </div>
  );
}

function FraudDot({ cx, cy, payload }) {
  if (payload?.actual_label !== 1 || cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill={COLORS.red} stroke={COLORS.card} strokeWidth={1.5} />;
}

function ProbabilityChart({ results, threshold }) {
  const data = results.slice(0, CHART_LIMIT).reverse();

  return (
    <div style={cardStyle}>
      <CardHeader
        title="사기 확률 추이"
        right={
          <div style={{ display: 'flex', gap: '12px', ...labelStyle, fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Dot color={COLORS.red} size={6} /> 실제 사기
            </span>
            <span>최근 {CHART_LIMIT}건 · threshold {threshold.toFixed(2)}</span>
          </div>
        }
      />
      {data.length === 0 ? (
        <EmptyState text="수신된 결과가 없습니다" height={290} />
      ) : (
        <ResponsiveContainer width="100%" height={290}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={COLORS.border} />
            <XAxis dataKey="row_index" {...axisProps} minTickGap={24} />
            <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} {...axisProps} axisLine={false} />
            <Tooltip
              {...tooltipStyle}
              labelFormatter={v => `Row ${v}`}
              formatter={v => [fmtProb(v), '사기 확률']}
            />
            <ReferenceLine
              y={threshold}
              stroke={COLORS.amber}
              strokeDasharray="4 4"
              strokeOpacity={0.8}
            />
            <Line
              type="linear"
              dataKey="fraud_probability"
              stroke={COLORS.text}
              strokeOpacity={0.85}
              strokeWidth={1.5}
              dot={FraudDot}
              activeDot={{ r: 4, fill: COLORS.text }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ConfusionMatrix({ stats, metrics }) {
  const cells = [
    { key: 'tp', label: 'TP', desc: '실제 사기 · 예측 사기', color: COLORS.green },
    { key: 'fn', label: 'FN', desc: '실제 사기 · 예측 정상', color: COLORS.red, highlight: true },
    { key: 'fp', label: 'FP', desc: '실제 정상 · 예측 사기', color: COLORS.amber },
    { key: 'tn', label: 'TN', desc: '실제 정상 · 예측 정상', color: COLORS.sub },
  ];

  return (
    <div style={cardStyle}>
      <CardHeader title="혼동행렬" right={<span style={labelStyle}>누적 {stats.total.toLocaleString()}건</span>} />
      <div style={{
        display: 'grid', gridTemplateColumns: '52px 1fr 1fr', gap: '8px',
        alignItems: 'stretch', fontSize: '11px',
      }}>
        <span />
        <span style={{ ...labelStyle, fontSize: '11px', textAlign: 'center' }}>예측 사기</span>
        <span style={{ ...labelStyle, fontSize: '11px', textAlign: 'center' }}>예측 정상</span>

        <span style={rowLabelStyle}>실제 사기</span>
        <MatrixCell cell={cells[0]} value={stats.tp} />
        <MatrixCell cell={cells[1]} value={stats.fn} />

        <span style={rowLabelStyle}>실제 정상</span>
        <MatrixCell cell={cells[2]} value={stats.fp} />
        <MatrixCell cell={cells[3]} value={stats.tn} />
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${COLORS.border}`,
      }}>
        <div>
          <p style={labelStyle}>F1 Score</p>
          <p className="fds-num" style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>
            {metrics.f1 == null ? '—' : metrics.f1.toFixed(3)}
          </p>
        </div>
        <div>
          <p style={labelStyle}>Accuracy</p>
          <p className="fds-num" style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>
            {fmtPct(metrics.accuracy, 2)}
          </p>
        </div>
      </div>
    </div>
  );
}

const rowLabelStyle = { ...labelStyle, fontSize: '11px', display: 'flex', alignItems: 'center' };

function MatrixCell({ cell, value }) {
  const strong = cell.highlight && value > 0;
  return (
    <div title={cell.desc} style={{
      borderRadius: '10px', padding: '12px',
      background: strong ? alpha(COLORS.red, 0.15) : '#1d1e23',
      border: `1px solid ${strong ? alpha(COLORS.red, 0.5) : COLORS.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.sub }}>
        <Dot color={cell.color} size={6} />
        {cell.label}
      </div>
      <p className="fds-num" style={{
        fontSize: '22px', fontWeight: 600, marginTop: '6px',
        color: strong ? COLORS.red : COLORS.text,
      }}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Histogram({ data, total }) {
  return (
    <div style={cardStyle}>
      <CardHeader
        title="사기 확률 분포"
        right={<span style={labelStyle}>누적 {total.toLocaleString()}건 · 10구간</span>}
      />
      {total === 0 ? (
        <EmptyState text="수신된 결과가 없습니다" height={220} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={COLORS.border} />
            <XAxis dataKey="bucket" {...axisProps} interval={0} tick={{ fill: COLORS.sub, fontSize: 10 }} />
            <YAxis allowDecimals={false} {...axisProps} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: COLORS.sub, paddingTop: '8px' }}
            />
            <Bar dataKey="normal" name="정상" stackId="a" fill={COLORS.green} fillOpacity={0.75} isAnimationActive={false} />
            <Bar dataKey="fraud" name="실제 사기" stackId="a" fill={COLORS.red} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function MissedFraudList({ items }) {
  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="놓친 사기 (FN)"
        right={<Pill color={items.length > 0 ? COLORS.red : COLORS.green}>{items.length}건</Pill>}
      />
      {items.length === 0 ? (
        <EmptyState text="놓친 사기 거래가 없습니다" height={220} />
      ) : (
        <ul className="fds-scroll" style={{ listStyle: 'none', maxHeight: '244px', overflowY: 'auto' }}>
          {items.map(r => (
            <li key={r.row_index} className="fds-fade" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: '12px',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.text }}>
                <Dot color={COLORS.red} size={6} />
                <span className="fds-num">Row {r.row_index}</span>
              </span>
              <span className="fds-num" style={{ color: COLORS.sub }}>{fmtProb(r.fraud_probability)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LiveFeed({ results }) {
  const items = results.slice(0, FEED_LIMIT);

  return (
    <div id="feed" style={cardStyle}>
      <CardHeader title="실시간 피드" right={<span style={labelStyle}>최근 {FEED_LIMIT}건</span>} />
      {items.length === 0 ? (
        <EmptyState text="수신된 결과가 없습니다" height={320} />
      ) : (
        <ul className="fds-scroll" style={{ listStyle: 'none', maxHeight: '340px', overflowY: 'auto' }}>
          {items.map(r => <FeedItem key={r.row_index} result={r} />)}
        </ul>
      )}
    </div>
  );
}

function FeedItem({ result }) {
  const kind = classify(result);
  const status = {
    tp: { color: COLORS.green, text: '탐지' },
    tn: { color: COLORS.green, text: '정상' },
    fp: { color: COLORS.amber, text: '오탐' },
    fn: { color: COLORS.red, text: '미탐' },
  }[kind];
  const predictedFraud = result.predicted_label === 1;

  return (
    <li className="fds-fade" style={{
      display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px',
      alignItems: 'center', padding: '9px 0',
      borderBottom: `1px solid ${COLORS.border}`, fontSize: '12px',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Dot color={predictedFraud ? COLORS.red : COLORS.green} size={6} />
        <span className="fds-num" style={{ color: COLORS.sub }}>Row {result.row_index}</span>
      </span>
      <span style={{ color: predictedFraud ? COLORS.red : COLORS.text }}>
        {predictedFraud ? '사기 예측' : '정상 예측'}
      </span>
      <span className="fds-num" style={{ color: COLORS.text, minWidth: '56px', textAlign: 'right' }}>
        {fmtProb(result.fraud_probability)}
      </span>
      <Pill color={status.color}>{status.text}</Pill>
    </li>
  );
}

const HISTORY_FILTERS = [
  { id: 'all', label: '전체', test: () => true },
  { id: 'fraud', label: '사기 예측', test: r => r.predicted_label === 1 },
  { id: 'fp', label: '오탐(FP)', test: r => classify(r) === 'fp' },
  { id: 'fn', label: '미탐(FN)', test: r => classify(r) === 'fn' },
];

function HistoryTable({ results }) {
  const [filter, setFilter] = useState('all');
  const active = HISTORY_FILTERS.find(f => f.id === filter);
  const rows = results.filter(active.test);

  return (
    <div id="history" style={cardStyle}>
      <CardHeader
        title="예측 이력"
        right={
          <div role="tablist" style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {HISTORY_FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`fds-tab${filter === f.id ? ' active' : ''}`}
              >
                {f.label} <span className="fds-num" style={{ color: COLORS.sub }}>{results.filter(f.test).length}</span>
              </button>
            ))}
          </div>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          text={results.length === 0 ? '수신된 결과가 없습니다' : '해당 조건의 거래가 없습니다'}
          height={320}
        />
      ) : (
        <div className="fds-scroll" style={{ maxHeight: '340px', overflow: 'auto' }}>
          <table className="fds-table">
            <thead>
              <tr>
                {['Row', '실제', '예측', '확률', '결과', '모델'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.row_index}>
                  <td className="fds-num" style={{ color: COLORS.sub }}>{r.row_index}</td>
                  <td><LabelPill value={r.actual_label} /></td>
                  <td><LabelPill value={r.predicted_label} /></td>
                  <td className="fds-num">{fmtProb(r.fraud_probability)}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: r.is_correct ? COLORS.text : COLORS.red }}>
                      <Dot color={r.is_correct ? COLORS.green : COLORS.red} size={6} />
                      {r.is_correct ? '정답' : '오답'}
                    </span>
                  </td>
                  <td style={{ color: COLORS.sub }}>{r.model_mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ ...labelStyle, fontSize: '11px', marginTop: '10px' }}>최근 {RESULTS_LIMIT}건 기준</p>
    </div>
  );
}
