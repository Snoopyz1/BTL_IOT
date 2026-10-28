import type { SensorData } from '../../types/sensor.ts';
import { EmptyState } from '../common/Loading.tsx';
import { Database } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils.ts';
import CopyTimeCell from '../common/CopyTimeCell.tsx';

interface SensorTableProps {
  data: SensorData[];
  loading: boolean;
}

export default function SensorTable({ data, loading }: SensorTableProps) {


  const typeColors: Record<string, string> = {
    temperature: 'bg-orange-50 text-orange-600',
    humidity: 'bg-blue-50 text-blue-600',
    light: 'bg-yellow-50 text-yellow-700',
  };

  const typeLabels: Record<string, string> = {
    temperature: 'nhiệt độ',
    humidity: 'độ ẩm',
    light: 'ánh sáng',
  };

  if (loading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="animate-pulse space-y-0">
          <div className="h-10 bg-surface-100" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 border-t border-surface-50 bg-surface-50/50" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-card">
        <EmptyState message="Không tìm thấy dữ liệu cảm biến" icon={Database} />
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col">
      <div className="flex-1 overflow-auto min-h-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã ID</th>
              <th>Tên cảm biến</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Đơn vị</th>
              <th>Thời gian ghi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs text-surface-500">{row.id}</td>
                <td className="font-medium text-surface-800">{row.sensorName}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeColors[row.sensorType] || ''}`}>
                    {typeLabels[row.sensorType] || row.sensorType}
                  </span>
                </td>
                <td className="font-semibold text-surface-800">{row.value}</td>
                <td className="text-surface-500">{row.unit}</td>
                <td className="text-surface-500 text-xs font-mono">
                  <CopyTimeCell value={formatDateTime(row.recordedAt)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
