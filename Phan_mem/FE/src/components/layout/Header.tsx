import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, Menu, Wifi, WifiOff, LogOut, User as UserIcon } from 'lucide-react';
import { mqttService, type MqttConnectionStatus } from '../../services/mqttService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../common/Toast.tsx';

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  '/dashboard': { title: 'Bảng điều khiển', breadcrumb: 'Tổng quan' },
  '/sensors': { title: 'Dữ liệu cảm biến', breadcrumb: 'Giám sát' },
  '/actions': { title: 'Lịch sử thao tác', breadcrumb: 'Nhật ký' },
  '/profile': { title: 'Hồ sơ cá nhân', breadcrumb: 'Cài đặt' },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const page = pageTitles[location.pathname] || { title: 'SmartHome', breadcrumb: '' };
  const [mqttStatus, setMqttStatus] = useState<MqttConnectionStatus>(mqttService.getStatus());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = mqttService.onStatusChange(setMqttStatus);
    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất tài khoản.', 'info');
    navigate('/login', { replace: true });
  };

  const isConnected = mqttStatus === 'connected';
  const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-surface-100 flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Left: Mobile menu + Page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-50 text-surface-500"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-surface-800 leading-tight">{page.title}</h1>
          <p className="text-xs text-surface-400">
            SmartHome / <span className="text-primary-600">{page.breadcrumb}</span>
          </p>
        </div>
      </div>

      {/* Right: MQTT status, Notifications, Avatar & Dropdown */}
      <div className="flex items-center gap-3">
        {/* MQTT Status */}
        <div className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
          ${isConnected
            ? 'bg-primary-50 text-primary-700'
            : 'bg-red-50 text-red-600'
          }
        `}>
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isConnected ? 'Đã kết nối MQTT' : 'Đã ngắt kết nối'}</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary-500 animate-pulse-soft' : 'bg-red-400'}`} />
        </div>

        {/* Notification Bell */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-50 text-surface-400 hover:text-surface-600 transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm hover:ring-2 hover:ring-primary-300 transition-all">
              {initial}
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-surface-100 py-2 z-50 animate-slide-up">
              <div className="px-4 py-2.5 border-b border-surface-100">
                <p className="text-sm font-semibold text-surface-800 truncate">{user?.fullName || 'Người dùng'}</p>
                <p className="text-xs text-surface-400 truncate">@{user?.username || 'user'}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-surface-700 hover:bg-surface-50 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-surface-400" />
                Hồ sơ cá nhân
              </Link>

              <div className="border-t border-surface-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
