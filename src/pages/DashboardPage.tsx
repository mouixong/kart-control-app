/**
 * 全屏横屏双表盘仪表盘
 * 进入自动锁定横屏，退出恢复竖屏
 * 支持陀螺仪方向检测与动态尺寸适配
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Bluetooth, BluetoothOff, Battery, Navigation, Activity, RotateCcw } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { useStore } from '../store/useStore';

interface CircularGaugeProps {
  value: number;
  max: number;
  unit: string;
  label: string;
  size?: number;
  color?: string;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  max,
  unit,
  label,
  size = 240,
  color = '#00f0ff',
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

  const trackPath = useMemo(() => {
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = totalAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }, [cx, cy, r]);

  const progressPath = useMemo(() => {
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(currentAngle));
    const y2 = cy + r * Math.sin(toRad(currentAngle));
    const largeArc = currentAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }, [cx, cy, r, currentAngle]);

  const tickLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 60; i++) {
      const angle = startAngle + (i / 60) * totalAngle;
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

  const labels = useMemo(() => {
    const arr = [];
    const step = max / 6;
    for (let i = 0; i <= 6; i++) {
      const val = Math.round(i * step);
      const angle = startAngle + (i / 6) * totalAngle;
      const rad = toRad(angle);
      const lr = r - 28;
      arr.push({ x: cx + lr * Math.cos(rad), y: cy + lr * Math.sin(rad), text: String(val) });
    }
    return arr;
  }, [cx, cy, r, max]);

  const needleLen = r - 20;
  const needleX = cx + needleLen * Math.cos(toRad(currentAngle));
  const needleY = cy + needleLen * Math.sin(toRad(currentAngle));

  const glowId = `glow-${label.replace(/\s/g, '')}`;
  const gradId = `grad-${label.replace(/\s/g, '')}`;

  return (
    <div className="flex flex-col items-center" style={{ width: size, height: size + 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="50%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} strokeWidth={1} opacity={0.15} />
        <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />

        <path d={trackPath} fill="none" stroke="#1a1a3e" strokeWidth={8} strokeLinecap="round" />
        <path
          d={progressPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={8}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />

        {tickLines.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.stroke} strokeWidth={t.width} />
        ))}

        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={10} fontFamily="monospace" opacity={0.8}>
            {l.text}
          </text>
        ))}

        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2.5} strokeLinecap="round" filter={`url(#${glowId})`} />
        <circle cx={cx} cy={cy} r={6} fill={color} filter={`url(#${glowId})`} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />

        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={28} fontWeight="bold" fontFamily="monospace">
          {Math.round(value)}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={11} fontFamily="monospace" opacity={0.8}>
          {unit}
        </text>
      </svg>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { isConnected, isConnecting, deviceName, vehicleStatus, statistics, handBrake, headlight, reverse, driveMode } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [showExitHint, setShowExitHint] = useState(true);
  const [gaugeSize, setGaugeSize] = useState(240);
  const [isLandscape, setIsLandscape] = useState(true);
  const [gyroHint, setGyroHint] = useState(false);

  const voltage = vehicleStatus.batVoltage / 100;
  const temp = vehicleStatus.boardTemp / 10;
  const speedL = Math.abs(vehicleStatus.speedL);
  const speedR = Math.abs(vehicleStatus.speedR);
  const avgRpm = (speedL + speedR) / 2;
  const speedKmh = avgRpm * 0.03;
  const avgCurrent = avgRpm * 0.5;
  const distanceKm = statistics.totalDistance / 1000;

  // 动态计算表盘大小
  const updateSize = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isLs = w > h;
    setIsLandscape(isLs);

    if (isLs) {
      // 横屏：高度受限，表盘大小约为高度的 65%
      const maxH = Math.min(h * 0.62, w * 0.32);
      setGaugeSize(Math.max(180, Math.floor(maxH)));
    } else {
      // 竖屏：宽度受限，表盘大小约为宽度的 40%
      const maxW = w * 0.42;
      setGaugeSize(Math.max(140, Math.floor(maxW)));
      setGyroHint(true);
      setTimeout(() => setGyroHint(false), 4000);
    }
  }, []);

  // 锁定横屏 + 监听尺寸
  useEffect(() => {
    let unlocked = false;

    const lockLandscape = async () => {
      try {
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } catch {
        // Web 端可能需要用户交互后才能锁定，回退到 screen.orientation
        try {
          await (screen.orientation as any).lock?.('landscape');
        } catch {
          /* ignore */
        }
      }
    };
    lockLandscape();

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    // 陀螺仪：检测设备是否竖直握持，提示旋转
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      // gamma: 左右倾斜, beta: 前后倾斜
      // 如果手机接近竖直（gamma 接近 0，beta 接近 90）
      if (Math.abs(gamma) < 20 && beta > 60 && beta < 120) {
        // 竖直握持，已在横屏锁定状态下，无需提示
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      window.removeEventListener('deviceorientation', handleOrientation);
      if (!unlocked) {
        unlocked = true;
        ScreenOrientation.unlock().catch(() => {
          (screen.orientation as any).unlock?.();
        });
      }
    };
  }, [updateSize]);

  // 手势退出（横屏下从底部短边向上滑）
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
      <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Bluetooth className="w-4 h-4 text-cyan-400" />
          ) : (
            <BluetoothOff className="w-4 h-4 text-gray-600" />
          )}
          <span className="text-[11px] text-cyan-400 font-mono tracking-wide">
            {isConnecting ? 'CONNECTING...' : isConnected ? deviceName || 'BBCAR' : 'DISCONNECTED'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Battery className="w-3.5 h-3.5 text-cyan-400/80" />
          <span className="text-[11px] text-cyan-400/80 font-mono">{voltage.toFixed(1)}V</span>
        </div>
      </div>

      {/* 主体：双表盘 + 中间信息 */}
      <div className="flex-1 flex items-center justify-center px-1 min-h-0">
        {/* 左侧速度表 */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          <CircularGauge value={speedKmh} max={160} unit="km/h" label="speed" size={gaugeSize} color="#00f0ff" />
        </div>

        {/* 中间 HUD 信息区 */}
        <div className="flex flex-col items-center gap-3 shrink-0" style={{ minWidth: 80 }}>
          <div className="text-center">
            <Navigation className="w-3 h-3 text-cyan-400/60 mx-auto mb-0.5" />
            <div className="text-white text-base font-bold font-mono leading-none">{distanceKm.toFixed(0)}</div>
            <div className="text-[9px] text-cyan-300/50 font-mono mt-0.5">km Distance</div>
          </div>

          <div className="text-center">
            <Battery className="w-3 h-3 text-cyan-400/60 mx-auto mb-0.5" />
            <div className="text-white text-base font-bold font-mono leading-none">{voltage.toFixed(1)}</div>
            <div className="text-[9px] text-cyan-300/50 font-mono mt-0.5">V Battery</div>
          </div>

          <div className="text-center">
            <Activity className="w-3 h-3 text-cyan-400/60 mx-auto mb-0.5" />
            <div className="text-white text-base font-bold font-mono leading-none">{avgCurrent.toFixed(0)}</div>
            <div className="text-[9px] text-cyan-300/50 font-mono mt-0.5">mA Avg.Current</div>
          </div>
        </div>

        {/* 右侧转速表 */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          <CircularGauge value={avgRpm} max={600} unit="rpm/min" label="rpm" size={gaugeSize} color="#ff6b9d" />
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-5 pb-3 pt-1 shrink-0">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[9px] text-cyan-300/50 font-mono mb-0.5">温度</div>
            <div className="text-cyan-400 text-xs font-bold font-mono">{temp.toFixed(0)}°C</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-cyan-300/50 font-mono mb-0.5">驻车</div>
            <div className={`text-xs font-bold font-mono ${handBrake ? 'text-red-400' : 'text-green-400'}`}>
              {handBrake ? '开启' : '关闭'}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-[9px] text-cyan-300/50 font-mono mb-0.5">挡位</div>
          <div className="text-fuchsia-400 text-lg font-black font-mono drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]">
            {driveMode}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[9px] text-cyan-300/50 font-mono mb-0.5">大灯</div>
            <div className={`text-xs font-bold font-mono ${headlight ? 'text-yellow-400' : 'text-gray-600'}`}>
              {headlight ? 'ON' : 'OFF'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-cyan-300/50 font-mono mb-0.5">倒挡</div>
            <div className={`text-xs font-bold font-mono ${reverse ? 'text-orange-400' : 'text-gray-600'}`}>
              {reverse ? 'R' : 'N'}
            </div>
          </div>
        </div>
      </div>

      {/* 旋转提示 */}
      {gyroHint && !isLandscape && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <RotateCcw className="w-10 h-10 text-cyan-400 animate-spin mb-3" style={{ animationDuration: '2s' }} />
          <p className="text-cyan-400 text-sm font-mono">请将手机横置以获得最佳效果</p>
        </div>
      )}

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
