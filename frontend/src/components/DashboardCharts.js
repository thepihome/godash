import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#2B3D7E', '#3d5299', '#5b7fd4', '#059669', '#d97706', '#64748b'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label || payload[0]?.name}</strong>
      <span>{payload[0]?.value ?? payload[0]?.payload?.hours ?? payload[0]?.payload?.matches}</span>
    </div>
  );
}

function DashboardChart({ chart }) {
  if (!chart?.data?.length) {
    return (
      <div className="chart-card chart-card--empty">
        <h3>{chart.title}</h3>
        <p>No data available yet</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chart.type) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chart.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="42%"
              outerRadius="72%"
              paddingAngle={2}
            >
              {chart.data.map((entry, i) => (
                <Cell key={entry.name} fill={entry.fill || CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend />
          </PieChart>
        );

      case 'line': {
        const key = chart.dataKey || 'value';
        return (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey={key}
              stroke="#2B3D7E"
              strokeWidth={2}
              dot={{ fill: '#2B3D7E', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        );
      }

      case 'bar':
      default:
        return (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chart.data.map((entry, i) => (
                <Cell key={entry.name} fill={entry.fill || CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div className="chart-card">
      <h3>{chart.title}</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardCharts({ charts, isLoading }) {
  if (isLoading) {
    return <div className="dashboard-section-loading">Loading analytics...</div>;
  }

  if (!charts?.length) {
    return (
      <div className="dashboard-empty-charts">
        <p>No analytics available for your role yet.</p>
      </div>
    );
  }

  return (
    <div className="charts-grid">
      {charts.map((chart) => (
        <DashboardChart key={chart.id} chart={chart} />
      ))}
    </div>
  );
}
