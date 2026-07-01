/**
 * 通信协议编解码工具
 * 实现与 hoverboard-firmware-hack-FOC-bbcar 固件的蓝牙通信协议
 *
 * 扩展SerialCommand协议 (10字节):
 *   uint16_t start = 0xABCD
 *   int16_t  steer (-1000 ~ 1000)
 *   int16_t  speed (-1000 ~ 1000)
 *   uint16_t buttons (控制位掩码)
 *   uint16_t checksum = start ^ steer ^ speed ^ buttons
 *
 * buttons位定义:
 *   bit 0: BTN_EPB        - 电子手刹
 *   bit 1: BTN_CRUISE     - 定速巡航
 *   bit 2: BTN_HEADLIGHT  - 大灯
 *   bit 3: BTN_REVERSE    - 倒挡
 *   bit 4: BTN_MODE1      - 模式1 (学步)
 *   bit 5: BTN_MODE2      - 模式2 (标准)
 *   bit 6: BTN_MODE3      - 模式3 (乐趣)
 *   bit 7: BTN_MODE4      - 模式4 (动力)
 *   bit 8: BTN_BEEP       - 喇叭/蜂鸣器
 *
 * SerialFeedback (固件 -> APP): 18字节
 *   uint16_t start = 0xABCD
 *   int16_t  cmd1
 *   int16_t  cmd2
 *   int16_t  speedR_meas (右轮RPM)
 *   int16_t  speedL_meas (左轮RPM)
 *   int16_t  batVoltage (电池电压, 单位0.01V)
 *   int16_t  boardTemp (板子温度, 单位0.1°C)
 *   uint16_t cmdLed
 *   uint16_t checksum = start ^ cmd1 ^ cmd2 ^ speedR_meas ^ speedL_meas ^ batVoltage ^ boardTemp ^ cmdLed
 */

import type { VehicleStatus, Command } from '../types';
import { SERIAL_START_FRAME } from '../types';

// Buttons位定义 (与固件util.h保持一致)
export const BTN_EPB        = 1 << 0;
export const BTN_CRUISE     = 1 << 1;
export const BTN_HEADLIGHT  = 1 << 2;
export const BTN_REVERSE    = 1 << 3;
export const BTN_MODE1      = 1 << 4;
export const BTN_MODE2      = 1 << 5;
export const BTN_MODE3      = 1 << 6;
export const BTN_MODE4      = 1 << 7;
export const BTN_BEEP       = 1 << 8;

/**
 * 编码控制命令帧 (SerialCommand)
 * @param steer 转向值 (-1000 ~ 1000)
 * @param speed 速度值 (-1000 ~ 1000)
 * @param buttons 控制位掩码 (可选, 默认0)
 * @returns 编码后的Uint8Array (10字节)
 */
export function encodeCommand(steer: number, speed: number, buttons: number = 0): Uint8Array {
  const clampedSteer = Math.max(-1000, Math.min(1000, Math.round(steer)));
  const clampedSpeed = Math.max(-1000, Math.min(1000, Math.round(speed)));
  const clampedButtons = Math.max(0, Math.min(0xffff, Math.round(buttons)));

  const buffer = new ArrayBuffer(10);
  const view = new DataView(buffer);

  view.setUint16(0, SERIAL_START_FRAME, true);  // start (little-endian)
  view.setInt16(2, clampedSteer, true);          // steer
  view.setInt16(4, clampedSpeed, true);          // speed
  view.setUint16(6, clampedButtons, true);       // buttons

  // 校验和: start ^ steer ^ speed ^ buttons
  const checksum = (view.getUint16(0, true) ^ view.getInt16(2, true) ^ view.getInt16(4, true) ^ view.getUint16(6, true)) & 0xffff;
  view.setUint16(8, checksum, true);

  return new Uint8Array(buffer);
}

/**
 * 解码状态反馈帧 (SerialFeedback)
 * @param data DataView或Uint8Array对象
 * @returns VehicleStatus或null(解码失败)
 */
export function decodeStatus(data: DataView | Uint8Array): VehicleStatus | null {
  const isDataView = data instanceof DataView;
  const byteLength = isDataView ? data.byteLength : data.length;

  if (byteLength < 18) return null;

  const getUint16 = (offset: number) =>
    isDataView
      ? (data as DataView).getUint16(offset, true)
      : (data as Uint8Array)[offset] | ((data as Uint8Array)[offset + 1] << 8);

  const getInt16 = (offset: number) =>
    isDataView
      ? (data as DataView).getInt16(offset, true)
      : ((data as Uint8Array)[offset] | ((data as Uint8Array)[offset + 1] << 8)) << 16 >> 16;

  const start = getUint16(0);
  if (start !== SERIAL_START_FRAME) return null;

  // 提取各字段
  const cmd1 = getInt16(2);
  const cmd2 = getInt16(4);
  const speedR = getInt16(6);
  const speedL = getInt16(8);
  const batVoltage = getInt16(10);
  const boardTemp = getInt16(12);
  const cmdLed = getUint16(14);
  const rxChecksum = getUint16(16);

  // 计算校验和
  const calcChecksum =
    (start ^ cmd1 ^ cmd2 ^ speedR ^ speedL ^ batVoltage ^ boardTemp ^ cmdLed) & 0xffff;

  if ((calcChecksum & 0xffff) !== rxChecksum) {
    return null;
  }

  return {
    start,
    cmd1,
    cmd2,
    speedR,
    speedL,
    batVoltage,
    boardTemp,
    cmdLed,
  };
}

/**
 * 创建摇杆控制命令
 * @param speed 速度值 (-100 ~ 100)
 * @param steer 转向值 (-100 ~ 100)
 * @param buttons 控制位掩码 (可选)
 */
export function createJoystickCommand(speed: number, steer: number, buttons: number = 0): Command {
  // 将 -100~100 映射到 -1000~1000
  const mappedSpeed = Math.max(-100, Math.min(100, speed)) * 10;
  const mappedSteer = Math.max(-100, Math.min(100, steer)) * 10;
  return {
    speed: mappedSpeed,
    steer: mappedSteer,
    buttons,
  };
}

/**
 * 将命令编码为Uint8Array
 */
export function commandToBytes(cmd: Command): Uint8Array {
  return encodeCommand(cmd.steer, cmd.speed, cmd.buttons);
}

/**
 * 创建文本参数设置命令 (通过DEBUG串口协议)
 * @param paramName 参数名称
 * @param value 参数值
 * @returns Uint8Array (UTF-8编码的文本命令)
 */
export function createTextParamCommand(paramName: string, value: number): Uint8Array {
  const text = `$SET ${paramName} ${value}\r\n`;
  return new TextEncoder().encode(text);
}

/**
 * 创建文本参数读取命令
 * @param paramName 参数名称
 * @returns Uint8Array
 */
export function createTextGetCommand(paramName: string): Uint8Array {
  const text = `$GET ${paramName}\r\n`;
  return new TextEncoder().encode(text);
}

/**
 * 创建保存参数命令
 * @returns Uint8Array
 */
export function createSaveCommand(): Uint8Array {
  const text = `$SAVE\r\n`;
  return new TextEncoder().encode(text);
}

/**
 * 创建初始化参数命令
 * @param paramName 参数名称
 * @returns Uint8Array
 */
export function createInitCommand(paramName: string): Uint8Array {
  const text = `$INIT ${paramName}\r\n`;
  return new TextEncoder().encode(text);
}
