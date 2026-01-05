'use client';

import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler
);

export default function PortfolioValueChart({
  data,
  dataKey = 'portfolio_value',
  label = 'Portfolio Value',
  formatAsCurrency = true,
  currency = 'AUD',
}) {
  const isPnL = label === 'Portfolio PnL';

  if (!data) {
    return (
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>{label}</div>
            <div style={styles.subTitle}>No data available</div>
          </div>
          <div style={styles.pill}>{formatAsCurrency ? currency : 'Value'}</div>
        </div>
        <div style={styles.emptyState}>No data.</div>
      </div>
    );
  }

  const series = Array.isArray(data?.[dataKey]) ? data[dataKey] : [];
  const last = series.length ? series[series.length - 1] : null;

  const currencyFormatter = (value) =>
    value?.toLocaleString('en-AU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }) ?? '';

  const compactNumber = (n) => {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return '';
    const abs = Math.abs(Number(n));
    const sign = Number(n) < 0 ? '-' : '';
    const fmt = (v, s) => `${sign}${v.toFixed(v >= 100 ? 0 : 1)}${s}`;
    if (abs >= 1_000_000_000) return fmt(abs / 1_000_000_000, 'B');
    if (abs >= 1_000_000) return fmt(abs / 1_000_000, 'M');
    if (abs >= 1_000) return fmt(abs / 1_000, 'K');
    return `${sign}${Math.round(abs)}`;
  };

  // --- Scriptable colors for PnL bars
  const pnlColor = (ctx) => {
    const v = ctx?.raw ?? 0;
    return v >= 0 ? 'rgba(34, 197, 94, 0.70)' : 'rgba(244, 63, 94, 0.70)'; // green/red
  };

  // --- Nice line gradient fill for value chart
  const valueFill = (ctx) => {
    const chart = ctx.chart;
    const { ctx: canvas, chartArea } = chart;
    if (!chartArea) return 'rgba(99, 102, 241, 0.14)'; // first render fallback
    const g = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
    g.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
    return g;
  };

  const dataset = isPnL
    ? {
        type: 'bar',
        label,
        data: series,
        backgroundColor: pnlColor,
        borderColor: pnlColor,
        borderWidth: 0,
        borderRadius: 5,
        //barThickness: 50-series.length,
        //maxBarThickness: 20,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      }
    : {
        type: 'line',
        label,
        data: series,
        borderWidth: 2,
        borderColor: '#00C49F', // indigo
        backgroundColor: valueFill,
        fill: {
              target: 'origin',
              below: 'rgba(255, 99, 132, 0.25)', // light red below 0
              above: 'rgba(144, 238, 144,0.25)'
              },
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 12,
      };

  const chartData = {
    labels: data.dates,
    datasets: [dataset],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650 },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.92)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed?.y ?? ctx.raw;
            if (!formatAsCurrency) return `${v}`;
            return currencyFormatter(v);
          },
        },
      },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          //maxTicksLimit: 8,
          color: '#6B7280',
          font: { size: 11 },
        },
      },
      y: {
        grid: { color: 'rgba(17, 24, 39, 0.08)' },
        border: { display: false },
        ticks: {
          color: '#6B7280',
          font: { size: 11 },
          maxTicksLimit: 5,
          callback: (value) => {
            if (!formatAsCurrency) return `${value}`;
            const num = Number(value);
            const prefix = currency === 'AUD' ? '$' : '';
            return `${prefix}${compactNumber(num)}`;
          },
        },
      },
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>{label}</div>
          <div style={styles.subTitle}>
            Latest:{' '}
            <span style={styles.latestValue}>
              {formatAsCurrency ? currencyFormatter(last) : `${last ?? ''}`}
            </span>
          </div>
        </div>
        <div style={styles.pill}>{formatAsCurrency ? currency : 'Value'}</div>
      </div>

      <div style={styles.chartWrap}>
        {isPnL ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: '100%',
    borderRadius: 16,
    border: '1px solid rgba(17, 24, 39, 0.08)',
    background:
      'linear-gradient(180deg, rgba(249, 250, 251, 1) 0%, rgba(255, 255, 255, 1) 100%)',
    boxShadow: '0 10px 30px rgba(17, 24, 39, 0.06)',
    padding: 16,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 800,
    color: '#111827',
    letterSpacing: '-0.2px',
  },
  subTitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  latestValue: {
    fontWeight: 800,
    color: '#111827',
  },
  pill: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
    background: 'rgba(17, 24, 39, 0.06)',
    border: '1px solid rgba(17, 24, 39, 0.08)',
    padding: '6px 10px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  chartWrap: {
    height: 260,
    width: '100%',
  },
  emptyState: {
    marginTop: 14,
    fontSize: 13,
    color: '#6B7280',
  },
};
