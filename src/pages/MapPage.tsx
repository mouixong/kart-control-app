/**
 * 地图轨迹页面
 * 显示当前位置和行驶轨迹，集成蓝牙连接和遥控功能
 * 适配 hoverboard-firmware-hack-FOC-bbcar 固件协议
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Play, Square, Trash2, Bluetooth, BluetoothOff, RefreshCw, AlertCircle, Gamepad2, X, CircleParking, Anchor, Lightbulb, ArrowLeftRight, Megaphone } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useGPS } from '../hooks/useGPS';
import { useBLE } from '../hooks/useBLE';
import { Joystick } from '../components/Joystick';
import { ModeSelector } from '../components/ModeSelector';

export const MapPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    currentPosition,
    isRecording,
    currentTrip,
    tripHistory,
    startRecording,
    stopRecording,
    clearTripHistory,
    isConnected,
    isConnecting,
    deviceName,
    error,
    handBrake,
    cruiseControl,
    headlight,
    reverse,
    toggleHandBrake,
    toggleCruiseControl,
    toggleHeadlight,
    toggleReverse,
  } = useStore();

  const { connect, disconnect, sendCommand } = useBLE();
  const [showJoystick, setShowJoystick] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  useGPS();

  // 绘制地图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;

    // 清空画布
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, width, height);

    // 绘制网格
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 获取要显示的轨迹
    let path = currentTrip?.path || [];
    if (selectedTrip) {
      const trip = tripHistory.find((t) => t.id === selectedTrip);
      if (trip) path = trip.path;
    }

    // 绘制轨迹
    if (path.length > 1) {
      // 计算边界
      const lats = path.map((p) => p.lat);
      const lngs = path.map((p) => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const latRange = maxLat - minLat || 0.001;
      const lngRange = maxLng - minLng || 0.001;

      // 留边距
      const padding = 40;
      const mapWidth = width - padding * 2;
      const mapHeight = height - padding * 2;

      const scaleX = mapWidth / lngRange;
      const scaleY = mapHeight / latRange;
      const scale = Math.min(scaleX, scaleY);

      const offsetX = (width - lngRange * scale) / 2;
      const offsetY = (height - latRange * scale) / 2;

      // 绘制轨迹线
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      path.forEach((point, index) => {
        const x = offsetX + (point.lng - minLng) * scale;
        const y = height - (offsetY + (point.lat - minLat) * scale);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.shadowBlur = 0;

      // 绘制起点
      const startPoint = path[0];
      const startX = offsetX + (startPoint.lng - minLng) * scale;
      const startY = height - (offsetY + (startPoint.lat - minLat) * scale);
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(startX, startY, 5, 0, Math.PI * 2);
      ctx.fill();

      // 绘制终点
      const endPoint = path[path.length - 1];
      const endX = offsetX + (endPoint.lng - minLng) * scale;
      const endY = height - (offsetY + (endPoint.lat - minLat) * scale);
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentPosition) {
      // 只显示当前位置
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 绘制位置标签
      ctx.fillStyle = '#00f0ff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('当前位置', width / 2, height / 2 - 12);
    } else {
      // 无位置数据
      ctx.fillStyle = '#333';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('等待GPS信号...', width / 2, height / 2);
    }
  }, [currentPosition, currentTrip, tripHistory, selectedTrip]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col pb-20">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-xl font-bold text-cyan-400">地图</h2>
        <div className="flex items-center gap-2">
          {/* 蓝牙连接状态 */}
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-300
              ${isConnected
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-gray-700/50 text-gray-400 border border-gray-600/30 hover:bg-gray-600/50'
              }
            `}
          >
            {isConnecting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isConnected ? (
              <Bluetooth className="w-3.5 h-3.5" />
            ) : (
              <BluetoothOff className="w-3.5 h-3.5" />
            )}
            {isConnecting ? '连接中' : isConnected ? deviceName || '已连接' : '未连接'}
          </button>

          {/* 遥控按钮 */}
          {isConnected && (
            <button
              onClick={() => setShowJoystick(!showJoystick)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-300
                ${showJoystick
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-700/50 text-gray-400 border border-gray-600/30 hover:bg-gray-600/50'
                }
              `}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              遥控
            </button>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* 地图画布 */}
      <div className="flex-1 mx-4 mb-4 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-2xl border border-gray-700/50"
          style={{ minHeight: '300px' }}
        />

        {/* 遥控浮层 */}
        {showJoystick && isConnected && (
          <div className="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between w-full max-w-xs mb-2">
              <h3 className="text-cyan-400 text-sm font-medium">遥控模式</h3>
              <button
                onClick={() => setShowJoystick(false)}
                className="p-1 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Joystick onCommand={sendCommand} />

            {/* 控制按钮 */}
            <div className="grid grid-cols-5 gap-2 mt-4 w-full max-w-xs">
              <button
                onClick={toggleHandBrake}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                  handBrake ? 'bg-red-500/30 text-red-400 border border-red-500/50' : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                }`}
              >
                <CircleParking className="w-4 h-4" />
                <span>手刹</span>
              </button>
              <button
                onClick={toggleCruiseControl}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                  cruiseControl ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50' : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                }`}
              >
                <Anchor className="w-4 h-4" />
                <span>巡航</span>
              </button>
              <button
                onClick={toggleHeadlight}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                  headlight ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50' : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>大灯</span>
              </button>
              <button
                onClick={toggleReverse}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                  reverse ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50' : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>倒挡</span>
              </button>
              <button
                onClick={() => {
                  // 发送单次蜂鸣命令
                  sendCommand({ steer: 0, speed: 0, buttons: 1 << 8 });
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all bg-gray-700/50 text-gray-400 border border-gray-600/30 active:bg-cyan-500/30 active:text-cyan-400"
              >
                <Megaphone className="w-4 h-4" />
                <span>喇叭</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部控制栏 */}
      <div className="mx-4 space-y-3">
        {/* 模式选择 */}
        {isConnected && <ModeSelector />}

        {/* 行程控制 */}
        <div className="flex gap-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all"
            >
              <Play className="w-4 h-4" />
              开始行程
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
            >
              <Square className="w-4 h-4" />
              结束行程
            </button>
          )}

          <button
            onClick={() => {
              clearTripHistory();
              setSelectedTrip(null);
            }}
            disabled={tripHistory.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-700/50 text-gray-400 border border-gray-600/30 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 历史行程列表 */}
        {tripHistory.length > 0 && (
          <div className="bg-gray-800/60 rounded-2xl p-3 border border-gray-700/50">
            <h3 className="text-cyan-400 text-xs font-medium mb-2">历史行程</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tripHistory.slice(0, 5).map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all
                    ${selectedTrip === trip.id
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                    }
                  `}
                >
                  <span>
                    {new Date(trip.startTime).toLocaleDateString('zh-CN')}
                  </span>
                  <span>{(trip.distance / 1000).toFixed(2)} km</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
