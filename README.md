# Minecraft MOTD Scanner

一个轻量级静态网页，用于查询 Minecraft Java 与 Bedrock 服务器的 MOTD、在线人数和版本信息，并支持 V1/V2 两种界面主题。

## 使用

直接打开 `index.html` 即可使用。页面通过公开的服务器状态接口查询信息，因此需要网络连接。

## 项目结构

- `index.html`：页面入口
- `assets/css/`：页面样式与主题
- `assets/js/`：查询、主题切换和背景效果
- `assets/vendor/`：页面使用的前端依赖与字体

本仓库只包含公开网站部分。`noapi/` 本地测试工具、`.vscode/` 工作区配置、密钥、日志及生成文件均不纳入版本控制。