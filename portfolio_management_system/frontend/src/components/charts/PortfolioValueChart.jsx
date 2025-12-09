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
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
);

export default function PortfolioValueChart({ data }) {
  if (!data) return <p style={{ fontSize: '0.85rem' }}>No data.</p>;

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Portfolio Value',
        data: data.portfolio_value,
        borderWidth: 2,
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.raw?.toLocaleString('en-AU', {
              style: 'currency',
              currency: 'AUD',
            }) ?? '',
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        ticks: {
          callback: (value) =>
            value.toLocaleString('en-AU', {
              style: 'currency',
              currency: 'AUD',
            }),
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
