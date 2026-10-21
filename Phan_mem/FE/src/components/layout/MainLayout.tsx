import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import { mqttService } from '../../services/mqttService.ts';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Connect MQTT on mount
  useEffect(() => {
    mqttService.connect();
    return () => { mqttService.disconnect(); };
  }, []);

  const marginLeft = isMobile ? '0px' : sidebarCollapsed ? '72px' : '240px';

  return (
    <div className="h-screen flex overflow-hidden bg-surface-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft }}
      >
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />

        <main className="flex-1 overflow-auto p-5 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
