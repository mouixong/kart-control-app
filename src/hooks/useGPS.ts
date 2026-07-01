/**
 * GPS定位Hook
 * 获取当前位置并实时更新
 */

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

export function useGPS() {
  const watchIdRef = useRef<number | null>(null);
  const {
    isRecording,
    currentTrip,
    setCurrentPosition,
    addGPSPoint,
    vehicleStatus,
  } = useStore();

  /**
   * 开始GPS定位追踪
   */
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('浏览器不支持GPS定位');
      return;
    }

    // 获取当前位置
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition(latitude, longitude);
      },
      (error) => {
        console.error('GPS定位失败:', error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 持续追踪位置
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        setCurrentPosition(latitude, longitude);

        // 如果正在记录，添加轨迹点
        if (isRecording) {
          const motorSpeed = (Math.abs(vehicleStatus.speedR) + Math.abs(vehicleStatus.speedL)) / 2;
          const speedKmh = speed ? speed * 3.6 : motorSpeed * 0.03;
          addGPSPoint({
            lat: latitude,
            lng: longitude,
            speed: speedKmh,
            timestamp: Date.now(),
          });
        }
      },
      (error) => {
        console.error('GPS追踪失败:', error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [isRecording, setCurrentPosition, addGPSPoint, vehicleStatus.speedR, vehicleStatus.speedL]);

  /**
   * 停止GPS定位追踪
   */
  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // 组件挂载时启动GPS
  useEffect(() => {
    startGPS();
    return () => stopGPS();
  }, [startGPS, stopGPS]);

  return { startGPS, stopGPS };
}
