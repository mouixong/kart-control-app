/**
 * 根组件
 * 包含路由配置和底部导航栏
 * 底部导航: 首页、仪表、统计、记录、设置、升级 (6按钮)
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  Gauge,
  BarChart3,
  Database,
  Settings,
  Cpu,
} from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { StatsPage } from './pages/StatsPage';
import { DataLogPage } from './pages/DataLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { OTAPage } from './pages/OTAPage';
import { useThemeStore } from './store/useThemeStore';

type Page = 'home' | 'dashboard' | 'stats' | 'datalog' | 'settings' | 'ota';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'dashboard', label: '仪表', icon: Gauge },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'datalog', label: '记录', icon: Database },
  { id: 'settings', label: '设置', icon: Settings },
  { id: 'ota', label: '升级', icon: Cpu },
];

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // 监听仪表盘手势返回事件
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ page: Page }>;
      if (customEvent.detail?.page) {
        setCurrentPage(customEvent.detail.page);
      }
    };
    window.addEventListener('navigateToPage', handleNavigate);
    return () => window.removeEventListener('navigateToPage', handleNavigate);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'stats':
        return <StatsPage />;
      case 'datalog':
        return <DataLogPage />;
      case 'settings':
        return <SettingsPage />;
      case 'ota':
        return <OTAPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#eef9fa]'}`}>
      {/* 页面内容 */}
      <div className="flex-1 overflow-y-auto">{renderPage()}</div>

      {/* 底部导航栏 */}
      <nav className={`border-t backdrop-blur-lg ${isDark ? 'bg-gray-900/90 border-gray-800/50' : 'bg-white/90 border-gray-100'}`}>
        <div className="grid grid-cols-6 gap-1 py-1 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`
                  flex flex-col items-center gap-0.5 py-2 rounded-xl
                  transition-all duration-300
                  ${isActive
                    ? (isDark ? 'text-cyan-400' : 'text-blue-500')
                    : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500')
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'drop-shadow-lg' : ''}`}
                />
                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${isDark ? 'bg-cyan-400' : 'bg-blue-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
