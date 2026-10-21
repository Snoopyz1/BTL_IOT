import type { ActionHistory } from '../../types/action.ts';
import { EmptyState } from '../common/Loading.tsx';
import { History } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils.ts';

interface ActionTableProps {
  data: ActionHistory[];
  loading: boolean;
}

export default function ActionTable({ data, loading }: ActionTableProps) {


  const statusConfig: Record<string, { class: string; label: string }> = {
    SUCCESS: { class: 'success', label: 'Thành công' },
    FAILED: { class: 'failed', label: 'Thất bại' },
    PENDING: { class: 'pending', label: 'Đang xử lý' },
    TIMEOUT: { class: 'timeout', label: 'Hết giờ' },
  };

  const actionBadge = (action: string) => {
    const isOn = action === 'TURN_ON';
    return (
      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${isOn ? 'bg-primary-50 text-primary-700' : 'bg-surface-100 text-surface-600'
        }`}>
        {isOn ? 'BẬT' : 'TẮT'}
      </span>
    );
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
        <EmptyState message="Không tìm thấy lịch sử thao tác" icon={History} />
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
              <th>Thiết bị</th>
              <th>Hành động</th>
              <th>Trạng thái</th>
              <th>Thời gian thực hiện</th>
              <th>Thời gian phản hồi</th>
              <th>Độ trễ</th>
            </tr>
          </thead>  
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs text-surface-500">{row.id}</td>
                <td>
                  <div>
                    <p className="font-medium text-surface-800 text-sm">{row.deviceName}</p>
                    <p className="text-xs text-surface-400">{row.deviceId}</p>
                  </div>
                </td>
                <td>{actionBadge(row.action)}</td>
                <td>
                  <span className={`status-badge ${statusConfig[row.status]?.class || ''}`}>
                    {statusConfig[row.status]?.label || row.status}
                  </span>
                </td>
                <td className="text-xs text-surface-500 font-mono">{formatDateTime(row.actionTime)}</td>
                <td className="text-xs text-surface-500 font-mono">
                  {row.responseTime ? formatDateTime(row.responseTime) : '—'}
                </td>
                <td className="text-xs font-mono text-surface-600">
                  {row.responseDuration != null ? `${row.responseDuration}ms` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
