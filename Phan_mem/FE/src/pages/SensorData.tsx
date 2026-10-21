import { useState, useEffect, useCallback } from 'react';
import SensorFilter, { type FilterState } from '../components/sensor/SensorFilter.tsx';
import SensorTable from '../components/sensor/SensorTable.tsx';
import SensorPagination from '../components/sensor/SensorPagination.tsx';
import { getSensorData } from '../services/sensorService.ts';
import type { SensorData, SensorDataQuery } from '../types/sensor.ts';

export default function SensorDataPage() {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<FilterState>({ filterType: '', searchValue: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isTime = filter.filterType === 'time';
      const isSensor = filter.filterType !== '' && filter.filterType !== 'time';

      const query: SensorDataQuery = {
        page,
        limit,
        sensorId: isSensor ? filter.filterType : undefined,
        time: isTime ? filter.searchValue : undefined,
        search: filter.searchValue || undefined,
      };
      const result = await getSensorData(query);
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch sensor data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = useCallback((newFilter: FilterState) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilter({ filterType: '', searchValue: '' });
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <SensorFilter onFilter={handleFilter} onReset={handleReset} />
      <div className="flex-1 min-h-0">
        <SensorTable data={data} loading={loading} />
      </div>
      {totalPages > 0 && (
        <SensorPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}
    </div>
  );
}
