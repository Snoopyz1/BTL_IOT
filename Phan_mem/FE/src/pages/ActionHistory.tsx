import { useState, useEffect, useCallback } from 'react';
import ActionFilter, { type ActionFilterState } from '../components/action/ActionFilter.tsx';
import ActionTable from '../components/action/ActionTable.tsx';
import SensorPagination from '../components/sensor/SensorPagination.tsx';
import { getActions } from '../services/actionService.ts';
import type { ActionHistory as ActionHistoryType, ActionQuery } from '../types/action.ts';

export default function ActionHistory() {
  const [data, setData] = useState<ActionHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<ActionFilterState>({
    deviceId: '',
    action: '',
    status: '',
    time: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query: ActionQuery = {
        page,
        limit,
        deviceId: filter.deviceId || undefined,
        action: filter.action || undefined,
        status: filter.status || undefined,
        time: filter.time || undefined,
      };
      const result = await getActions(query);
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to fetch action history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = useCallback((newFilter: ActionFilterState) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilter({ deviceId: '', action: '', status: '', time: '' });
    setPage(1);
  }, []);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <ActionFilter onFilter={handleFilter} onReset={handleReset} />
      <div className="flex-1 min-h-0">
        <ActionTable data={data} loading={loading} />
      </div>
      {totalPages > 0 && (
        <SensorPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        />
      )}
    </div>
  );
}
