import { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { ActionStatus, ActionType } from '../../types/action.ts';
import { getActionDevices } from '../../services/actionService.ts';

interface ActionFilterState {
  deviceId: string;
  action: ActionType | '';
  status: ActionStatus | '';
  time: string;
}

interface ActionFilterProps {
  onFilter: (filter: ActionFilterState) => void;
  onReset: () => void;
}


export default function ActionFilter({ onFilter, onReset }: ActionFilterProps) {
  const [devices, setDevices] = useState<Array<{ id: string; name: string }>>([]);
  const [filter, setFilter] = useState<ActionFilterState>({
    deviceId: '',
    action: '',
    status: '',
    time: '',
  });

  useEffect(() => {
    getActionDevices().then(setDevices).catch(console.error);
  }, []);

  const handleSelectChange = (partial: Partial<ActionFilterState>) => {
    const next = { ...filter, ...partial };
    setFilter(next);
    onFilter(next);
  };

  const handleSearch = useCallback(() => {
    onFilter(filter);
  }, [filter, onFilter]);

  const handleReset = useCallback(() => {
    setFilter({ deviceId: '', action: '', status: '', time: '' });
    onReset();
  }, [onReset]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };


  return (
    <div className="glass-card p-4 mb-4 animate-slide-up">
      <div className="flex flex-wrap items-end gap-3">
        {/* Combined Filters Group */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-surface-500">Bộ lọc</label>
          <div className="flex h-9 rounded-lg border border-surface-200 bg-white overflow-hidden divide-x divide-surface-200 shadow-sm">
            <select
              value={filter.deviceId}
              onChange={(e) => handleSelectChange({ deviceId: e.target.value })}
              className="px-3 text-sm text-surface-700 bg-transparent focus:outline-none focus:bg-primary-50 transition-colors cursor-pointer min-w-[140px]"
            >
              <option value="">Tất cả thiết bị</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select
              value={filter.action}
              onChange={(e) => handleSelectChange({ action: e.target.value as ActionType | '' })}
              className="px-3 text-sm text-surface-700 bg-transparent focus:outline-none focus:bg-primary-50 transition-colors cursor-pointer min-w-[130px]"
            >
              <option value="">Tất cả hành động</option>
              <option value="TURN_ON">BẬT (TURN ON)</option>
              <option value="TURN_OFF">TẮT (TURN OFF)</option>
            </select>
            <select
              value={filter.status}
              onChange={(e) => handleSelectChange({ status: e.target.value as ActionStatus | '' })}
              className="px-3 text-sm text-surface-700 bg-transparent focus:outline-none focus:bg-primary-50 transition-colors cursor-pointer min-w-[140px]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="FAILED">Thất bại</option>
              <option value="PENDING">Đang xử lý</option>
              <option value="TIMEOUT">Hết giờ</option>
            </select>
          </div>
        </div>

        {/* Single String Time Input */}
        <div className="flex flex-col gap-1 flex-1 min-w-[240px] max-w-[380px]">
          <label className="text-xs font-medium text-surface-500">Thời gian</label>
          <input
            type="text"
            value={filter.time}
            onChange={(e) => setFilter({ ...filter, time: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="h-9 px-3 rounded-lg border border-surface-200 bg-white text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent w-full"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearch}
            className="h-9 px-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </button>
          <button
            onClick={handleReset}
            className="h-9 px-3 rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-500 text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại
          </button>
        </div>
      </div>

    </div>
  );
}

export type { ActionFilterState };
