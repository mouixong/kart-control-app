/**
 * 全屏横屏双表盘仪表盘
 * 左侧速度表(km/h) + 右侧转速表(rpm/min)
 * 中间HUD信息 + 底部状态栏
 * 支持手势滑动退出到首页
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Bluetooth, BluetoothOff, Battery, Navigation, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';

interface CircularGaugeProps {
  value: number;
  max: number;
  unit: string;
  label: string;
  size?: number;
  color?: string;
  ticks?: number[];
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  max,
  unit,
  label,
  size = 260,
  color = '#00f0ff',
  ticks,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;

  const percentage = Math.max(0, Math.min(1, value / max));
  const currentAngle = startAngle + percentage * totalAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // 背景轨道弧线 (270度)
  const trackPath = useMemo(() => {
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = totalAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }, [cx, cy, r]);

  // 进度弧线
  const progressPath = useMemo(() => {
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(currentAngle));
    const y2 = cy + r * Math.sin(toRad(currentAngle));
    const largeArc = currentAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }, [cx, cy, r, currentAngle]);

  // 生成刻度线
  const tickCount = 60;
  const tickLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= tickCount; i++) {
      const angle = startAngle + (i / tickCount) * totalAngle;
      const rad = toRad(angle);
      const isMajor = i % 10 === 0;
      const isMedium = i % 5 === 0;
      const innerR = r - (isMajor ? 14 : isMedium ? 8 : 5);
      const outerR = r + (isMajor ? 2 : 0);
      lines.push({
        x1: cx + innerR * Math.cos(rad),
        y1: cy + innerR * Math.sin(rad),
        x2: cx + outerR * Math.cos(rad),
        y2: cy + outerR * Math.sin(rad),
        stroke: isMajor ? color : isMedium ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
        width: isMajor ? 2 : 1,
      });
    }
    return lines;
  }, [cx, cy, r, color]);

  // 数字标签
  const labels = useMemo(() => {
    const arr = [];
    const step = max / 6;
    for (let i = 0; i <= 6; i++) {
      const val = Math.round(i * step);
      const angle = startAngle + (i / 6) * totalAngle;
      const rad = toRad(angle);
      const lr = r - 28;
      arr.push({
        x: cx + lr * Math.cos(rad),
        y: cy + lr * Math.sin(rad),
        text: String(val),
      });
    }
    return arr;
  }, [cx, cy, r, max]);

  // 指针
  const needleLen = r - 20;
  const needleX = cx + needleLen * Math.cos(toRad(currentAngle));
  const needleY = cy + needleLen * Math.sin(toRad(currentAngle));

  return (
    <div className="flex flex-col items-center" style={{ width: size, height: size + 24 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="50%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* 外圈装饰环 */}
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} strokeWidth={1} opacity={0.15} />
        <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />

        {/* 背景轨道 */}
        <path d={trackPath} fill="none" stroke="#1a1a3e" strokeWidth={8} strokeLinecap="round" />

        {/* 进度条 */}
        <path
          d={progressPath}
          fill="none"
          stroke={`url(#grad-${label})`}
          strokeWidth={8}
          strokeLinecap="round"
          filter={`url(#glow-${label})`}
        />

        {/* 刻度线 */}
        {tickLines.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.stroke}
            strokeWidth={t.width}
          />
        ))}

        {/* 数字标签 */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={10}
            fontFamily="monospace"
            opacity={0.8}
          >
            {l.text}
          </text>
        ))}

        {/* 指针 */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          filter={`url(#glow-${label})`}
        />

        {/* 中心圆 */}
        <circle cx={cx} cy={cy} r={6} fill={color} filter={`url(#glow-${label})`} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />

        {/* 中心数值 */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={32}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {Math.round(value)}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={11}
          fontFamily="monospace"
          opacity={0.8}
        >
          {unit}
        </text>
      </svg>

      {/* 表盘底部标签 */}
      <span className="text-[11px] text-cyan-300/70 font-mono mt-1">{label}</span>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    deviceName,
    vehicleStatus,
    statistics,
    handBrake,
    headlight,
    reverse,
    driveMode,
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [showExitHint, setShowExitHint] = useState(true);

  const voltage = vehicleStatus.batVoltage / 100;
  const temp = vehicleStatus.boardTemp / 10;
  const speedL = Math.abs(vehicleStatus.speedL);
  const speedR = Math.abs(vehicleStatus.speedR);
  const avgRpm = (speedL + speedR) / 2;
  const speedKmh = avgRpm * 0.03;
  // 固件协议暂无电流字段，用基于转速的估算值占位（后续可扩展协议）
  const avgCurrent = avgRpm * 0.5; // mA (估算)
  const distanceKm = (statistics.totalDistance / 1000);

  // 手势退出
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = touchStartY.current - e.touches[0].clientY;
      if (deltaY > 120) {
        window.dispatchEvent(new CustomEvent('navigateToPage', { detail: { page: 'home' } }));
        touchStartY.current = 0;
      }
    };
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    const hintTimer = setTimeout(() => setShowExitHint(false), 3000);
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(hintTimer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#050510] overflow-hidden select-none"
    >
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Bluetooth className="w-4 h-4 text-cyan-400" />
          ) : (
            <BluetoothOff className="w-4 h-4 text-gray-600" />
          )}
          <span className="text-[11px] text-cyan-400 font-mono tracking-wide">
            {isConnecting ? 'CONNECTING...' : isConnected ? (deviceName || 'BBCAR') : 'DISCONNECTED'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-cyan-400/80" />
            <span className="text-[11px] text-cyan-400/80 font-mono">{voltage.toFixed(1)}V</span>
          </div>
        </div>
      </div>

      {/* 主体：双表盘 + 中间信息 */}
      <div className="flex-1 flex items-center justify-center px-2 gap-1">
        {/* 左侧速度表 */}
        <div className="flex-1 flex justify-center items-center">
          <CircularGauge
            value={speedKmh}
            max={160}
            unit="km/h"
            label=""
            size={260}
            color="#00f0ff"
          />
        </div>

        {/* 中间 HUD 信息区 */}
        <div className="flex flex-col items-center gap-5 min-w-[90px]">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Navigation className="w-3 h-3 text-cyan-400/60" />
            </div>
            <div className="text-white text-lg font-bold font-mono leading-none">{distanceKm.toFixed(0)}</div>
            <div className="text-[10px] text-cyan-300/50 font-mono mt-0.5">km Distance</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Battery className="w-3 h-3 text-cyan-400/60" />
            </div>
            <div className="text-white text-lg font-bold font-mono leading-none">{voltage.toFixed(1)}</div>
            <div className="text-[10px] text-cyan-300/50 font-mono mt-0.5">V Battery</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Activity className="w-3 h-3 text-cyan-400/60" />
            </div>
            <div className="text-white text-lg font-bold font-mono leading-none">{avgCurrent.toFixed(0)}</div>
            <div className="text-[10px] text-cyan-300/50 font-mono mt-0.5">mA Avg.Current</div>
          </div>
        </div>

        {/* 右侧转速表 */}
        <div className="flex-1 flex justify-center items-center">
          <CircularGauge
            value={avgRpm}
            max={600}
            unit="rpm/min"
            label=""
            size={260}
            color="#ff6b9d"
          />
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-6 pb-5 pt-2">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] text-cyan-300/50 font-mono mb-0.5">温度</div>
            <div className="text-cyan-400 text-sm font-bold font-mono">{temp.toFixed(0)}°C</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-cyan-300/50 font-mono mb-0.5">驻车</div>
            <div className={`text-sm font-bold font-mono ${handBrake ? 'text-red-400' : 'text-green-400'}`}>
              {handBrake ? '开启' : '关闭'}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-cyan-300/50 font-mono mb-0.5">挡位</div>
          <div className="text-fuchsia-400 text-xl font-black font-mono drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]">
            {driveMode}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] text-cyan-300/50 font-mono mb-0.5">大灯</div>
            <div className={`text-sm font-bold font-mono ${headlight ? 'text-yellow-400' : 'text-gray-600'}`}>
              {headlight ? 'ON' : 'OFF'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-cyan-300/50 font-mono mb-0.5">倒挡</div>
            <div className={`text-sm font-bold font-mono ${reverse ? 'text-orange-400' : 'text-gray-600'}`}>
              {reverse ? 'R' : 'N'}
            </div>
          </div>
        </div>
      </div>

      {/* 退出提示 */}
      <div className={`absolute bottom-1 left-0 right-0 flex flex-col items-center transition-opacity duration-500 ${showExitHint ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-8 h-1 rounded-full bg-cyan-400/40 mb-1" />
        <span className="text-[9px] text-cyan-400/40 font-mono">底部上滑返回首页</span>
      </div>

      {/* 扫描线遮罩 */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(0,240,255,0.02)_50%,transparent_100%)] bg-[length:100%_3px]" />
    </div>
  );
};
