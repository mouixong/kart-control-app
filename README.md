# 卡丁车控制 App

基于 React + TypeScript + Vite + Capacitor 开发的卡丁车蓝牙控制 App，适配 `hoverboard-firmware-hack-FOC-bbcar` 固件协议。

## 项目简介

本 App 通过蓝牙低功耗（BLE）连接卡丁车主控板，实现：

- 蓝牙连接与状态监控
- 车辆状态实时显示（速度、电压、温度、挡位等）
- 科技风格全屏仪表盘（横屏双表盘）
- 快捷控制（手刹、大灯、倒挡、熄火）
- OTA 固件升级
- 数据记录与 CSV 导出
- GPS 定位与行驶轨迹
- 白天/黑夜主题切换

## 主要修改记录

### 1. 通信协议适配（SerialCommand / SerialFeedback）

- 扩展 `SerialCommand` 结构，新增 `uint16_t buttons` 控制位掩码字段
- 定义 9 个控制位常量：
  - `BTN_EPB`：电子手刹
  - `BTN_CRUISE`：定速巡航
  - `BTN_HEADLIGHT`：大灯
  - `BTN_REVERSE`：倒挡
  - `BTN_MODE1~4`：四档模式
  - `BTN_BEEP`：喇叭/蜂鸣器
- 校验和计算包含 `buttons`：
  - `checksum = start ^ steer ^ speed ^ buttons`
- 实现协议编解码：`src/utils/protocol.ts`

### 2. 底部导航修改

- 从 5 按钮（地图、统计、记录、设置、升级）改为 6 按钮
- 新顺序：首页、仪表、统计、记录、设置、升级
- 文件：`src/App.tsx`

### 3. 主题切换系统

- 新增 `src/store/useThemeStore.ts`：基于 Zustand + persist 实现全局白天/黑夜模式
- 新增 `src/hooks/useTheme.ts`：统一颜色配置
- 适配页面：首页、统计、记录、设置、升级

### 4. 科技感全屏仪表盘

- 新增 `src/pages/DashboardPage.tsx`
- 左侧速度表（0-160 km/h）+ 右侧转速表（0-600 rpm/min）
- SVG 自绘表盘：刻度线、数字标签、发光指针、进度弧
- 中间 HUD：Distance、Battery V、Avg.Current
- 底部状态栏：温度、驻车、挡位、大灯、倒挡
- 支持底部上滑手势返回首页
- 自动锁定横屏（`@capacitor/screen-orientation`）
- 陀螺仪方向检测，竖屏时提示横置
- Android 沉浸式全屏（隐藏状态栏和导航栏）

### 5. GPS 定位修复

- 首页 `HomePage` 添加 `useGPS()` 调用
- 修复 `currentPosition` 始终为 null 的问题

### 6. Android 全屏适配

- `MainActivity.java`：添加 `hideSystemBars()` 隐藏状态栏和导航栏
- `styles.xml`：`AppTheme.NoActionBar` 添加 `windowFullscreen`
- `AndroidManifest.xml`：Activity theme 改为全屏主题

## 技术栈

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 3
- Zustand（状态管理）
- Lucide React（图标）
- Capacitor 8（移动端打包）
- `@capacitor-community/bluetooth-le`（蓝牙 LE）
- `@capacitor/screen-orientation`（屏幕方向锁定）

## 环境要求

- Node.js 18+
- npm 9+
- Android Studio（用于 Android 打包）
- JDK 17+
- Android SDK

## 安装依赖

```bash
npm install
```

## 开发调试

```bash
npm run dev
```

浏览器访问 `http://localhost:5173`。

## 构建 Web

```bash
npm run build
```

构建产物位于 `dist/` 目录。

## Android 打包方法

### 1. 首次配置

确保已安装：
- Android Studio
- JDK 17+
- Android SDK（含 SDK Platform 和 Build-Tools）

### 2. 添加 Android 平台（已添加则跳过）

```bash
npx cap add android
```

### 3. 构建并同步

每次修改前端代码后都需要执行：

```bash
npm run build
npx cap sync android
```

> `npx cap sync android` 会把 `dist/` 资源复制到 `android/app/src/main/assets/public/`，并同步 Capacitor 插件。

### 4. 编译 APK

```bash
cd android
gradlew.bat assembleDebug
```

构建成功后，APK 位于：

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. 发布 APK

```bash
cd android
gradlew.bat assembleRelease
```

发布版 APK 位于：

```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

> 发布版需要签名才能安装，签名方法参考 Android 官方文档。

## 常见问题

### 1. 编译提示找不到 `@capacitor/screen-orientation`

```bash
npm install @capacitor/screen-orientation
npx cap sync android
```

### 2. `cap sync` 后插件没有正确同步

尝试清理后重新同步：

```bash
rm -rf node_modules
npm install
npx cap sync android
```

### 3. 仪表盘没有全屏显示

确认已更新以下文件并重新构建：
- `android/app/src/main/java/com/kart/control/MainActivity.java`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/AndroidManifest.xml`

然后重新执行：

```bash
npm run build
npx cap sync android
cd android
gradlew.bat assembleDebug
```

### 4. 横屏锁定不生效

浏览器中可能受安全策略限制，需要在真实设备或模拟器中测试。进入仪表盘页面后会自动调用 `ScreenOrientation.lock({ orientation: 'landscape' })`。

### 5. GPS 定位不工作

确保：
- 已授予 App 定位权限
- 在室外或能接收到 GPS 信号的环境测试
- 首页已调用 `useGPS()`

## GitHub 仓库

https://github.com/mouixong/kart-control-app

## 安全提示

请勿在代码仓库中提交 GitHub Token、签名密钥或其他敏感信息。如发现已暴露，请立即到 GitHub Settings 撤销并重新生成 Token。
