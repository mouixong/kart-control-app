/**
 * 全局类型定义
 * 定义车辆状态、命令、蓝牙设备等核心数据结构
 * 适配 hoverboard-firmware-hack-FOC-bbcar 固件协议
 */

// 帧头定义
export const SERIAL_START_FRAME = 0xabcd;

// 固件反馈状态接口 (SerialFeedback)
export interface VehicleStatus {
  start: number;        // 帧头 0xABCD
  cmd1: number;         // 输入1命令值
  cmd2: number;         // 输入2命令值
  speedR: number;       // 右轮测量速度 (RPM)
  speedL: number;       // 左轮测量速度 (RPM)
  batVoltage: number;   // 电池电压 (单位: 0.01V)
  boardTemp: number;    // 板子温度 (单位: 0.1°C)
  cmdLed: number;       // LED命令/状态
}

// 控制命令接口 (SerialCommand)
export interface Command {
  steer: number;   // 转向值 (-1000 ~ 1000)
  speed: number;   // 速度值 (-1000 ~ 1000)
  buttons: number; // 控制位掩码
}

// 蓝牙设备信息
export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}

// 驾驶模式枚举 (BBCAR固件模式)
export enum DriveMode {
  MODE1 = 1,  // 模式1: 3km/h
  MODE2 = 2,  // 模式2: 6km/h
  MODE3 = 3,  // 模式3: 12km/h
  MODE4 = 4,  // 模式4: 22km/h(无弱磁)/39km/h(弱磁)
}

// 驾驶模式标签
export const DriveModeLabels: Record<DriveMode, string> = {
  [DriveMode.MODE1]: '学步模式',
  [DriveMode.MODE2]: '标准模式',
  [DriveMode.MODE3]: '乐趣模式',
  [DriveMode.MODE4]: '动力模式',
};

// 故障码定义 (一线通仪表故障码)
export enum FaultCode {
  NONE = 0x00,
  THROTTLE = 0x01,    // 转把故障
  CTRL = 0x02,        // 控制器故障
  BRAKE = 0x04,       // 刹车故障
  MOTOR = 0x08,       // 电机故障
}

// 校准类型
export enum CalibrationType {
  HALL = 1,  // 霍尔校准
  ADC = 2,   // ADC校准
}

// 固件可调参数ID (基于comms.c中的参数索引)
// 注意: 实际参数设置需要通过DEBUG串口文本协议发送
export enum FirmwareParam {
  CTRL_MOD = 0,       // 控制模式
  CTRL_TYP = 1,       // 控制类型
  I_MOT_MAX = 2,      // 最大相电流
  N_MOT_MAX = 3,      // 最大电机转速
  FI_WEAK_ENA = 4,    // 弱磁启用
  FI_WEAK_HI = 5,     // 弱磁高速RPM
  FI_WEAK_LO = 6,     // 弱磁低速RPM
  FI_WEAK_MAX = 7,    // 弱磁最大电流
  PHA_ADV_MAX = 8,    // 最大相位超前角
  IN1_TYP = 10,       // 输入1类型
  IN1_MIN = 11,       // 输入1最小值
  IN1_MID = 12,       // 输入1中点
  IN1_MAX = 13,       // 输入1最大值
  IN2_TYP = 15,       // 输入2类型
  IN2_MIN = 16,       // 输入2最小值
  IN2_MID = 17,       // 输入2中点
  IN2_MAX = 18,       // 输入2最大值
}
