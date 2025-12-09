'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SectorAllocationChart({ sectors }) {
  const labels = Object.keys(sectors || {});
  const values = Object.values(sectors || {});

  if (!labels.length) return <p style={{ fontSize: '0.85rem' }}>No sector data.</p>;

  const data = {
    labels,
    datasets: [
      {
        data: values,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 10 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = values.reduce((a, b) => a + b, 0);
            const val = ctx.raw;
            const pct = total ? ((val / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: ${pct}%`;
          },
        },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}
