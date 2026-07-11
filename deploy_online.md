# 🌐 解决方案一：网页端公网云部署指南

本项目是一个纯前端静态项目（HTML、CSS、JavaScript），不包含任何数据库和后端代码（所有项目数据均安全地保存在用户的浏览器本地缓存中）。这使得项目非常适合快速、免费地托管在任何静态网页部署平台上。

我们为您准备了三种主流的部署方案，您可以根据使用偏好选择：

---

## 📌 方案 1：使用 Netlify 拖拽部署（最快、最简单，适合零代码操作）
这是最快捷的方案，您甚至不需要使用 Git、GitHub 或命令行，直接把文件夹拖拽上去即可上线！

### 🚀 部署步骤：
1. 打开 [Netlify 官网](https://www.netlify.com/) 注册/登录账号。
2. 登录后，进入 Dashboard 仪表盘。
3. 找到 **“Add new site”** 下拉菜单，选择 **“Deploy manually”**（手动部署）。
4. 在拖拽区域，将包含本项目的整个物理文件夹 `Project management software` 拖入浏览器窗口。
5. 等待 5~10 秒，系统上传完毕后会自动生成一个免费的公网网址（例如 `https://your-site-name.netlify.app`）。
6. 您可以在 Netlify 控制面板的 `Site configuration` -> `Change site name` 中，自由修改为您喜欢的专属域名。

---

## 📌 方案 2：使用 Vercel 一键关联部署（推荐，适合持续更新）
如果您把项目托管在 GitHub 上，Vercel 会在您每次提交代码时，自动重新构建并刷新线上网站。

### 🚀 部署步骤：
1. 将项目代码推送到您个人的 GitHub 仓库中（例如命名为 `pmp-project-manager`）。
2. 打开 [Vercel 官网](https://vercel.com/) 并使用 GitHub 账号登录。
3. 点击 **“Add New”** -> **“Project”**。
4. 在 GitHub 列表中找到您的 `pmp-project-manager` 仓库，点击 **“Import”**。
5. 进入配置页面，所有参数（Framework Preset, Build Command, Output Directory）全部保持**默认设置（无需修改）**。
6. 点击底部的 **“Deploy”** 按钮。
7. 等待约 20 秒，您的专属网页应用就上线了！Vercel 会自动为您生成带有免费 SSL 安全证书的域名。

---

## 📌 方案 3：使用 GitHub Pages 自动部署（官方集成方案）
我们已在项目中预配置了 GitHub Actions 自动化工作流。只需将代码提交到 GitHub 即可自动激活网站。

### 🚀 部署步骤：
1. 将项目代码提交到您的 GitHub 仓库（主分支必须为 `main` ）。
2. 进入 GitHub 仓库页面，点击右上角的 **“Settings”**（设置）。
3. 在左侧菜单栏中找到 **“Pages”**。
4. 在 **Build and deployment** 下的 **Source** 中，确保选择为 **“GitHub Actions”**（而不是 Deploy from a branch）。
5. 每次您提交代码时，GitHub 会自动读取项目中的 `.github/workflows/deploy.yml` 脚本开始部署。
6. 您可以在仓库顶部的 **“Actions”** 标签页查看部署进度，完成后即可在页面提示的网址上访问该系统。
