/**
 * 驾驶模式选择器组件
 * 适配BBCAR固件四种模式: 学步/标准/乐趣/动力
 */

import React from 'react';
import { Baby, Gauge, Zap, Rocket } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DriveMode, DriveModeLabels } from '../types';

interface ModeSelectorProps {
  onModeChange?: (mode: DriveMode) => void;
}

const modes = [
  {
    mode: DriveMode.MODE1,
    label: DriveModeLabels[DriveMode.MODE1],
    icon: Baby,
    description: '约3km/h',
    color: 'from-green-400 to-green-600',
    maxSpeed: 3,
  },
  {
    mode: DriveMode.MODE2,
    label: DriveModeLabels[DriveMode.MODE2],
    icon: Gauge,
    description: '约6km/h',
    color: 'from-cyan-400 to-cyan-600',
    maxSpeed: 6,
  },
  {
    mode: DriveMode.MODE3,
    label: DriveModeLabels[DriveMode.MODE3],
    icon: Zap,
    description: '约12km/h',
    color: 'from-blue-400 to-blue-600',
    maxSpeed: 12,
  },
  {
    mode: DriveMode.MODE4,
    label: DriveModeLabels[DriveMode.MODE4],
    icon: Rocket,
    description: '约22-39km/h',
    color: 'from-orange-400 to-orange-600',
    maxSpeed: 39,
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onModeChange }) => {
  const { driveMode, setDriveMode } = useStore();

  const handleModeChange = (mode: DriveMode) => {
    setDriveMode(mode);
    onModeChange?.(mode);
  };

  return (
    <div className="w-full">
      <h3 className="text-cyan-400 text-sm font-medium mb-3">驾驶模式</h3>
      <div className="grid grid-cols-2 gap-3">
        {modes.map((item) => {
          const Icon = item.icon;
          const isActive = driveMode === item.mode;

          return (
            <button
              key={item.mode}
              onClick={() => handleModeChange(item.mode)}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-xl
                transition-all duration-300 ease-out
                ${isActive
                  ? `bg-gradient-to-br ${item.color} shadow-lg scale-105`
                  : 'bg-gray-800/60 hover:bg-gray-700/60'
                }
              `}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`}
              />
              <span
                className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}
              >
                {item.label}
              </span>
              <span
                className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}
              >
                {item.description}
              </span>

              {/* 选中指示器 */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
