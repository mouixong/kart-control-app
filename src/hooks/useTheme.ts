/**
 * 主题 Hook
 * 返回当前主题相关的颜色配置
 */

import { useThemeStore } from '../store/useThemeStore';

export interface ThemeColors {
  // 页面背景
  bg: string;
  // 主文字
  text: string;
  textSecondary: string;
  textMuted: string;
  // 强调色
  accent: string;
  accentLight: string;
  accentBg: string;
  // 卡片
  card: string;
  cardBorder: string;
  // 按钮/开关
  primary: string;
  // 状态色
  success: string;
  warning: string;
  danger: string;
  info: string;
  // 仪表盘特殊
  gaugeBg: string;
  gaugeTrack: string;
  gaugeGlow: string;
  // 输入/滑块
  inputBg: string;
  inputBorder: string;
}

export const useTheme = (): { theme: 'light' | 'dark'; colors: ThemeColors } => {
  const { theme } = useThemeStore();

  const colors: Record<'light' | 'dark', ThemeColors> = {
    light: {
      bg: 'bg-[#eef9fa]',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-400',
      accent: 'text-blue-500',
      accentLight: 'text-blue-400',
      accentBg: 'bg-blue-500',
      card: 'bg-white',
      cardBorder: 'border-gray-100',
      primary: 'bg-blue-500',
      success: 'text-green-500',
      warning: 'text-orange-500',
      danger: 'text-red-500',
      info: 'text-blue-500',
      gaugeBg: 'bg-white',
      gaugeTrack: 'stroke-blue-100',
      gaugeGlow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
      inputBg: 'bg-gray-100',
      inputBorder: 'border-gray-200',
    },
    dark: {
      bg: 'bg-[#0a0a0f]',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-500',
      accent: 'text-cyan-400',
      accentLight: 'text-cyan-300',
      accentBg: 'bg-cyan-500',
      card: 'bg-gray-800/60',
      cardBorder: 'border-gray-700/50',
      primary: 'bg-cyan-500',
      success: 'text-green-400',
      warning: 'text-orange-400',
      danger: 'text-red-400',
      info: 'text-cyan-400',
      gaugeBg: 'bg-gray-900',
      gaugeTrack: 'stroke-gray-700',
      gaugeGlow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
      inputBg: 'bg-gray-700/50',
      inputBorder: 'border-gray-600',
    },
  };

  return { theme, colors: colors[theme] };
};
