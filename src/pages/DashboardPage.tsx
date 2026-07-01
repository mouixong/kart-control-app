/**
 * 全屏科技感仪表盘页面
 * 支持手势滑动退出到首页
 * 采用深色科幻风格：霓虹光效、数字表盘、HUD显示
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Bluetooth,
  BluetoothOff,
  Battery,
  Thermometer,
  Navigation,
  Zap,
  Power,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useThemeStore } from '../store/useThemeStore';
import { Gauge } from '../components/Gauge';

export const DashboardPage: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    deviceName,
    vehicleStatus,
    handBrake,
    headlight,
    reverse,
    driveMode,
  } = useStore();

  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [showExitHint, setShowExitHint] = useState(true);

  const voltage = vehicleStatus.batVoltage / 100;
  const temp = vehicleStatus.boardTemp / 10;
  const speedL = Math.abs(vehicleStatus.speedL);
  const speedR = Math.abs(vehicleStatus.speedR);
  const avgRpm = (speedL + speedR) / 2;
  const speedKmh = avgRpm * 0.03;

  // 手势退出：从底部向上滑动超过 120px 返回首页
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = touchStartY.current - e.touches[0].clientY;
      if (deltaY > 120) {
        // 触发返回首页事件
        window.dispatchEvent(new CustomEvent('navigateToPage', { detail: { page: 'home' } }));
        touchStartY.current = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // 3秒后隐藏退出提示
    const hintTimer = setTimeout(() => setShowExitHint(false), 3000);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(hintTimer);
    };
  }, []);

  // 电池百分比
  const batteryPercent = Math.max(0, Math.min(100, Math.round(((voltage - 36) / (54 - 36)) * 100)));

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-[#050508]' : 'bg-[#0f172a]'} overflow-hidden`}
    >
      {/* 顶部 HUD */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Bluetooth className="w-4 h-4 text-cyan-400" />
          ) : (
            <BluetoothOff className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-xs text-cyan-400 font-mono">
            {isConnecting ? 'CONNECTING...' : isConnected ? (deviceName || 'BBCAR') : 'DISCONNECTED'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-green-400 font-mono">{batteryPercent}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs text-orange-400 font-mono">{temp.toFixed(1)}°C</span>
          </div>
        </div>
      </div>

      {/* 主速度表盘 */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* 外圈光晕 */}
        <div className="absolute w-72 h-72 rounded-full border border-cyan-500/20 animate-pulse" />
        <div className="absolute w-64 h-64 rounded-full border border-cyan-400/10" />

        {/* 中央速度数字 */}
        <div className="text-center z-10">
          <div className="text-7xl font-black text-white tracking-tighter font-mono tabular-nums drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
            {speedKmh.toFixed(1)}
          </div>
          <div className="text-sm text-cyan-400 font-mono tracking-[0.3em] mt-1">KM/H</div>
        </div>

        {/* 半圆速度条 */}
        <div className="absolute mt-8">
          <Gauge value={speedKmh} min={0} max={50} label="" unit="" color="cyan" size={280} darkMode />
        </div>
      </div>

      {/* 左右轮转速 + 电压温度 */}
      <div className="grid grid-cols-4 gap-3 px-4 mb-4">
        <div className="bg-gray-900/60 border border-cyan-500/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 font-mono mb-1">LEFT</p>
          <p className="text-lg font-bold text-cyan-400 font-mono">{vehicleStatus.speedL}</p>
          <p className="text-[9px] text-gray-600 font-mono">RPM</p>
        </div>
        <div className="bg-gray-900/60 border border-purple-500/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 font-mono mb-1">RIGHT</p>
          <p className="text-lg font-bold text-purple-400 font-mono">{vehicleStatus.speedR}</p>
          <p className="text-[9px] text-gray-600 font-mono">RPM</p>
        </div>
        <div className="bg-gray-900/60 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 font-mono mb-1">VOLT</p>
          <p className="text-lg font-bold text-green-400 font-mono">{voltage.toFixed(1)}</p>
          <p className="text-[9px] text-gray-600 font-mono">V</p>
        </div>
        <div className="bg-gray-900/60 border border-orange-500/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 font-mono mb-1">TEMP</p>
          <p className="text-lg font-bold text-orange-400 font-mono">{temp.toFixed(0)}</p>
          <p className="text-[9px] text-gray-600 font-mono">°C</p>
        </div>
      </div>

      {/* 状态指示器 */}
      <div className="flex justify-center gap-4 mb-4">
        {[
          { label: '手刹', active: handBrake, color: 'text-red-400 border-red-400/30 bg-red-400/10' },
          { label: '大灯', active: headlight, color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
          { label: '倒挡', active: reverse, color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
          { label: '模式', active: true, color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10', text: `M${driveMode}` },
        ].map((item) => (
          <div
            key={item.label}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${item.active ? item.color : 'text-gray-600 border-gray-700 bg-gray-900/40'}`}
          >
            {item.text || item.label}
          </div>
        ))}
      </div>

      {/* 退出提示 */}
      <div className={`absolute bottom-4 left-0 right-0 flex flex-col items-center transition-opacity duration-500 ${showExitHint ? 'opacity-100' : 'opacity-0'}`}>
        <ChevronDown className="w-5 h-5 text-cyan-400 animate-bounce" />
        <span className="text-[10px] text-cyan-400/70 font-mono mt-1">底部上滑返回首页</span>
      </div>

      {/* 扫描线效果 */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(0,240,255,0.03)_50%,transparent_100%)] bg-[length:100%_4px]" />
    </div>
  );
};
