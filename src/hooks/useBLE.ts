/**
 * 蓝牙BLE通信Hook
 * 使用Capacitor Community Bluetooth LE插件，支持Web和原生Android
 * 适配 hoverboard-firmware-hack-FOC-bbcar 固件协议
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { decodeStatus, commandToBytes, createTextParamCommand, createTextGetCommand, createSaveCommand } from '../utils/protocol';
import type { Command } from '../types';
import { BleClient } from '@capacitor-community/bluetooth-le';

// BLE UUIDs (HC-05/HC-06 常用UUID)
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const WRITE_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
const NOTIFY_CHAR_UUID = '0000ffe2-0000-1000-8000-00805f9b34fb';

// 判断是否在原生App环境
const isNative = () => {
  return typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform();
};

export function useBLE() {
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);
  const writeCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const notifyCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const deviceIdRef = useRef<string>('');
  const [bleInitialized, setBleInitialized] = useState(false);

  const {
    setConnected,
    setConnecting,
    setDevice,
    setError,
    updateVehicleStatus,
  } = useStore();

  /**
   * 初始化蓝牙客户端（原生环境）
   */
  const initBleClient = useCallback(async () => {
    if (!bleInitialized && isNative()) {
      try {
        await BleClient.initialize();
        console.log('BleClient 初始化成功');
        setBleInitialized(true);
      } catch (err) {
        console.error('BleClient 初始化失败:', err);
      }
    }
  }, [bleInitialized]);

  /**
   * 扫描并连接蓝牙设备
   */
  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      if (isNative()) {
        // 原生环境使用Capacitor蓝牙插件
        await initBleClient();

        // 请求设备
        const device = await BleClient.requestDevice({
          services: [SERVICE_UUID],
        });

        deviceIdRef.current = device.deviceId;
        setDevice(device.name || '未知设备', device.deviceId);

        // 连接设备
        await BleClient.connect(device.deviceId);

        // 启动通知
        await BleClient.startNotifications(
          device.deviceId,
          SERVICE_UUID,
          NOTIFY_CHAR_UUID,
          (value: DataView) => {
            const buffer = new Uint8Array(value.buffer);
            const status = decodeStatus(buffer);
            if (status) {
              updateVehicleStatus(status);
            }
          }
        );

        setConnected(true);
        setConnecting(false);
      } else {
        // Web环境使用Web Bluetooth API
        if (!navigator.bluetooth) {
          throw new Error('当前浏览器不支持Web Bluetooth API，请使用Chrome或Edge浏览器');
        }

        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [SERVICE_UUID] }],
          optionalServices: [SERVICE_UUID],
        });

        deviceRef.current = device;
        setDevice(device.name || '未知设备', device.id);

        const server = await device.gatt?.connect();
        if (!server) throw new Error('无法连接GATT服务器');
        serverRef.current = server;

        const service = await server.getPrimaryService(SERVICE_UUID);

        const writeChar = await service.getCharacteristic(WRITE_CHAR_UUID);
        writeCharRef.current = writeChar;

        const notifyChar = await service.getCharacteristic(NOTIFY_CHAR_UUID);
        notifyCharRef.current = notifyChar;

        await notifyChar.startNotifications();
        notifyChar.addEventListener('characteristicvaluechanged', handleNotification);

        device.addEventListener('gattserverdisconnected', handleDisconnect);

        setConnected(true);
        setConnecting(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '连接失败';
      setError(errorMsg);
      setConnecting(false);
      setConnected(false);
    }
  }, [setConnected, setConnecting, setDevice, setError, initBleClient, updateVehicleStatus]);

  /**
   * 断开蓝牙连接
   */
  const disconnect = useCallback(() => {
    if (isNative() && deviceIdRef.current) {
      BleClient.disconnect(deviceIdRef.current).catch(() => {});
      deviceIdRef.current = '';
    } else {
      if (notifyCharRef.current) {
        notifyCharRef.current.stopNotifications().catch(() => {});
        notifyCharRef.current.removeEventListener('characteristicvaluechanged', handleNotification);
      }

      if (deviceRef.current) {
        deviceRef.current.removeEventListener('gattserverdisconnected', handleDisconnect);
      }

      if (serverRef.current) {
        serverRef.current.disconnect();
      }

      deviceRef.current = null;
      serverRef.current = null;
      writeCharRef.current = null;
      notifyCharRef.current = null;
    }

    setConnected(false);
  }, [setConnected]);

  /**
   * 发送二进制命令到设备 (SerialCommand)
   */
  const sendCommand = useCallback(async (cmd: Command) => {
    try {
      const data = commandToBytes(cmd);

      if (isNative() && deviceIdRef.current) {
        await BleClient.write(
          deviceIdRef.current,
          SERVICE_UUID,
          WRITE_CHAR_UUID,
          new DataView(data.buffer)
        );
      } else if (writeCharRef.current) {
        await writeCharRef.current.writeValue(data);
      } else {
        console.warn('蓝牙未连接，无法发送命令');
      }
    } catch (err) {
      console.error('发送命令失败:', err);
    }
  }, []);

  /**
   * 发送原始数据到设备
   */
  const sendRawData = useCallback(async (data: Uint8Array) => {
    try {
      if (isNative() && deviceIdRef.current) {
        await BleClient.write(
          deviceIdRef.current,
          SERVICE_UUID,
          WRITE_CHAR_UUID,
          new DataView(data.buffer)
        );
      } else if (writeCharRef.current) {
        await writeCharRef.current.writeValue(data);
      } else {
        console.warn('蓝牙未连接，无法发送数据');
      }
    } catch (err) {
      console.error('发送数据失败:', err);
    }
  }, []);

  /**
   * 发送文本参数设置命令 (DEBUG串口协议)
   */
  const sendParamCommand = useCallback(async (paramName: string, value: number) => {
    const data = createTextParamCommand(paramName, value);
    await sendRawData(data);
  }, [sendRawData]);

  /**
   * 发送文本参数读取命令
   */
  const sendGetCommand = useCallback(async (paramName: string) => {
    const data = createTextGetCommand(paramName);
    await sendRawData(data);
  }, [sendRawData]);

  /**
   * 发送保存参数命令
   */
  const sendSaveCommand = useCallback(async () => {
    const data = createSaveCommand();
    await sendRawData(data);
  }, [sendRawData]);

  /**
   * 处理蓝牙通知数据
   */
  const handleNotification = useCallback((event: Event) => {
    const char = event.target as BluetoothRemoteGATTCharacteristic;
    const value = char.value;
    if (!value) return;

    const buffer = new Uint8Array(value.buffer);
    const status = decodeStatus(buffer);
    if (status) {
      updateVehicleStatus(status);
    }
  }, [updateVehicleStatus]);

  /**
   * 处理断开连接事件
   */
  const handleDisconnect = useCallback(() => {
    setConnected(false);
    deviceRef.current = null;
    serverRef.current = null;
    writeCharRef.current = null;
    notifyCharRef.current = null;
  }, [setConnected]);

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendCommand,
    sendRawData,
    sendParamCommand,
    sendGetCommand,
    sendSaveCommand,
  };
}
