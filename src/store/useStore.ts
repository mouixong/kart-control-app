/**
 * Zustand 全局状态管理
 * 管理连接状态、车辆状态、控制状态、行驶记录
 * 适配 hoverboard-firmware-hack-FOC-bbcar 固件协议
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VehicleStatus, BLEDevice } from '../types';
import { DriveMode } from '../types';

// GPS位置点
export interface GPSPoint {
  lat: number;
  lng: number;
  speed: number;
  timestamp: number;
}

// 行驶记录
export interface TripRecord {
  id: string;
  startTime: number;
  endTime?: number;
  distance: number;      // 行驶距离(m)
  maxSpeed: number;      // 最高速度(km/h)
  avgSpeed: number;      // 平均速度(km/h)
  duration: number;      // 行驶时长(s)
  powerUsed: number;     // 耗电量(mAh)
  path: GPSPoint[];      // 行驶轨迹
}

// 统计数据
export interface Statistics {
  totalDistance: number;     // 总里程(m)
  totalDuration: number;     // 总时长(s)
  totalTrips: number;        // 总行程数
  maxSpeed: number;          // 历史最高速度
  avgSpeed: number;          // 历史平均速度
}

interface AppState {
  // 连接状态
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string;
  deviceId: string;
  error: string | null;

  // 车辆状态 (SerialFeedback)
  vehicleStatus: VehicleStatus;

  // 控制状态
  driveMode: DriveMode;
  handBrake: boolean;
  cruiseControl: boolean;
  headlight: boolean;
  reverse: boolean;

  // 摇杆状态
  joystickSpeed: number;
  joystickSteer: number;

  // GPS与轨迹
  currentPosition: { lat: number; lng: number } | null;
  isRecording: boolean;
  currentTrip: TripRecord | null;
  tripHistory: TripRecord[];

  // 统计数据
  statistics: Statistics;

  // 数据记录
  dataLog: { timestamp: number; status: VehicleStatus }[];

  // OTA升级
  otaProgress: number;
  otaStatus: 'idle' | 'downloading' | 'uploading' | 'success' | 'error';

  // 动作
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setDevice: (name: string, id: string) => void;
  setError: (error: string | null) => void;
  updateVehicleStatus: (status: VehicleStatus) => void;
  setDriveMode: (mode: DriveMode) => void;
  toggleHandBrake: () => void;
  toggleCruiseControl: () => void;
  toggleHeadlight: () => void;
  toggleReverse: () => void;
  setJoystick: (speed: number, steer: number) => void;

  // GPS与轨迹动作
  setCurrentPosition: (lat: number, lng: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  addGPSPoint: (point: GPSPoint) => void;
  clearTripHistory: () => void;

  // 数据记录动作
  addDataLog: (status: VehicleStatus) => void;
  clearDataLog: () => void;

  // OTA动作
  setOtaProgress: (progress: number) => void;
  setOtaStatus: (status: AppState['otaStatus']) => void;

  reset: () => void;
}

const defaultVehicleStatus: VehicleStatus = {
  start: 0xabcd,
  cmd1: 0,
  cmd2: 0,
  speedR: 0,
  speedL: 0,
  batVoltage: 0,
  boardTemp: 0,
  cmdLed: 0,
};

const defaultStatistics: Statistics = {
  totalDistance: 0,
  totalDuration: 0,
  totalTrips: 0,
  maxSpeed: 0,
  avgSpeed: 0,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isConnected: false,
      isConnecting: false,
      deviceName: '',
      deviceId: '',
      error: null,

      vehicleStatus: { ...defaultVehicleStatus },

      driveMode: DriveMode.MODE2,
      handBrake: false,
      cruiseControl: false,
      headlight: false,
      reverse: false,

      joystickSpeed: 0,
      joystickSteer: 0,

      currentPosition: null,
      isRecording: false,
      currentTrip: null,
      tripHistory: [],

      statistics: { ...defaultStatistics },

      dataLog: [],

      otaProgress: 0,
      otaStatus: 'idle',

      // 基础动作
      setConnected: (connected) => set({ isConnected: connected }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setDevice: (name, id) => set({ deviceName: name, deviceId: id }),
      setError: (error) => set({ error }),

      updateVehicleStatus: (status) => set({ vehicleStatus: status }),

      setDriveMode: (mode) => set({ driveMode: mode }),
      toggleHandBrake: () => set((state) => ({ handBrake: !state.handBrake })),
      toggleCruiseControl: () => set((state) => ({ cruiseControl: !state.cruiseControl })),
      toggleHeadlight: () => set((state) => ({ headlight: !state.headlight })),
      toggleReverse: () => set((state) => ({ reverse: !state.reverse })),

      setJoystick: (speed, steer) => set({ joystickSpeed: speed, joystickSteer: steer }),

      // GPS与轨迹
      setCurrentPosition: (lat, lng) => set({ currentPosition: { lat, lng } }),

      startRecording: () => {
        const newTrip: TripRecord = {
          id: Date.now().toString(),
          startTime: Date.now(),
          distance: 0,
          maxSpeed: 0,
          avgSpeed: 0,
          duration: 0,
          powerUsed: 0,
          path: [],
        };
        set({ isRecording: true, currentTrip: newTrip });
      },

      stopRecording: () => {
        const state = get();
        if (state.currentTrip) {
          const trip = {
            ...state.currentTrip,
            endTime: Date.now(),
          };
          const newHistory = [trip, ...state.tripHistory].slice(0, 100);

          // 更新统计数据
          const totalTrips = newHistory.length;
          const totalDistance = newHistory.reduce((sum, t) => sum + t.distance, 0);
          const totalDuration = newHistory.reduce((sum, t) => sum + t.duration, 0);
          const maxSpeed = Math.max(...newHistory.map((t) => t.maxSpeed));
          const avgSpeed = totalDuration > 0
            ? newHistory.reduce((sum, t) => sum + t.avgSpeed * t.duration, 0) / totalDuration
            : 0;

          set({
            isRecording: false,
            currentTrip: null,
            tripHistory: newHistory,
            statistics: {
              totalDistance,
              totalDuration,
              totalTrips,
              maxSpeed,
              avgSpeed,
            },
          });
        }
      },

      addGPSPoint: (point) => {
        const state = get();
        if (!state.currentTrip || !state.isRecording) return;

        const path = [...state.currentTrip.path, point];
        const duration = (point.timestamp - state.currentTrip.startTime) / 1000;

        // 计算距离
        let distance = state.currentTrip.distance;
        if (path.length > 1) {
          const prev = path[path.length - 2];
          distance += calculateDistance(prev.lat, prev.lng, point.lat, point.lng);
        }

        // 计算速度统计 (使用车辆速度转换)
        const speeds = path.map((p) => p.speed);
        const maxSpeed = Math.max(...speeds);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

        set({
          currentTrip: {
            ...state.currentTrip,
            path,
            distance,
            duration,
            maxSpeed,
            avgSpeed,
          },
        });
      },

      clearTripHistory: () => set({ tripHistory: [], statistics: { ...defaultStatistics } }),

      // 数据记录
      addDataLog: (status) => {
        const entry = { timestamp: Date.now(), status };
        set((state) => ({
          dataLog: [...state.dataLog, entry].slice(-10000),
        }));
      },

      clearDataLog: () => set({ dataLog: [] }),

      // OTA
      setOtaProgress: (progress) => set({ otaProgress: progress }),
      setOtaStatus: (status) => set({ otaStatus: status }),

      reset: () => set({
        isConnected: false,
        isConnecting: false,
        deviceName: '',
        deviceId: '',
        error: null,
        vehicleStatus: { ...defaultVehicleStatus },
        driveMode: DriveMode.MODE2,
        handBrake: false,
        cruiseControl: false,
        headlight: false,
        reverse: false,
        joystickSpeed: 0,
        joystickSteer: 0,
        currentPosition: null,
        isRecording: false,
        currentTrip: null,
        otaProgress: 0,
        otaStatus: 'idle',
      }),
    }),
    {
      name: 'kart-control-storage',
      partialize: (state) => ({
        tripHistory: state.tripHistory,
        statistics: state.statistics,
      }),
    }
  )
);

/**
 * 计算两点间距离（Haversine公式）
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球半径(m)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
