import { useState } from 'react';
import { Lightbulb, Fan, Snowflake, Lock, Power } from 'lucide-react';
import type { Device, DeviceCommand } from '../../types/device.ts';
import { sendDeviceCommand } from '../../services/deviceService.ts';
import { useToast } from '../common/Toast.tsx';
import { Spinner } from '../common/Loading.tsx';

const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  light: Lightbulb,
  fan: Fan,
  ac: Snowflake,
  lock: Lock,
  curtain: Power,
  speaker: Power,
};

interface DeviceCardProps {
  device: Device;
  onUpdate: () => void;
}

function DeviceCard({ device, onUpdate }: DeviceCardProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const Icon = deviceIcons[device.type] || Power;
  const isOn = device.status === 'ON';
  const isOnline = device.online;

  const handleToggle = async () => {
    if (loading) return;
    if (!isOnline) {
      showToast('Không thể điều khiển: Thiết bị đang ngoại tuyến do ESP32 mất kết nối!', 'error');
      return;
    }
    setLoading(true);

    const command: DeviceCommand = {
      action: isOn ? 'TURN_OFF' : 'TURN_ON',
    };

    try {
      const result = await sendDeviceCommand(device.id, command);
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message || 'Thao tác thất bại!', 'error');
      }
      onUpdate();
    } catch (err) {
      showToast(`Lỗi: ${err instanceof Error ? err.message : 'Không xác định'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`
      glass-card p-4 flex items-center gap-4 transition-all duration-200
      ${!isOnline ? 'opacity-65 bg-surface-50/60' : ''}
    `}>
      <div className={`
        w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
        ${!isOnline
          ? 'bg-surface-100 text-surface-400'
          : isOn
            ? 'bg-primary-100 text-primary-600'
            : 'bg-surface-100 text-surface-400'
        }
      `}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-surface-800 truncate">{device.name}</p>
          {!isOnline && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-200 text-surface-500">
              Ngoại tuyến
            </span>
          )}
        </div>
        <p className="text-xs text-surface-400 mt-0.5">{device.location}</p>
      </div>

      <div className="flex items-center gap-3">
        {loading && <Spinner size="sm" className="text-yellow-500" />}
        <div
          onClick={handleToggle}
          className={`toggle-switch ${isOn ? 'active' : ''} ${!isOnline ? 'disabled' : ''} ${loading ? 'loading' : ''}`}
          role="switch"
          aria-checked={isOn}
          aria-disabled={!isOnline}
          aria-label={`Bật/tắt ${device.name}`}
        />
      </div>
    </div>
  );
}

interface DeviceControlProps {
  devices: Device[];
  onUpdate: () => void;
}

export default function DeviceControl({ devices, onUpdate }: DeviceControlProps) {
  const onlineCount = devices.filter((d) => d.online).length;
  const isOnline = onlineCount > 0;

  return (
    <div className="glass-card p-5 animate-slide-up h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-surface-800">Điều Khiển Thiết Bị</h3>
          <p className="text-xs text-surface-400 mt-0.5">
            {onlineCount}/{devices.length} thiết bị đang kết nối
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-primary-500 animate-pulse-soft' : 'bg-red-500'}`} />
          <span className={`text-xs font-medium ${isOnline ? 'text-primary-600' : 'text-red-500'}`}>
            {isOnline ? 'Trực tiếp' : 'Ngoại tuyến'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[280px]">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}
