# Minecraft MOTD 检测

面向 Minecraft Java 和 Bedrock 服务器的静态状态查询页面，可查看服务器在线状态、MOTD、在线人数、版本及地址信息。界面提供 V1/V2 两种主题，并记住用户的主题选择。

## 使用

用浏览器打开 `index.html`，输入服务器域名或 `IP:端口`，选择 Java 或 Bedrock 后开始检测。

页面请求 [mcsrvstat.us](https://mcsrvstat.us/) 的公开状态 API，因此检测时需要联网；输入的服务器地址会发送给该服务。

这是纯静态前端，不需要安装 Node.js 或配置后端。也可以将仓库部署到任意静态网站托管服务。

## 目录

- `index.html`：页面结构和表单
- `assets/css/`：V2 主样式与 V1 主题
- `assets/js/`：服务器查询、主题切换和动态背景
- `assets/vendor/`：页面使用的 UIkit 与字体资源

## 仓库范围

本 GitHub 仓库只发布公开网站。`noapi/` 是本地独立测试工具，按项目维护者要求不上传；`.vscode/` 工作区配置以及日志、密钥和构建产物也已通过 `.gitignore` 排除。

因此，在 GitHub 仓库中看不到 `noapi/` 是预期行为。