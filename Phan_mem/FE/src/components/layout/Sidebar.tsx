import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  History,
  User,
  Leaf,
  ChevronLeft,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

const navItems = [
  { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { path: '/sensors', label: 'Dữ liệu cảm biến', icon: Database },
  { path: '/actions', label: 'Lịch sử thao tác', icon: History },
  { path: '/profile', label: 'Hồ sơ cá nhân', icon: User },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogout = () => {
    if (isMobile) onMobileClose();
    logout();
    showToast('Đã đăng xuất tài khoản.', 'info');
    navigate('/login', { replace: true });
  };

  const sidebarClasses = `
    fixed top-0 left-0 h-full z-40 flex flex-col
    bg-white border-r border-surface-200
    transition-all duration-300 ease-in-out
    ${isMobile
      ? `w-[260px] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
      : `${collapsed ? 'w-[72px]' : 'w-[240px]'}`
    }
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-100 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-bold text-[15px] text-surface-800 whitespace-nowrap animate-fade-in">
              SmartHome IoT
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (isMobile) onMobileClose(); }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary-500 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-surface-400 group-hover:text-surface-600'}`} />
                {(!collapsed || isMobile) && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions (Log Out & Collapse) */}
        <div className="p-3 border-t border-surface-100 space-y-1 flex-shrink-0">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
              text-red-600 hover:bg-red-50 transition-all duration-200 group
              ${collapsed && !isMobile ? 'justify-center' : ''}
            `}
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-red-500 group-hover:scale-110 transition-transform" />
            {(!collapsed || isMobile) && (
              <span className="whitespace-nowrap font-medium">Đăng xuất</span>
            )}
          </button>

          {/* Collapse Button (desktop only) */}
          {!isMobile && (
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-colors text-[13px]"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
              {!collapsed && <span>Thu gọn</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile hamburger */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => onMobileClose()}
          className="fixed top-4 left-4 z-20 w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5 text-surface-600" />
        </button>
      )}
    </>
  );
}
