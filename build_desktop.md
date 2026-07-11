# 🖥️ 解决方案二：本地 Electron 桌面客户端打包指南

通过 Electron 框架，我们可以将本项目的 HTML/CSS/JS 网页打包成一个原生的 Windows 桌面客户端应用（`.exe`）。该程序在打包完成后是**完全独立**的，不需要用户电脑安装 Node.js、不需要运行终端，双击即可完全离线运行。

我们已经在项目中配置好了所有的脚本与打包文件设定。

---

## 🛠️ 第一步：首次运行前安装依赖环境
在开始打包前，您需要确保您的开发电脑上安装了 Node.js（如果未安装，请访问 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本）。

打开 PowerShell 终端，进入项目文件夹目录，并运行以下命令安装打包所需的 Electron 依赖项：
```powershell
npm install
```
*(注意：该步骤仅在您首次或修改依赖后运行一次即可，它会在本地生成 `node_modules` 文件夹。)*

> [!WARNING]
> **💡 Windows 脚本执行策略报错解决（重要提示）**
> 如果您在运行 `npm` 命令时遇到类似 `无法加载文件...因为在此系统上禁止运行脚本` 的报错（PSSecurityException），这是因为 Windows 默认限制了 PowerShell 脚本的执行。您可以通过以下两种简单方式解决：
> 
> *   **方式一（最简单，直接规避报错）**：在所有命令中将 `npm` 改写为 **`npm.cmd`**（运行系统指令而非 PowerShell 脚本）。例如：
>     *   安装依赖：`npm.cmd install`
>     *   开发测试：`npm.cmd run electron:dev`
>     *   打包编译：`npm.cmd run electron:build`
> *   **方式二（修改执行策略）**：在 PowerShell 窗口中运行以下命令以允许运行本地脚本（不需要管理员权限）：
>     ```powershell
>     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
>     ```

---

## 🏃 第二步：本地桌面端测试启动
在正式打包成 `.exe` 前，您可以在终端运行以下命令，启动桌面测试窗口预览效果：
```powershell
npm run electron:dev
```
此时系统会弹出一个独立的 **BOSCH 项目管理控制中心** 窗口。在该窗口中，您可以像使用正式软件一样测试所有页面的跳转、甘特图编辑及团队汇报树渲染，控制台不会产生跨域限制。

---

## 📦 第三步：构建绿色便携版 `.exe` 软件
测试通过后，您可以在终端中运行以下命令，开始进行自动化打包编译：
```powershell
npm run electron:build
```

### 📋 编译输出说明：
1. 打包程序启动后，会自动化下载打包环境并进行编译整合。
2. 编译完成后，项目根目录下会自动生成一个名为 `dist-desktop/` 的文件夹。
3. 进入 `dist-desktop/`，您会找到一个名为 **`BOSCH项目管理控制中心.exe`** (或带有版本号的 exe) 的可执行文件。

---

## 🚀 如何在其他电脑上运行？
您只需要将生成的 **`BOSCH项目管理控制中心.exe`** 这个单文件拷贝或发送到**任何其他 Windows 电脑**上：
*   **无需安装** 任何额外环境或 Node.js。
*   **无需运行命令行**。
*   **直接双击** 该 `.exe` 即可完美加载，并且支持离线运行、支持数据本地自动保存及数据备份导出。
