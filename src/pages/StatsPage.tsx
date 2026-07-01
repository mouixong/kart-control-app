/**
 * 行驶统计与状态监控页面
 * 显示车辆实时状态、总里程、总时长、历史最高速度等统计数据
 * 适配 hoverboard-firmware-hack-FOC-bbcar 固件协议
 */

import React from 'react';
import { Route, Clock, Gauge, TrendingUp, Zap, Calendar, Activity, Thermometer, Battery, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Gauge as GaugeComponent } from '../components/Gauge';

export const StatsPage: React.FC = () => {
  const { statistics, tripHistory, vehicleStatus, isConnected } = useStore();

  // 格式化距离
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${mins}分`;
    }
    return `${mins}分钟`;
  };

  // 计算本周行驶数据
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weekTrips = tripHistory.filter((t) => t.startTime > weekAgo);
  const weekDistance = weekTrips.reduce((sum, t) => sum + t.distance, 0);
  const weekDuration = weekTrips.reduce((sum, t) => sum + t.duration, 0);

  // 计算本月行驶数据
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const monthTrips = tripHistory.filter((t) => t.startTime > monthAgo);
  const monthDistance = monthTrips.reduce((sum, t) => sum + t.distance, 0);

  // 车辆状态转换
  const voltage = vehicleStatus.batVoltage / 100; // 0.01V -> V
  const temp = vehicleStatus.boardTemp / 10; // 0.1°C -> °C
  const speedR = Math.abs(vehicleStatus.speedR);
  const speedL = Math.abs(vehicleStatus.speedL);
  const avgSpeed = (speedR + speedL) / 2;
  // RPM to km/h (假设轮子周长约0.5m: speed * 0.03 ≈ km/h)
  const speedKmh = avgSpeed * 0.03;

  const statCards = [
    {
      icon: Route,
      label: '总里程',
      value: formatDistance(statistics.totalDistance),
      color: 'cyan',
    },
    {
      icon: Clock,
      label: '总时长',
      value: formatDuration(statistics.totalDuration),
      color: 'blue',
    },
    {
      icon: Gauge,
      label: '历史最高速',
      value: `${statistics.maxSpeed.toFixed(1)} km/h`,
      color: 'orange',
    },
    {
      icon: TrendingUp,
      label: '历史平均速',
      value: `${statistics.avgSpeed.toFixed(1)} km/h`,
      color: 'green',
    },
    {
      icon: Zap,
      label: '总行程数',
      value: `${statistics.totalTrips} 次`,
      color: 'purple',
    },
    {
      icon: Calendar,
      label: '本周里程',
      value: formatDistance(weekDistance),
      color: 'pink',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 pb-20">
      {/* 页面标题 */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-cyan-400">统计与状态</h2>
        {!isConnected && (
          <p className="text-xs text-gray-500 mt-1">未连接车辆 - 实时状态不可用</p>
        )}
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* 实时状态仪表盘 */}
        <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
          <h3 className="text-cyan-400 text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            实时状态
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* 速度表 */}
            <div className="flex flex-col items-center">
              <GaugeComponent
                value={speedKmh}
                min={0}
                max={50}
                label="速度"
                unit="km/h"
                color="cyan"
                size={100}
              />
            </div>

            {/* 电压表 */}
            <div className="flex flex-col items-center">
              <GaugeComponent
                value={voltage}
                min={30}
                max={60}
                label="电压"
                unit="V"
                color="green"
                size={100}
              />
            </div>

            {/* 左轮速度 */}
            <div className="bg-gray-700/40 rounded-xl p-3 flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">左轮转速</p>
                <p className="text-sm font-medium text-blue-400">{vehicleStatus.speedL} RPM</p>
              </div>
            </div>

            {/* 右轮速度 */}
            <div className="bg-gray-700/40 rounded-xl p-3 flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">右轮转速</p>
                <p className="text-sm font-medium text-purple-400">{vehicleStatus.speedR} RPM</p>
              </div>
            </div>

            {/* 温度 */}
            <div className="bg-gray-700/40 rounded-xl p-3 flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-xs text-gray-400">板子温度</p>
                <p className="text-sm font-medium text-red-400">{temp.toFixed(1)} °C</p>
              </div>
            </div>

            {/* LED状态 */}
            <div className="bg-gray-700/40 rounded-xl p-3 flex items-center gap-3">
              <Battery className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">LED命令</p>
                <p className="text-sm font-medium text-yellow-400">0x{vehicleStatus.cmdLed.toString(16).toUpperCase().padStart(4, '0')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
          <h3 className="text-cyan-400 text-sm font-medium mb-4">行驶统计</h3>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              const colorMap: Record<string, string> = {
                cyan: 'text-cyan-400 bg-cyan-400/10',
                blue: 'text-blue-400 bg-blue-400/10',
                orange: 'text-orange-400 bg-orange-400/10',
                green: 'text-green-400 bg-green-400/10',
                purple: 'text-purple-400 bg-purple-400/10',
                pink: 'text-pink-400 bg-pink-400/10',
              };
              const colorClass = colorMap[card.color] || colorMap.cyan;

              return (
                <div
                  key={card.label}
                  className="bg-gray-700/40 rounded-xl p-3 flex items-start gap-3"
                >
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{card.label}</p>
                    <p className="text-sm font-medium text-white">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 本周/本月概览 */}
        <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
          <h3 className="text-cyan-400 text-sm font-medium mb-3">近期概览</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">本周行程</span>
              <span className="text-sm text-white">{weekTrips.length} 次</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">本周时长</span>
              <span className="text-sm text-white">{formatDuration(weekDuration)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">本月里程</span>
              <span className="text-sm text-white">{formatDistance(monthDistance)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
