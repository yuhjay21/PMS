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

export default function PortfolioPerformanceChart({ data }) {
  if (!data) return <p style={{ fontSize: '0.85rem' }}>No performance data.</p>;

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Portfolio %',
        data: data.portfolio,
        borderWidth: 2,
        tension: 0.2,
      },
      {
        label: 'Index %',
        data: data.index,
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12 },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 8 },
      },
      y: {
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
