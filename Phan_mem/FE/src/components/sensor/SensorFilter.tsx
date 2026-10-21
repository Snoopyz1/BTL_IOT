import { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { getSensors } from '../../services/sensorService.ts';
import type { Sensor } from '../../types/sensor.ts';

interface FilterState {
  filterType: string;
  searchValue: string;
}

interface SensorFilterProps {
  onFilter: (filter: FilterState) => void;
  onReset: () => void;
}


export default function SensorFilter({ onFilter, onReset }: SensorFilterProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [filter, setFilter] = useState<FilterState>({ filterType: '', searchValue: '' });

  useEffect(() => {
    getSensors().then(setSensors);
  }, []);

  const handleSearch = useCallback(() => {
    onFilter(filter);
  }, [filter, onFilter]);

  const handleReset = useCallback(() => {
    setFilter({ filterType: '', searchValue: '' });
    onReset();
  }, [onReset]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getInputLabel = () => {
    if (filter.filterType === 'time') return 'Thời gian';
    if (filter.filterType !== '') return 'Giá trị cảm biến';
    return 'Giá trị / Thời gian';
  };

  return (
    <div className="glass-card p-4 mb-4 animate-slide-up">
      <div className="flex flex-wrap items-end gap-3">
        {/* Filter Type Select */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-surface-500">Bộ lọc</label>
          <select
            value={filter.filterType}
            onChange={(e) => setFilter({ ...filter, filterType: e.target.value })}
            className="h-9 px-3 rounded-lg border border-surface-200 bg-white text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent min-w-[160px] cursor-pointer"
          >
            <option value="">Tất cả</option>
            {sensors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            <option value="time">Thời gian</option>
          </select>
        </div>

        {/* Input based on selected filter */}
        <div className="flex flex-col gap-1 flex-1 min-w-[260px] max-w-[440px]">
          <label className="text-xs font-medium text-surface-500">{getInputLabel()}</label>
          <input
            type="text"
            value={filter.searchValue}
            onChange={(e) => setFilter({ ...filter, searchValue: e.target.value })}
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

export type { FilterState };
