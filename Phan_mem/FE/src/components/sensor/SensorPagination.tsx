import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const pageSizes = [10, 20, 50, 100];

export default function SensorPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page > 3) pages.push('ellipsis');

    const rangeStart = Math.max(2, page - 1);
    const rangeEnd = Math.min(totalPages - 1, page + 1);

    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('ellipsis');

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      {/* Info */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-surface-500">
          Hiển thị {start}–{end} trong số {total} bản ghi
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-8 px-2 rounded-lg border border-surface-200 bg-white text-xs text-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>{size} dòng / trang</option>
          ))}
        </select>
      </div>

      {/* Pages */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPages().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-surface-400 text-xs">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
