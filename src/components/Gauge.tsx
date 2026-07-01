/**
 * 仪表盘组件
 * 圆形表盘显示速度、电压、电流、温度等数据
 */

import React from 'react';

interface GaugeProps {
  value: number;        // 当前值
  min: number;          // 最小值
  max: number;          // 最大值
  label: string;        // 标签
  unit: string;         // 单位
  color?: string;       // 颜色主题
  size?: number;        // 大小
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  color = 'cyan',
  size = 120,
}) => {
  // 计算角度 (0-270度)
  const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = percentage * 270 - 135; // -135 to 135 degrees

  // 颜色映射
  const colorMap: Record<string, { stroke: string; glow: string }> = {
    cyan: { stroke: '#00f0ff', glow: 'rgba(0, 240, 255, 0.5)' },
    orange: { stroke: '#ff6b35', glow: 'rgba(255, 107, 53, 0.5)' },
    green: { stroke: '#00ff88', glow: 'rgba(0, 255, 136, 0.5)' },
    red: { stroke: '#ff4444', glow: 'rgba(255, 68, 68, 0.5)' },
  };

  const theme = colorMap[color] || colorMap.cyan;
  const strokeWidth = size / 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // 计算指针终点
  const rad = (angle * Math.PI) / 180;
  const needleX = center + radius * 0.75 * Math.cos(rad);
  const needleY = center + radius * 0.75 * Math.sin(rad);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* 背景圆弧 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${radius * Math.PI * 1.5} ${radius * Math.PI * 2}`}
            transform={`rotate(135 ${center} ${center})`}
          />

          {/* 进度圆弧 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${radius * Math.PI * 1.5 * percentage} ${radius * Math.PI * 2}`}
            transform={`rotate(135 ${center} ${center})`}
            style={{
              filter: `drop-shadow(0 0 ${strokeWidth / 2}px ${theme.glow})`,
            }}
          />

          {/* 指针 */}
          <line
            x1={center}
            y1={center}
            x2={needleX}
            y2={needleY}
            stroke={theme.stroke}
            strokeWidth={strokeWidth / 3}
            strokeLinecap="round"
          />

          {/* 中心圆 */}
          <circle
            cx={center}
            cy={center}
            r={strokeWidth / 2}
            fill={theme.stroke}
          />
        </svg>

        {/* 数值显示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <span
            className="text-lg font-bold"
            style={{ color: theme.stroke }}
          >
            {value.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">{unit}</span>
        </div>
      </div>

      {/* 标签 */}
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
};
