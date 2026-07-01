/**
 * 数据记录页面
 * 实时记录和查看车辆状态数据
 * 适配 hoverboard-firmware-hack-FOC-bbcar 固件协议
 */

import React, { useEffect, useRef, useState } from 'react';
import { Activity, Download, Trash2, Pause, Play } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';

export const DataLogPage: React.FC = () => {
  const {
    dataLog,
    vehicleStatus,
    isConnected,
    addDataLog,
    clearDataLog,
  } = useStore();

  const { theme, colors } = useTheme();
  const [isLogging, setIsLogging] = useState(false);
  const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 开始/停止记录
  const toggleLogging = () => {
    if (isLogging) {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
        logIntervalRef.current = null;
      }
      setIsLogging(false);
    } else {
      logIntervalRef.current = setInterval(() => {
        addDataLog({ ...vehicleStatus });
      }, 1000);
      setIsLogging(true);
    }
  };

  // 导出CSV
  const exportCSV = () => {
    if (dataLog.length === 0) return;

    const headers = ['时间', '左轮转速', '右轮转速', '电压(V)', '温度(°C)', 'LED命令'];
    const rows = dataLog.map((entry) => [
      new Date(entry.timestamp).toLocaleString('zh-CN'),
      entry.status.speedL,
      entry.status.speedR,
      (entry.status.batVoltage / 100).toFixed(2),
      (entry.status.boardTemp / 10).toFixed(1),
      `0x${entry.status.cmdLed.toString(16).toUpperCase().padStart(4, '0')}`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `卡丁车数据_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // 绘制数据曲线
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dataLog.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, width, height);

    // 绘制网格
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 绘制左轮速度曲线
    const speedLValues = dataLog.map((d) => Math.abs(d.status.speedL));
    const maxSpeedL = Math.max(...speedLValues, 1);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 5;
    ctx.beginPath();

    speedLValues.forEach((speed, index) => {
      const x = (index / (speedLValues.length - 1)) * width;
      const y = height - (speed / maxSpeedL) * height * 0.8 - height * 0.1;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 绘制右轮速度曲线
    const speedRValues = dataLog.map((d) => Math.abs(d.status.speedR));
    const maxSpeedR = Math.max(...speedRValues, 1);

    ctx.strokeStyle = '#ff00ff';
    ctx.shadowColor = 'rgba(255, 0, 255, 0.5)';
    ctx.beginPath();

    speedRValues.forEach((speed, index) => {
      const x = (index / (speedRValues.length - 1)) * width;
      const y = height - (speed / maxSpeedR) * height * 0.8 - height * 0.1;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 绘制电压曲线
    const voltages = dataLog.map((d) => d.status.batVoltage / 100);
    const minVoltage = Math.min(...voltages);
    const maxVoltage = Math.max(...voltages);
    const voltageRange = maxVoltage - minVoltage || 1;

    ctx.strokeStyle = '#00ff88';
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
    ctx.beginPath();

    voltages.forEach((voltage, index) => {
      const x = (index / (voltages.length - 1)) * width;
      const y = height - ((voltage - minVoltage) / voltageRange) * height * 0.6 - height * 0.2;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 图例
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('左轮', 10, 15);
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('右轮', 50, 15);
    ctx.fillStyle = '#00ff88';
    ctx.fillText('电压', 90, 15);
  }, [dataLog]);

  // 清理
  useEffect(() => {
    return () => {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`min-h-screen ${colors.bg} p-4 pb-20`}>
      {/* 页面标题 */}
      <div className="text-center mb-4">
        <h2 className={`text-xl font-bold ${colors.accent}`}>数据记录</h2>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* 控制按钮 */}
        <div className="flex gap-2">
          <button
            onClick={toggleLogging}
            disabled={!isConnected}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium
              transition-all duration-300
              ${isLogging
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : theme === 'dark'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-blue-500/20 text-blue-500 border border-blue-500/50'
              }
              ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLogging ? (
              <>
                <Pause className="w-4 h-4" />
                停止记录
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                开始记录
              </>
            )}
          </button>

          <button
            onClick={exportCSV}
            disabled={dataLog.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/50 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            导出
          </button>

          <button
            onClick={clearDataLog}
            disabled={dataLog.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/50 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 记录状态 */}
        <div className={`${colors.card} rounded-2xl p-3 border ${colors.cardBorder}`}>
          <div className="flex items-center justify-between text-sm">
            <span className={colors.textMuted}>记录状态</span>
            <span className={isLogging ? colors.success : colors.textMuted}>
              {isLogging ? '记录中' : '已停止'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className={colors.textMuted}>记录条数</span>
            <span className={colors.accent}>{dataLog.length} 条</span>
          </div>
        </div>

        {/* 数据曲线 */}
        {dataLog.length > 1 && (
          <div className={`${colors.card} rounded-2xl p-4 border ${colors.cardBorder}`}>
            <h3 className={`${colors.accent} text-sm font-medium mb-2`}>数据曲线</h3>
            <canvas
              ref={canvasRef}
              className="w-full h-40 rounded-lg"
            />
          </div>
        )}

        {/* 实时数据表格 */}
        {dataLog.length > 0 && (
          <div className={`${colors.card} rounded-2xl p-4 border ${colors.cardBorder}`}>
            <h3 className={`${colors.accent} text-sm font-medium mb-2`}>最近数据</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={colors.textMuted}>
                    <th className="text-left py-1">时间</th>
                    <th className="text-right py-1">左轮</th>
                    <th className="text-right py-1">右轮</th>
                    <th className="text-right py-1">电压</th>
                    <th className="text-right py-1">温度</th>
                  </tr>
                </thead>
                <tbody>
                  {dataLog.slice(-10).reverse().map((entry, index) => (
                    <tr key={index} className={`border-t ${colors.cardBorder}`}>
                      <td className={`py-1 ${colors.textSecondary}`}>
                        {new Date(entry.timestamp).toLocaleTimeString('zh-CN')}
                      </td>
                      <td className={`text-right py-1 ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-500'}`}>
                        {entry.status.speedL}
                      </td>
                      <td className={`text-right py-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`}>
                        {entry.status.speedR}
                      </td>
                      <td className={`text-right py-1 ${colors.success}`}>
                        {(entry.status.batVoltage / 100).toFixed(1)}V
                      </td>
                      <td className={`text-right py-1 ${colors.danger}`}>
                        {(entry.status.boardTemp / 10).toFixed(1)}°C
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {dataLog.length === 0 && (
          <div className="text-center py-12">
            <Activity className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${colors.textMuted}`}>暂无数据记录</p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>点击"开始记录"按钮开始记录数据</p>
          </div>
        )}
      </div>
    </div>
  );
};
