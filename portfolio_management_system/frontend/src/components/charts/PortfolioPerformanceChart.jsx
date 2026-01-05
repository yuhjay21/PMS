'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler
);

export default function PortfolioPerformanceChart({ data, title = 'Performance' }) {
  if (!data) {
    return (
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>{title}</div>
            <div style={styles.subTitle}>Portfolio vs Index</div>
          </div>
        </div>
        <div style={styles.emptyState}>No performance data.</div>
      </div>
    );
  }

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Portfolio',
        data: data.portfolio,
        borderWidth: 2,
        borderColor: '#00C49F', // blue
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: {
                target: 'origin',
                below: 'rgba(255, 99, 132, 0.25)', // light red below 0
                above: 'rgba(144, 238, 144,0.25)'
              },
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 12,
      },
      {
        label: 'Index',
        data: data.index,
        borderWidth: 2,
        borderColor: '#0088FE', // green
        backgroundColor: 'rgba(22, 163, 74, 0.0)',
        fill: false,
        //borderDash: [6, 6],
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 12,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650 },
    plugins: {
      legend: {
        position: 'top',
        align: 'centre',
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          color: '#111827',
          font: { size: 12, weight: '600' },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.92)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            const sign = v > 0 ? '+' : '';
            return ` ${ctx.dataset.label}: ${sign}${Number(v).toFixed(2)}%`;
          },
        },
      },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { drawOnChartArea: false,
          drawTicks:true,
        },
        border: { display: false },
        ticks: {
          //maxTicksLimit: 8,
          major: true,
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
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>{title}</div>
          <div style={styles.subTitle}>Portfolio vs Index</div>
        </div>
        <div style={styles.pill}>% return</div>
      </div>

      <div style={styles.chartWrap}>
        <Line data={chartData} options={options} />
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
    height: 360,
    width: '100%',
  },
  emptyState: {
    marginTop: 14,
    fontSize: 13,
    color: '#6B7280',
  },
};