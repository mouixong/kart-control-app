/**
 * 首页 - 汽车App风格卡片式UI
 * 参考 screenshot 设计：渐变背景 + 车辆大图 + 快捷按钮 + 卡片网格
 */

import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  BluetoothOff,
  Zap,
  Navigation,
  Thermometer,
  Gauge,
  Battery,
  Power,
  Lightbulb,
  ArrowLeftRight,
  CircleParking,
  MapPin,
  Activity,
  ShieldAlert,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useBLE } from '../hooks/useBLE';
import { Gauge as GaugeComponent } from '../components/Gauge';

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
    cruiseControl,
    headlight,
    reverse,
    driveMode,
    toggleHandBrake,
    toggleCruiseControl,
    toggleHeadlight,
    toggleReverse,
  } = useStore();

  const { connect, disconnect } = useBLE();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 计算电量百分比 (假设满电54V, 欠压36V)
  const voltage = vehicleStatus.batVoltage / 100;
  const batteryPercent = Math.max(0, Math.min(100, Math.round(((voltage - 36) / (54 - 36)) * 100)));

  // 板子温度
  const temp = vehicleStatus.boardTemp / 10;

  // 速度
  const avgSpeed = (Math.abs(vehicleStatus.speedR) + Math.abs(vehicleStatus.speedL)) / 2;
  const speedKmh = avgSpeed * 0.03;

  // 里程
  const totalKm = (statistics.totalDistance / 1000).toFixed(0);

  // 更新时间格式化
  const updateStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

  // 连接状态文本
  const statusText = isConnected ? '已连接' : '已断开';
  const statusColor = isConnected ? 'text-green-400' : 'text-gray-400';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#a8d8ea] via-[#d4f1f4] to-[#eef9fa] pb-24">
      {/* 顶部状态区域 */}
      <div className="px-5 pt-4 pb-2">
        {/* 里程 / 电量 / 温度 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800">{totalKm}</span>
            <span className="text-sm text-gray-600">km</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-xl font-semibold text-gray-800">{batteryPercent}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="w-4 h-4 text-blue-500" />
            <span className="text-xl font-semibold text-gray-800">{temp.toFixed(0)}°</span>
          </div>
        </div>

        {/* 状态行 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
            <span className="text-gray-300">|</span>
            {/* 信号强度模拟 */}
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-0.5 h-1 bg-gray-400 rounded-sm" />
              <div className="w-0.5 h-1.5 bg-gray-400 rounded-sm" />
              <div className="w-0.5 h-2 bg-gray-400 rounded-sm" />
              <div className={`w-0.5 h-2.5 rounded-sm ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
            {isConnected ? (
              <Bluetooth className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <BluetoothOff className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span className="text-[10px] px-1.5 py-0.5 bg-white/60 rounded text-gray-600 font-medium">BBCAR</span>
          </div>
          <span className="text-[10px] text-gray-500">更新于: {updateStr}</span>
        </div>
      </div>

      {/* 车辆大图区域 */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-64 h-40 flex items-center justify-center">
          {/* 车辆占位图 - 使用emoji/图标组合 */}
          <div className="text-8xl filter drop-shadow-lg">🏎️</div>
          {/* 或者使用图片占位 */}
          {/* <img src="/car.png" alt="卡丁车" className="w-full h-full object-contain" /> */}
        </div>
        {/* 驾驶模式标签 */}
        <div className="mt-2 px-3 py-1 bg-white/50 rounded-full text-xs text-gray-600 font-medium backdrop-blur-sm">
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
            { icon: CircleParking, label: '手刹', active: handBrake, color: 'red', action: toggleHandBrake },
            { icon: Lightbulb, label: '大灯', active: headlight, color: 'yellow', action: toggleHeadlight },
            { icon: ArrowLeftRight, label: '倒挡', active: reverse, color: 'orange', action: toggleReverse },
            { icon: Power, label: '熄火', active: false, color: 'gray', action: () => disconnect() },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    transition-all duration-300 shadow-sm
                    ${isActive
                      ? `bg-${item.color}-500 text-white shadow-${item.color}-500/30`
                      : 'bg-white text-gray-600 shadow-gray-200'
                    }
                  `}
                  style={{
                    backgroundColor: isActive
                      ? item.color === 'red' ? '#ef4444' : item.color === 'yellow' ? '#eab308' : item.color === 'orange' ? '#f97316' : '#6b7280'
                      : '#ffffff',
                  }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] text-gray-700 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 卡片网格 */}
      <div className="px-4 space-y-3">
        {/* 第一行卡片 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 温度/速度卡片 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">当前速度</span>
              <Thermometer className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-800">{speedKmh.toFixed(1)}</span>
              <span className="text-xs text-gray-500">km/h</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (speedKmh / 40) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 地图位置卡片 */}
          <div className="bg-white rounded-2xl p-0 shadow-sm overflow-hidden relative">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-gray-700">{currentPosition ? '已定位' : '定位中'}</span>
            </div>
            <div className="h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <Navigation className="w-8 h-8 text-blue-400" />
            </div>
            <div className="p-2">
              <p className="text-[10px] text-gray-500 truncate">
                {currentPosition
                  ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`
                  : '等待GPS信号...'}
              </p>
            </div>
          </div>
        </div>

        {/* 第二行卡片 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 能耗/统计卡片 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">总行程</span>
              <Activity className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-800">{statistics.totalTrips}</span>
              <span className="text-xs text-gray-500">次</span>
            </div>
            <div className="mt-2 text-[10px] text-gray-400">
              最高速 {statistics.maxSpeed.toFixed(1)} km/h
            </div>
          </div>

          {/* 电池/电压卡片 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">电池电压</span>
              <Battery className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-800">{voltage.toFixed(1)}</span>
              <span className="text-xs text-gray-500">V</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${batteryPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{batteryPercent}%</span>
            </div>
          </div>
        </div>

        {/* 实时数据条 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">实时状态</span>
            <button
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium
                transition-all
                ${isConnected
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
                }
              `}
            >
              {isConnecting ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : isConnected ? (
                <Bluetooth className="w-3 h-3" />
              ) : (
                <BluetoothOff className="w-3 h-3" />
              )}
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
                <p className="text-[10px] text-gray-400">{item.label}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                <p className="text-[9px] text-gray-300">{item.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-[11px] text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};
