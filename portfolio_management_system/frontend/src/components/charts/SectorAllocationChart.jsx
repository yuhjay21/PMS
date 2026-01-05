'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Center text plugin (lightweight + modern look)
const centerTextPlugin = {
  id: 'centerTextPlugin',
  afterDraw(chart, _args, pluginOptions) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const { left, right, top, bottom } = chartArea;
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;

    const title = pluginOptions?.title ?? 'Sectors';
    const value = pluginOptions?.value ?? '';

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // title
    ctx.fillStyle = 'rgba(107, 114, 128, 1)'; // gray-500
    ctx.font = '600 12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(title, x, y - 10);

    // value
    ctx.fillStyle = 'rgba(17, 24, 39, 1)'; // gray-900
    ctx.font = '800 16px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(value, x, y + 12);

    ctx.restore();
  },
};

export default function SectorAllocationChart({ sectors, labels, values, title = 'Allocation' }) {
  const chartLabels = labels ?? Object.keys(sectors || {});
  const chartValues = values ?? Object.values(sectors || {}).map((v) => Number(v) || 0);

  const total = chartValues.reduce((a, b) => a + b, 0);

  if (!chartLabels.length || total <= 0) {
    return (
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>{title}</div>
            <div style={styles.subTitle}>Sector breakdown</div>
          </div>
          <div style={styles.pill}>% weight</div>
        </div>
        <div style={styles.emptyState}>No sector data.</div>
      </div>
    );
  }

  // Modern palette (soft, readable). If you want dynamic colors per sector name, tell me.
  const palette = [
    'rgba(99, 102, 241, 0.55)',  // indigo
    'rgba(34, 197, 94, 0.55)',   // green
    'rgba(244, 63, 94, 0.55)',   // rose
    'rgba(14, 165, 233, 0.55)',  // sky
    'rgba(245, 158, 11, 0.55)',  // amber
    'rgba(168, 85, 247, 0.55)',  // purple
    'rgba(20, 184, 166, 0.55)',  // teal
    'rgba(148, 163, 184, 0.55)', // slate
  ];

  const backgroundColor = chartLabels.map((_, i) => palette[i % palette.length]);

  const data = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor,
        borderColor: 'rgba(255,255,255,0.95)',
        borderWidth: 2,
        hoverOffset: 6,
        spacing: 2,
        borderRadius: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          color: '#111827',
          font: { size: 12, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.92)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: (ctx) => {
            const val = Number(ctx.raw) || 0;
            const pct = total ? ((val / total) * 100).toFixed(1) : '0.0';
            return ` ${ctx.label}: ${pct}%`;
          },
        },
      },
      centerTextPlugin: {
        title: 'Total',
        value: chartLabels.length,
      },
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.chartWrap}>
        <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
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
    height: 320,
    width: '100%',
  },
  emptyState: {
    marginTop: 14,
    fontSize: 13,
    color: '#6B7280',
  },
};
