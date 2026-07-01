/**
 * 首页 - 汽车App风格卡片式UI
 * 支持白天/黑夜主题
 */

import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  BluetoothOff,
  Zap,
  Navigation,
  Thermometer,
  Battery,
  Power,
  Lightbulb,
  ArrowLeftRight,
  CircleParking,
  MapPin,
  Activity,
  ShieldAlert,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useBLE } from '../hooks/useBLE';
import { useGPS } from '../hooks/useGPS';
import { useThemeStore } from '../store/useThemeStore';

export const HomePage: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    deviceName,
    error,
    vehicleStatus,
    statistics,
    currentPosition,
    handBrake,
    headlight,
    reverse,
    driveMode,
    toggleHandBrake,
    toggleHeadlight,
    toggleReverse,
  } = useStore();

  const { theme, toggleTheme } = useThemeStore();
  const { connect, disconnect } = useBLE();
  useGPS();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = theme === 'dark';
  const voltage = vehicleStatus.batVoltage / 100;
  const batteryPercent = Math.max(0, Math.min(100, Math.round(((voltage - 36) / (54 - 36)) * 100)));
  const temp = vehicleStatus.boardTemp / 10;
  const avgSpeed = (Math.abs(vehicleStatus.speedR) + Math.abs(vehicleStatus.speedL)) / 2;
  const speedKmh = avgSpeed * 0.03;
  const totalKm = (statistics.totalDistance / 1000).toFixed(0);
  const updateStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

  const pageBg = isDark
    ? 'bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0a0a0f]'
    : 'bg-gradient-to-b from-[#a8d8ea] via-[#d4f1f4] to-[#eef9fa]';
  const textMain = isDark ? 'text-white' : 'text-gray-800';
  const textSub = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-500';
  const cardBg = isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/90 border-white/50';
  const accent = isDark ? 'text-cyan-400' : 'text-blue-500';
  const accentBg = isDark ? 'bg-cyan-500' : 'bg-blue-500';

  return (
    <div className={`min-h-screen ${pageBg} pb-24`}>
      {/* 顶部状态区域 */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${textMain}`}>{totalKm}</span>
            <span className={`text-sm ${textSub}`}>km</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-green-500" />
            <span className={`text-xl font-semibold ${textMain}`}>{batteryPercent}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="w-4 h-4 text-blue-500" />
            <span className={`text-xl font-semibold ${textMain}`}>{temp.toFixed(0)}°</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : textMuted}`}>
              {isConnected ? '已连接' : '已断开'}
            </span>
            <span className={textMuted}>|</span>
            <div className="flex items-end gap-0.5 h-3">
              <div className={`w-0.5 h-1 rounded-sm ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} />
              <div className={`w-0.5 h-1.5 rounded-sm ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} />
              <div className={`w-0.5 h-2 rounded-sm ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} />
              <div className={`w-0.5 h-2.5 rounded-sm ${isConnected ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            </div>
            {isConnected ? (
              <Bluetooth className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <BluetoothOff className={`w-3.5 h-3.5 ${textMuted}`} />
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isDark ? 'bg-white/10 text-gray-300' : 'bg-white/60 text-gray-600'}`}>
              BBCAR
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] ${textMuted}`}>更新于: {updateStr}</span>
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-full ${isDark ? 'bg-white/10 text-yellow-400' : 'bg-white/60 text-orange-500'}`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 车辆大图区域 */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-64 h-40 flex items-center justify-center">
          <div className="text-8xl filter drop-shadow-lg">🏎️</div>
        </div>
        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${isDark ? 'bg-white/10 text-gray-300' : 'bg-white/50 text-gray-600'}`}>
          {driveMode === 1 && '学步模式 · 约3km/h'}
          {driveMode === 2 && '标准模式 · 约6km/h'}
          {driveMode === 3 && '乐趣模式 · 约12km/h'}
          {driveMode === 4 && '动力模式 · 约22-39km/h'}
        </div>
      </div>

      {/* 快捷功能按钮 */}
      <div className="px-5 mb-4">
        <div className="flex justify-between">
          {[
            { icon: CircleParking, label: '手刹', active: handBrake, color: '#ef4444', action: toggleHandBrake },
            { icon: Lightbulb, label: '大灯', active: headlight, color: '#eab308', action: toggleHeadlight },
            { icon: ArrowLeftRight, label: '倒挡', active: reverse, color: '#f97316', action: toggleReverse },
            { icon: Power, label: '熄火', active: false, color: '#6b7280', action: () => disconnect() },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
                  style={{
                    backgroundColor: item.active ? item.color : isDark ? '#1f2937' : '#ffffff',
                    color: item.active ? '#ffffff' : isDark ? '#d1d5db' : '#4b5563',
                  }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[11px] font-medium ${textMain}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 卡片网格 */}
      <div className="px-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className={`${cardBg} rounded-2xl p-4 border shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${textMuted}`}>当前速度</span>
              <Thermometer className={accent} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${textMain}`}>{speedKmh.toFixed(1)}</span>
              <span className={`text-xs ${textMuted}`}>km/h</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`h-full ${accentBg} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, (speedKmh / 40) * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className={`${cardBg} rounded-2xl p-0 border shadow-sm overflow-hidden relative`}>
            <div className={`absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 ${isDark ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm`}>
              <MapPin className="w-3 h-3 text-blue-500" />
              <span className={`text-[10px] ${textMain}`}>{currentPosition ? '已定位' : '定位中'}</span>
            </div>
            <div className="h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <Navigation className="w-8 h-8 text-blue-400" />
            </div>
            <div className="p-2">
              <p className={`text-[10px] truncate ${textMuted}`}>
                {currentPosition ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}` : '等待GPS信号...'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`${cardBg} rounded-2xl p-4 border shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${textMuted}`}>总行程</span>
              <Activity className={accent} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${textMain}`}>{statistics.totalTrips}</span>
              <span className={`text-xs ${textMuted}`}>次</span>
            </div>
            <div className={`mt-2 text-[10px] ${textMuted}`}>
              最高速 {statistics.maxSpeed.toFixed(1)} km/h
            </div>
          </div>

          <div className={`${cardBg} rounded-2xl p-4 border shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${textMuted}`}>电池电压</span>
              <Battery className="text-green-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${textMain}`}>{voltage.toFixed(1)}</span>
              <span className={`text-xs ${textMuted}`}>V</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${batteryPercent}%` }} />
              </div>
              <span className={`text-[10px] ${textMuted}`}>{batteryPercent}%</span>
            </div>
          </div>
        </div>

        <div className={`${cardBg} rounded-2xl p-4 border shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${textMain}`}>实时状态</span>
            <button
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border
                ${isConnected
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
                }
              `}
            >
              {isConnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : isConnected ? <Bluetooth className="w-3 h-3" /> : <BluetoothOff className="w-3 h-3" />}
              {isConnecting ? '连接中' : isConnected ? deviceName || '已连接' : '未连接'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '左轮', value: `${vehicleStatus.speedL}`, unit: 'RPM', color: 'text-blue-500' },
              { label: '右轮', value: `${vehicleStatus.speedR}`, unit: 'RPM', color: 'text-purple-500' },
              { label: '温度', value: `${temp.toFixed(1)}`, unit: '°C', color: 'text-red-500' },
              { label: 'LED', value: `0x${vehicleStatus.cmdLed.toString(16).toUpperCase().padStart(2, '0')}`, unit: '', color: 'text-yellow-500' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-[10px] ${textMuted}`}>{item.label}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                <p className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{item.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-[11px] text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};
