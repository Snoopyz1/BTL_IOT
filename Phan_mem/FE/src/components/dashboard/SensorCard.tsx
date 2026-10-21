import { Thermometer, Droplets, Sun, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'light';
  value: number;
  change: number;
  updatedAt: string;
}

const config = {
  temperature: {
    label: 'Nhiệt độ',
    unit: '°C',
    icon: Thermometer,
    bg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  humidity: {
    label: 'Độ ẩm',
    unit: '%',
    icon: Droplets,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  light: {
    label: 'Ánh sáng',
    unit: 'lux',
    icon: Sun,
    bg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
  },
};

export default function SensorCard({ type, value, change, updatedAt }: SensorCardProps) {
  const c = config[type];
  const Icon = c.icon;
  const isUp = change > 0;
  const isDown = change < 0;

  const timeStr = new Date(updatedAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="glass-card p-5 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.iconColor}`} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-red-500' : isDown ? 'text-primary-600' : 'text-surface-400'
          }`}>
          {isUp ? <ArrowUp className="w-3.5 h-3.5" /> : isDown ? <ArrowDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          <span>{Math.abs(change).toFixed(1)}</span>
        </div>
      </div>

      <div>
        <p className="text-sm text-surface-500 font-medium">{c.label}</p>
        <p className="text-2xl font-bold text-surface-800 mt-0.5">
          {type === 'light' ? Math.round(value) : value.toFixed(1)}
          <span className="text-sm font-normal text-surface-400 ml-1">{c.unit}</span>
        </p>
      </div>

      <div className="text-[11px] text-surface-400">
        Cập nhật lúc {timeStr}
      </div>
    </div>
  );
}
