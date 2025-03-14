# Prompt生成平台

基于AI驱动的高质量Prompt生成平台，支持代码需求Prompt和图片Prompt的智能生成。

[![GitHub stars](https://img.shields.io/github/stars/Dear-Tao/prompt-tips.svg?style=flat&color=green)](https://github.com/Dear-Tao/prompt-tips)

## 功能特性

- 🚀 支持代码需求Prompt生成
- 🎨 支持图片Prompt生成
- 💬 实时流式响应
- 🔄 历史记录保存
- 📋 一键复制和导出
- 🌐 内容翻译功能
- 🧠 思考过程展示
- 📱 响应式移动端适配
- ⚙️ 灵活的API配置

## 技术架构

- 前端框架：Vue 3
- UI组件库：Element Plus
- 构建工具：Vite
- API集成：
  - 月之暗面 API
  - 阿里百炼(DeepSeek) API

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 生产环境构建

```bash
npm run build
```

## 使用说明

1. API配置
   - 点击右上角「API配置」按钮
   - 输入并保存API密钥
   - 系统会自动验证API密钥的有效性
   - 获取API密钥：
     - [月之暗面](https://platform.moonshot.cn/console/api-keys)
     - [阿里百炼(DeepSeek)](https://bailian.console.aliyun.com/?apiKey=1#/api-key)

2. 生成代码Prompt
   - 选择「代码需求Prompt」标签页
   - 输入您的代码需求描述
   - 点击生成按钮获取专业Prompt

3. 生成图片Prompt
   - 选择「图片Prompt」标签页
   - 填写图片描述、风格和尺寸
   - 点击生成按钮获取优化的图片Prompt

4. 结果处理
   - 支持实时查看生成结果
   - 可一键复制生成的Prompt
   - 支持导出保存
   - 支持中英文内容翻译

5. 思考过程
   - 查看AI助手的思考过程
   - 可折叠/展开思考内容
   - 深入了解生成逻辑

## 特性说明

### 流式响应

平台采用流式响应技术，确保生成过程的实时反馈，提供更好的交互体验。自动滚动功能确保您始终能看到最新内容。

### 多模型支持

- Moonshot-v1-32k：支持长文本处理
- DeepSeek系列模型：提供多样化的生成能力
- 可扩展支持更多AI模型

### 本地存储

自动保存历史会话记录，确保数据不会丢失，支持连续对话。包括翻译状态和思考过程的保存。

### 内容翻译

- 支持中英文双向翻译
- 一键切换原文/译文
- 适用于文本和图片Prompt
- 智能处理代码内容翻译

### 移动端适配

- 响应式设计，适配各种屏幕尺寸
- 优化的移动端交互体验
- 合理的布局调整和字体大小

## 开发说明

### 项目结构

```
src/
  ├── api/        # API接口
  ├── views/      # 页面组件
  ├── router/     # 路由配置
  ├── App.vue     # 根组件
  └── main.js     # 入口文件
```

### 核心功能实现

1. API集成
   - 支持多API提供商
   - 统一的请求处理
   - 密钥安全存储

2. 响应式设计
   - 基于Vue 3组合式API
   - Element Plus组件库
   - 流畅的用户界面

3. 翻译功能
   - 集成免费翻译API
   - 智能语言检测
   - 状态管理与本地存储

4. DOM观察器
   - 使用MutationObserver监听内容变化
   - 自动滚动到最新内容
   - 优化用户体验

## 注意事项

- API密钥安全：请妥善保管您的API密钥
- 使用限制：请遵守API提供商的使用规范
- 数据安全：所有数据均存储在本地
- 翻译功能：翻译API可能有调用限制，如遇失败请稍后重试

## 贡献指南

欢迎提交Issue和Pull Request，一起改进这个项目！

## 许可证

[MIT License](LICENSE)