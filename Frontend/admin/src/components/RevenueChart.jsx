import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function RevenueChart() {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue ($)',
        data: [18500, 22400, 19800, 28900, 31200, 29500, 34800, 38200, 36500, 42100, 45800, 48250],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.06)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#2563eb',
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: function (value) {
            return '$' + value / 1000 + 'k';
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs text-left">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Revenue Performance</h2>
          <p className="text-xs text-slate-500">Monthly revenue trends for ApexServices</p>
        </div>
        <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none">
          <option>Last 12 Months</option>
          <option>Last 6 Months</option>
          <option>This Year</option>
        </select>
      </div>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
