/**
 * OTA固件升级页面
 * 通过蓝牙进行固件无线升级
 */

import React, { useState, useRef } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle, XCircle, RotateCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useBLE } from '../hooks/useBLE';

export const OTAPage: React.FC = () => {
  const { isConnected, otaProgress, otaStatus, setOtaProgress, setOtaStatus } = useStore();
  const { sendRawData } = useBLE();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型 (bin或hex)
    if (!file.name.endsWith('.bin') && !file.name.endsWith('.hex')) {
      alert('请选择 .bin 或 .hex 格式的固件文件');
      return;
    }

    setSelectedFile(file);
    setFileInfo({
      name: file.name,
      size: file.size,
    });
    setOtaStatus('idle');
    setOtaProgress(0);
  };

  // 开始OTA升级
  const startOTA = async () => {
    if (!selectedFile || !isConnected) return;

    setOtaStatus('uploading');
    setOtaProgress(0);

    try {
      // 读取文件内容
      const arrayBuffer = await selectedFile.arrayBuffer();
      const firmwareData = new Uint8Array(arrayBuffer);

      // 分片大小 (BLE MTU通常为20-512字节)
      const chunkSize = 128;
      const totalChunks = Math.ceil(firmwareData.length / chunkSize);

      // 发送OTA开始命令
      // 命令格式: 0x0A (OTA命令) | 固件大小(4B) | 分片大小(2B)
      const otaStartData = new Uint8Array([
        0x0A,
        ...uint32ToBytes(firmwareData.length),
        ...uint16ToBytes(chunkSize),
      ]);
      sendRawData(otaStartData);

      // 等待设备确认
      await delay(1000);

      // 发送固件分片
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, firmwareData.length);
        const chunk = firmwareData.slice(start, end);

        // 发送分片数据
        // 命令格式: 0x0B (OTA数据) | 分片序号(2B) | 数据(NB)
        const chunkData = new Uint8Array([
          0x0B,
          ...uint16ToBytes(i),
          ...Array.from(chunk),
        ]);
        sendRawData(chunkData);

        // 更新进度
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setOtaProgress(progress);

        // 每发送10个分片等待一下，避免BLE缓冲区溢出
        if (i % 10 === 0) {
          await delay(100);
        }
      }

      // 发送OTA结束命令
      const otaEndData = new Uint8Array([0x0C]);
      sendRawData(otaEndData);

      setOtaStatus('success');
    } catch (error) {
      console.error('OTA升级失败:', error);
      setOtaStatus('error');
    }
  };

  // 辅助函数
  const uint32ToBytes = (value: number): number[] => {
    return [
      (value >> 0) & 0xFF,
      (value >> 8) & 0xFF,
      (value >> 16) & 0xFF,
      (value >> 24) & 0xFF,
    ];
  };

  const uint16ToBytes = (value: number): number[] => {
    return [
      (value >> 0) & 0xFF,
      (value >> 8) & 0xFF,
    ];
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 状态显示
  const statusConfig = {
    idle: { icon: Upload, text: '准备就绪', color: 'text-gray-400', bg: 'bg-gray-800/60' },
    downloading: { icon: RotateCw, text: '下载中...', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    uploading: { icon: RotateCw, text: '上传中...', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    success: { icon: CheckCircle, text: '升级成功', color: 'text-green-400', bg: 'bg-green-500/10' },
    error: { icon: XCircle, text: '升级失败', color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const currentStatus = statusConfig[otaStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4">
      {/* 页面标题 */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-cyan-400">固件升级</h2>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* 警告提示 */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 text-sm font-medium mb-1">注意事项</h3>
              <ul className="text-xs text-yellow-400/80 space-y-1">
                <li>升级过程中请勿断开蓝牙连接</li>
                <li>确保电池电量充足（建议{'>'}50%）</li>
                <li>请使用正确的固件文件（.bin或.hex）</li>
                <li>升级失败可能导致设备无法启动</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 文件选择 */}
        <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
          <h3 className="text-cyan-400 text-sm font-medium mb-3">选择固件文件</h3>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".bin,.hex"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
            className={`
              w-full flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed
              transition-all duration-300
              ${fileInfo
                ? 'border-cyan-500/50 bg-cyan-500/10'
                : 'border-gray-600 hover:border-gray-500'
              }
              ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <FileUp className={`w-8 h-8 ${fileInfo ? 'text-cyan-400' : 'text-gray-500'}`} />
            <div className="text-left">
              {fileInfo ? (
                <>
                  <p className="text-sm text-cyan-400">{fileInfo.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(fileInfo.size)}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-300">点击选择固件文件</p>
                  <p className="text-xs text-gray-500">支持 .bin 和 .hex 格式</p>
                </>
              )}
            </div>
          </button>
        </div>

        {/* 升级状态 */}
        {otaStatus !== 'idle' && (
          <div className={`${currentStatus.bg} rounded-2xl p-4 border border-gray-700/50`}>
            <div className="flex items-center gap-3 mb-3">
              <StatusIcon className={`w-5 h-5 ${currentStatus.color} ${otaStatus === 'uploading' ? 'animate-spin' : ''}`} />
              <span className={`text-sm font-medium ${currentStatus.color}`}>
                {currentStatus.text}
              </span>
            </div>

            {/* 进度条 */}
            {otaStatus === 'uploading' && (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>上传进度</span>
                  <span>{otaProgress}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${otaProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 升级按钮 */}
        <button
          onClick={startOTA}
          disabled={!isConnected || !selectedFile || otaStatus === 'uploading'}
          className={`
            w-full py-3 rounded-xl text-sm font-medium
            transition-all duration-300
            ${isConnected && selectedFile && otaStatus !== 'uploading'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:bg-cyan-400'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {otaStatus === 'uploading' ? (
            <span className="flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin" />
              升级中...
            </span>
          ) : (
            '开始升级'
          )}
        </button>

        {/* 连接状态提示 */}
        {!isConnected && (
          <p className="text-center text-xs text-gray-500">
            请先连接卡丁车设备
          </p>
        )}
      </div>
    </div>
  );
};
