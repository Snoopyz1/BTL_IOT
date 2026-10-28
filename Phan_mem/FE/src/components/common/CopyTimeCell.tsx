import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from './Toast.tsx';

interface CopyTimeCellProps {
  value: string;
  className?: string;
}

export default function CopyTimeCell({ value, className = '' }: CopyTimeCellProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!value || value === '—') {
    return <span className={`text-surface-400 ${className}`}>—</span>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast(`Đã sao chép: ${value}`, 'success');
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      showToast('Không thể sao chép vào bộ nhớ tạm', 'error');
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 group/copy ${className}`}>
      <span>{value}</span>
      <button
        type="button"
        onClick={handleCopy}
        title="Sao chép toàn bộ thời gian"
        aria-label={`Sao chép ${value}`}
        className="p-1 rounded text-surface-400 hover:text-primary-600 hover:bg-surface-100 transition-colors cursor-pointer"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 animate-fade-in" />
        ) : (
          <Copy className="w-3.5 h-3.5 transition-transform group-hover/copy:scale-110" />
        )}
      </button>
    </div>
  );
}
