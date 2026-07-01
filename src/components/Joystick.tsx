/**
 * 虚拟摇杆组件
 * 支持触摸拖拽控制，用于控制车辆前进/后退和转向
 * 支持扩展buttons控制位（手刹/巡航/大灯等）
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { createJoystickCommand } from '../utils/protocol';
import {
  BTN_EPB,
  BTN_CRUISE,
  BTN_HEADLIGHT,
  BTN_REVERSE,
  BTN_MODE1,
  BTN_MODE2,
  BTN_MODE3,
  BTN_MODE4,
  BTN_BEEP,
} from '../utils/protocol';
import type { Command } from '../types';
import { DriveMode } from '../types';

interface JoystickProps {
  onCommand: (cmd: Command) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onCommand }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const posRef = useRef({ x: 0, y: 0 });

  const {
    setJoystick,
    handBrake,
    cruiseControl,
    headlight,
    reverse,
    driveMode,
  } = useStore();

  const maxRadius = 60; // 摇杆最大移动半径

  /**
   * 计算当前控制位掩码
   */
  const calcButtons = useCallback((): number => {
    let buttons = 0;
    if (handBrake) buttons |= BTN_EPB;
    if (cruiseControl) buttons |= BTN_CRUISE;
    if (headlight) buttons |= BTN_HEADLIGHT;
    if (reverse) buttons |= BTN_REVERSE;
    switch (driveMode) {
      case DriveMode.MODE1: buttons |= BTN_MODE1; break;
      case DriveMode.MODE2: buttons |= BTN_MODE2; break;
      case DriveMode.MODE3: buttons |= BTN_MODE3; break;
      case DriveMode.MODE4: buttons |= BTN_MODE4; break;
    }
    return buttons;
  }, [handBrake, cruiseControl, headlight, reverse, driveMode]);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    // 计算距离并限制在最大半径内
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > maxRadius) {
      const ratio = maxRadius / distance;
      dx *= ratio;
      dy *= ratio;
    }

    posRef.current = { x: dx, y: dy };

    // 更新旋钮位置
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    // 计算速度(-100~100)和转向(-100~100)
    // Y轴负方向为前进，正方向为后退
    const speed = Math.round((-dy / maxRadius) * 100);
    const steer = Math.round((dx / maxRadius) * 100);

    setJoystick(speed, steer);

    // 发送摇杆命令（包含buttons）
    const buttons = calcButtons();
    const cmd = createJoystickCommand(speed, steer, buttons);
    onCommand(cmd);
  }, [onCommand, setJoystick, calcButtons]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    isDragging.current = true;
    updatePosition(clientX, clientY);
  }, [updatePosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    updatePosition(clientX, clientY);
  }, [updatePosition]);

  const handleEnd = useCallback(() => {
    isDragging.current = false;
    posRef.current = { x: 0, y: 0 };

    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }

    setJoystick(0, 0);

    // 发送归零命令（包含buttons）
    const buttons = calcButtons();
    const cmd = createJoystickCommand(0, 0, buttons);
    onCommand(cmd);
  }, [onCommand, setJoystick, calcButtons]);

  // 鼠标事件
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const onMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // 触摸事件
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-cyan-400 text-sm font-medium">方向控制</span>
      <div
        ref={containerRef}
        className="relative w-40 h-40 rounded-full bg-gray-800/80 border-2 border-cyan-500/30 flex items-center justify-center cursor-pointer select-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* 背景网格 */}
        <div className="absolute inset-0 rounded-full opacity-20">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400" />
        </div>

        {/* 中心点 */}
        <div className="absolute w-2 h-2 rounded-full bg-cyan-500/50" />

        {/* 摇杆旋钮 */}
        <div
          ref={knobRef}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/50 border-2 border-white/20 transition-transform duration-75"
          style={{ transform: 'translate(0px, 0px)' }}
        >
          <div className="absolute inset-0 rounded-full bg-white/10" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-white/60 rounded-full" />
        </div>
      </div>
    </div>
  );
};
