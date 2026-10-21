import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { ChartDataPoint } from '../../types/sensor.ts';

interface SensorChartProps {
  data: ChartDataPoint[];
}

const datasets = [
  { key: 'temperature', name: 'Nhiệt độ (°C)', color: '#f97316' },
  { key: 'humidity', name: 'Độ ẩm (%)', color: '#3b82f6' },
  { key: 'light', name: 'Ánh sáng (lux)', color: '#eab308' },
] as const;

export default function SensorChart({ data }: SensorChartProps) {
  const [visible, setVisible] = useState<Record<string, boolean>>({
    temperature: true,
    humidity: true,
    light: true,
  });

  const toggleDataset = (key: string) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Thang đo bên trái cho Nhiệt độ (°C) và Độ ẩm (%)
  const tempHumValues = data
    .flatMap((d) => [
      visible.temperature ? Number(d.temperature) : null,
      visible.humidity ? Number(d.humidity) : null,
    ])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

  const leftMin = tempHumValues.length > 0 ? Math.floor(Math.min(...tempHumValues) / 10) * 10 : 0;
  const leftMax = tempHumValues.length > 0 ? Math.ceil(Math.max(...tempHumValues) / 10) * 10 : 100;
  const leftDomain: [number, number] = [
    Math.max(0, leftMin - 5),
    Math.max(100, leftMax + 5),
  ];

  // Thang đo bên phải cho Ánh sáng (lux) - lọc bỏ các giá trị nhiễu đột biến > 2000 lux
  const lightValues = data
    .flatMap((d) => [visible.light ? Number(d.light) : null])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v < 2000);

  const maxLight = lightValues.length > 0 ? Math.max(...lightValues) : 0;
  const rightDomain: [number, number] = [
    0,
    Math.max(500, Math.ceil((maxLight + 50) / 100) * 100),
  ];

  return (
    <div className="glass-card p-5 animate-slide-up h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-surface-800">Biểu Đồ Xu Hướng Cảm Biến</h3>
          <p className="text-xs text-surface-400 mt-0.5">Giám sát dữ liệu thời gian thực</p>
        </div>
        <div className="flex items-center gap-2">
          {datasets.map((ds) => (
            <button
              key={ds.key}
              onClick={() => toggleDataset(ds.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${visible[ds.key]
                ? 'bg-surface-100 text-surface-700'
                : 'bg-surface-50 text-surface-300 line-through'
                }`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: visible[ds.key] ? ds.color : '#d1d5db' }} />
              {ds.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[280px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-surface-400 text-sm">
            Đang chờ dữ liệu cảm biến...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 35, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              {/* Cột trục Y bên trái: Nhiệt độ (°C) & Độ ẩm (%) */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                domain={leftDomain}
              />
              {/* Cột trục Y bên phải: Ánh sáng (lux, max khoảng 1000) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                domain={rightDomain}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.96)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              {/* Line ẩn đảm bảo trục phải luôn cố định dải 0-1000 ngay cả khi toggle tắt line light */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="light"
                stroke="transparent"
                strokeWidth={0}
                dot={false}
                activeDot={false}
                legendType="none"
                tooltipType="none"
                isAnimationActive={false}
              />
              {datasets.map((ds) =>
                visible[ds.key] ? (
                  <Line
                    key={ds.key}
                    yAxisId={ds.key === 'light' ? 'right' : 'left'}
                    type="monotone"
                    dataKey={ds.key}
                    name={ds.name}
                    stroke={ds.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
