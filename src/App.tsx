/**
 * 根组件
 * 包含路由配置和底部导航栏
 * 底部导航: 地图、统计、记录、设置、升级 (5按钮)
 */

import React, { useState } from 'react';
import {
  Map,
  BarChart3,
  Database,
  Settings,
  Cpu,
} from 'lucide-react';
import { MapPage } from './pages/MapPage';
import { StatsPage } from './pages/StatsPage';
import { DataLogPage } from './pages/DataLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { OTAPage } from './pages/OTAPage';
import { useStore } from './store/useStore';

type Page = 'map' | 'stats' | 'datalog' | 'settings' | 'ota';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'map', label: '地图', icon: Map },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'datalog', label: '记录', icon: Database },
  { id: 'settings', label: '设置', icon: Settings },
  { id: 'ota', label: '升级', icon: Cpu },
];

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('map');
  const { isConnected } = useStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'map':
        return <MapPage />;
      case 'stats':
        return <StatsPage />;
      case 'datalog':
        return <DataLogPage />;
      case 'settings':
        return <SettingsPage />;
      case 'ota':
        return <OTAPage />;
      default:
        return <MapPage />;
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col">
      {/* 页面内容 */}
      <div className="flex-1 overflow-y-auto">{renderPage()}</div>

      {/* 底部导航栏 */}
      <nav className="bg-gray-900/90 border-t border-gray-800/50 backdrop-blur-lg">
        <div className="grid grid-cols-5 gap-1 py-1 px-1">
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
                    ? 'text-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'drop-shadow-lg drop-shadow-cyan-400/50' : ''}`}
                />
                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
