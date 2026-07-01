/**
 * 设置页面
 * 参数调参、自动校准、提示音开关等功能
 * 适配 hoverboard-firmware-hack-FOC-bbcar 固件协议
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Wrench, RotateCcw, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useBLE } from '../hooks/useBLE';
import { useTheme } from '../hooks/useTheme';

export const SettingsPage: React.FC = () => {
  const { sendParamCommand, sendSaveCommand } = useBLE();
  const { isConnected } = useStore();
  const { theme, colors } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  const [saving, setSaving] = useState(false);

  // 固件参数值 (本地缓存，实际值需要从固件读取)
  const [params, setParams] = useState({
    ctrlMod: 2,
    ctrlTyp: 2,
    iMotMax: 15,
    nMotMax: 1000,
    fiWeakEna: 0,
    fiWeakHi: 500,
    fiWeakLo: 300,
    fiWeakMax: 10,
    phaAdvMax: 25,
    in1Min: 0,
    in1Max: 4095,
    in2Min: 0,
    in2Max: 4095,
  });

  const handleParamChange = (key: keyof typeof params, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSendParam = async (paramName: string, value: number) => {
    if (!isConnected) return;
    await sendParamCommand(paramName, value);
  };

  const handleSave = async () => {
    if (!isConnected) return;
    setSaving(true);
    await sendSaveCommand();
    setTimeout(() => setSaving(false), 1000);
  };

  const handleCalibrate = (type: string) => {
    setCalibrating(true);
    // 校准命令通过文本协议发送
    // 实际固件可能需要特定的校准触发方式
    setTimeout(() => setCalibrating(false), 5000);
  };

  const paramGroups = [
    {
      title: '控制参数',
      items: [
        { key: 'ctrlMod' as const, name: 'CTRL_MOD', label: '控制模式', min: 1, max: 3, step: 1, help: '1:VLT 2:SPD 3:TRQ' },
        { key: 'ctrlTyp' as const, name: 'CTRL_TYP', label: '控制类型', min: 0, max: 2, step: 1, help: '0:COM 1:SIN 2:FOC' },
        { key: 'iMotMax' as const, name: 'I_MOT_MAX', label: '最大相电流(A)', min: 1, max: 40, step: 1, help: '单位: A' },
        { key: 'nMotMax' as const, name: 'N_MOT_MAX', label: '最大电机转速', min: 10, max: 2000, step: 10, help: '单位: RPM' },
      ],
    },
    {
      title: '弱磁参数',
      items: [
        { key: 'fiWeakEna' as const, name: 'FI_WEAK_ENA', label: '弱磁启用', min: 0, max: 1, step: 1, help: '0:关闭 1:启用' },
        { key: 'fiWeakHi' as const, name: 'FI_WEAK_HI', label: '弱磁高速RPM', min: 0, max: 1500, step: 10, help: '单位: RPM' },
        { key: 'fiWeakLo' as const, name: 'FI_WEAK_LO', label: '弱磁低速RPM', min: 0, max: 1000, step: 10, help: '单位: RPM' },
        { key: 'fiWeakMax' as const, name: 'FI_WEAK_MAX', label: '弱磁最大电流', min: 0, max: 20, step: 1, help: '单位: A' },
        { key: 'phaAdvMax' as const, name: 'PHA_ADV_MAX', label: '最大相位超前角', min: 0, max: 55, step: 1, help: '单位: 度' },
      ],
    },
    {
      title: '输入校准',
      items: [
        { key: 'in1Min' as const, name: 'IN1_MIN', label: '输入1最小值', min: 0, max: 4095, step: 1, help: 'ADC原始值' },
        { key: 'in1Max' as const, name: 'IN1_MAX', label: '输入1最大值', min: 0, max: 4095, step: 1, help: 'ADC原始值' },
        { key: 'in2Min' as const, name: 'IN2_MIN', label: '输入2最小值', min: 0, max: 4095, step: 1, help: 'ADC原始值' },
        { key: 'in2Max' as const, name: 'IN2_MAX', label: '输入2最大值', min: 0, max: 4095, step: 1, help: 'ADC原始值' },
      ],
    },
  ];

  return (
    <div className={`min-h-screen ${colors.bg} p-4 pb-20`}>
      {/* 页面标题 */}
      <div className="text-center mb-6">
        <h2 className={`text-xl font-bold ${colors.accent}`}>设置</h2>
        {!isConnected && (
          <p className="text-xs text-orange-400 mt-1 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            未连接车辆，参数设置将不会生效
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* 提示音开关 */}
        <div className={`${colors.card} rounded-2xl p-4 border ${colors.cardBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className={`w-5 h-5 ${colors.accent}`} />
              ) : (
                <VolumeX className={`w-5 h-5 ${colors.textMuted}`} />
              )}
              <span className={`${colors.textSecondary} text-sm`}>提示音</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`
                w-12 h-6 rounded-full transition-all duration-300 relative
                ${soundEnabled ? colors.accentBg : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}
              `}
            >
              <div
                className={`
                  w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5
                  transition-all duration-300
                  ${soundEnabled ? 'left-6' : 'left-0.5'}
                `}
              />
            </button>
          </div>
        </div>

        {/* 自动校准 */}
        <div className={`${colors.card} rounded-2xl p-4 border ${colors.cardBorder}`}>
          <h3 className={`${colors.accent} text-sm font-medium mb-3 flex items-center gap-2`}>
            <Wrench className="w-4 h-4" />
            自动校准
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleCalibrate('HALL')}
              disabled={calibrating || !isConnected}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors disabled:opacity-50 ${colors.inputBg} ${theme === 'dark' ? 'hover:bg-gray-600/50' : 'hover:bg-gray-200'}`}
            >
              <span className={`text-sm ${colors.textSecondary}`}>霍尔传感器校准</span>
              {calibrating ? (
                <RotateCcw className={`w-4 h-4 ${colors.accent} animate-spin`} />
              ) : (
                <span className={`text-xs ${colors.accent}`}>开始</span>
              )}
            </button>
            <button
              onClick={() => handleCalibrate('ADC')}
              disabled={calibrating || !isConnected}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors disabled:opacity-50 ${colors.inputBg} ${theme === 'dark' ? 'hover:bg-gray-600/50' : 'hover:bg-gray-200'}`}
            >
              <span className={`text-sm ${colors.textSecondary}`}>ADC校准</span>
              {calibrating ? (
                <RotateCcw className={`w-4 h-4 ${colors.accent} animate-spin`} />
              ) : (
                <span className={`text-xs ${colors.accent}`}>开始</span>
              )}
            </button>
          </div>
        </div>

        {/* 固件参数调节 */}
        {paramGroups.map((group) => (
          <div key={group.title} className={`${colors.card} rounded-2xl p-4 border ${colors.cardBorder}`}>
            <h3 className={`${colors.accent} text-sm font-medium mb-4`}>{group.title}</h3>
            <div className="space-y-4">
              {group.items.map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between mb-1">
                    <div>
                      <span className={`text-sm ${colors.textSecondary}`}>{item.label}</span>
                      <span className={`text-xs ${colors.textMuted} ml-2`}>({item.name})</span>
                    </div>
                    <span className={`text-sm ${colors.accent}`}>{params[item.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    value={params[item.key]}
                    onChange={(e) => handleParamChange(item.key, parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${theme === 'dark' ? 'bg-gray-700 accent-cyan-400' : 'bg-gray-200 accent-blue-500'}`}
                  />
                  <div className="flex justify-between mt-1">
                    <span className={`text-[10px] ${colors.textMuted}`}>{item.help}</span>
                    <button
                      onClick={() => handleSendParam(item.name, params[item.key])}
                      disabled={!isConnected}
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors disabled:opacity-50 ${theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'}`}
                    >
                      发送
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={!isConnected || saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/50 transition-all disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? '保存中...' : '保存参数到EEPROM'}
        </button>

        {/* 协议说明 */}
        <div className={`${colors.card} rounded-xl p-3 border ${colors.cardBorder}`}>
          <p className={`text-xs ${colors.textMuted} leading-relaxed`}>
            参数设置通过DEBUG串口文本协议发送。固件需启用 DEBUG_SERIAL_PROTOCOL 支持。
            命令格式: $SET PARAM_NAME VALUE\r\n
          </p>
        </div>
      </div>
    </div>
  );
};
