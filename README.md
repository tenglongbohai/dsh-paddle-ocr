# dsh-paddle-ocr

DSH 插件：为 Agnes-2.5-Flash 免费模型添加 PaddleOCR 视觉识别能力，实现 DeepSeek Harness 完整功能

## 🎯 核心价值

### 问题背景
DSH 的视觉模型（如 DeepSeek-V4）需要付费，而 Agnes-2.5-Flash 是免费模型但无法识别图片：
- ❌  DeepSeek-V4 等视觉模型需要付费
- ❌  Agnes-2.5-Flash 免费但只能处理文本
- ❌  用户无法在 DSH 中正常使用图片功能

### 解决方案
本插件通过 PaddleOCR 为 Agnes-2.5-Flash 添加视觉能力：
- ✅ **完全免费** - Agnes-2.5-Flash + PaddleOCR 免费额度
- ✅ **功能完整** - 支持图片、PDF、Word、Excel 识别
- ✅ **无缝集成** - 自动创建视觉模型变体，用户体验一致
- ✅ **高精度** - 百度 PaddleOCR VL 1.6，支持中文、表格、公式

### 成本对比

| 方案 | 模型 | 费用 | 说明 |
|------|------|------|------|
| 官方方案 | DeepSeek-V4 | 付费 | 按调用量计费 |
| 本插件方案 | Agnes-2.5-Flash + PaddleOCR | **免费** | Agnes 免费 + PaddleOCR 每日 20,000 页次 |

## 🔧 实现方式

### 核心技术
- **Agnes-2.5-Flash** - DeepSeek 提供的免费文本模型
- **百度 PaddleOCR VL 1.6** - 免费 OCR API（每日 20,000 页次）
- **DSH Cordis 插件系统** - 使用官方 API 注册工具和模型变体
- **流式处理** - 在模型调用时实时转换图片为文本

### 工作流程
```
用户上传图片
    ↓
DSH 检测到 agnes-2.5-flash (PaddleOCR) 视觉变体
    ↓
插件拦截图片附件
    ↓
调用 PaddleOCR VL API（免费）
    ↓
返回文字内容 + 坐标信息
    ↓
Agnes-2.5-Flash 接收文本，回答问题
    ↓
用户获得完整的视觉对话体验（完全免费）
```

### 关键特性
- ✅ **完全免费** - Agnes 模型免费 + PaddleOCR 每日 20,000 页次免费额度
- ✅ **多格式支持** - PNG, JPEG, PDF, Word, Excel, PowerPoint
- ✅ **高精度识别** - 中文、英文、表格、公式
- ✅ **坐标定位** - 返回文字位置信息
- ✅ **无缝体验** - 与普通视觉模型使用方式一致

## 📦 安装方式

### 前置要求
- Node.js >= 22.19
- DSH >= 0.1.0-rc.6
- **Agnes API Token**（免费申请）
- **PaddleOCR API Token**（免费申请）

### 申请 API Tokens（免费）

#### 1. Agnes API Token
1. 访问 [Agnes API 控制台](https://platform.agnes-ai.cn/settings/apiKeys)
2. 注册/登录账号
3. 创建 API Key
4. 复制 Token

#### 2. PaddleOCR API Token
1. 访问 [百度 PaddleOCR API 申请页面](https://aistudio.baidu.com/paddleocr)
2. 注册/登录百度 AI Studio 账号
3. 申请 PaddleOCR VL API 权限（**免费**）
4. 获取 API Token（约需 1-3 个工作日审核）

**免费额度：**
- Agnes-2.5-Flash：完全免费
- PaddleOCR：每天 20,000 页次免费

### 步骤 1：克隆项目
```bash
git clone https://github.com/yourusername/dsh-paddle-ocr.git
cd dsh-paddle-ocr
```

### 步骤 2：安装依赖
```bash
pnpm install
```

### 步骤 3：配置 API Tokens
```bash
# 方式 1：环境变量（推荐）
export AGNES_AI_API_KEY="your_agnes_token_here"
export PADDLE_OCR_TOKEN="your_paddleocr_token_here"

# 方式 2：修改代码
# 编辑 lib/index.js，替换 TOKEN 常量
const TOKEN = process.env.PADDLE_OCR_TOKEN || "your_token_here";
```

### 步骤 4：安装到 DSH
```bash
cd /root/.dsh/profiles/web
pnpm add file:/path/to/dsh-paddle-ocr
```

### 步骤 5：更新配置
编辑 `/root/.dsh/profiles/web/package.json`，添加：
```json
{
  "dsh": {
    "profile": {
      "bundles": [
        // ... 其他插件
        "dsh-paddle-ocr"
      ]
    },
    "dependencies": {
      // ... 其他依赖
      "dsh-paddle-ocr": "file:/path/to/dsh-paddle-ocr"
    }
  }
}
```

### 步骤 6：重启 DSH
```bash
systemctl restart dsh
```

## 🚀 使用方法

### 方式 1：工具调用
```javascript
// AI 会自动调用，或手动调用
await tools.paddle_ocr({
  image_path: "/path/to/image.png",  // 支持图片、PDF、Word、Excel
  prompt: "提取所有文字",
  return_bbox: true
});
```

### 方式 2：视觉模型变体（推荐）
1. 刷新 DSH 网页
2. 在模型选择中找到 **`agnes-2.5-flash (PaddleOCR)`**
3. 上传图片/文档，自动识别并回答问题
4. **完全免费！**

### 返回格式
```json
{
  "status": "success",
  "result": "识别的文字内容...",
  "blocks": [
    {
      "text": "文字内容",
      "bbox": [x1, y1, x2, y2],
      "type": "text|paragraph_title|inline_formula"
    }
  ],
  "model": "PaddleOCR-VL-1.6"
}
```

## 📋 API 说明

### paddle_ocr 工具

**参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| image_path | string | ✅ | 文件路径或 URL（支持图片、PDF、Word、Excel） |
| prompt | string | ❌ | 识别提示词 |
| return_bbox | boolean | ❌ | 是否返回坐标，默认 true |

**支持的文件类型：**
- **图片**：PNG, JPEG, WEBP, GIF, BMP, TIFF, HEIC
- **文档**：PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

**错误处理：**
- 文件不存在：返回 `error: "文件不存在"`
- API 调用失败：返回 `error: "API 错误信息"`
- 识别超时：返回 `error: "OCR 超时"`
- 额度不足：返回 `error: "API 额度不足"`

## 🔍 故障排查

### 问题 1：插件未加载
```bash
# 检查日志
tail -f /var/log/dsh.log | grep paddle

# 检查安装
ls -la /root/.dsh/profiles/web/node_modules/ | grep paddle
```

### 问题 2：视觉模型未出现
- 确认 `registerAdapter` 调用成功
- 检查 DSH 日志中的 `[dsh-paddle-ocr] Vision wrapper registered` 消息

### 问题 3：OCR 识别失败
- 检查 API Token 是否正确
- 确认网络连接正常
- 查看 PaddleOCR API 状态和额度
- 确认文件格式支持

### 问题 4：API 额度不足
- 访问 [PaddleOCR 控制台](https://aistudio.baidu.com/paddleocr) 查看用量
- 等待次日额度重置（每天 20,000 页次）
- 或申请商业版 API

## 💡 使用场景

### 场景 1：学生党
- 拍照上传作业/试卷
- Agnes-2.5-Flash 免费模型回答问题
- PaddleOCR 识别题目内容
- **完全免费，无需付费订阅**

### 场景 2：文档处理
- 上传 PDF/Word/Excel 文档
- 自动识别文字内容
- 基于内容进行问答
- **节省付费模型调用成本**

### 场景 3：批量处理
- 每日 20,000 页次免费额度
- 适合个人和小团队使用
- 可配合 Cron 任务自动处理

## 📝 开发指南

### 项目结构
```
dsh-paddle-ocr/
├── lib/
│   └── index.js      # 插件主代码
├── package.json      # 包配置
├── cordis.patch.yml  # DSH 插件配置
├── README.md         # 使用文档
└── .gitignore        # Git 忽略配置
```

### 本地测试
```bash
# 语法检查
node --check lib/index.js

# 运行测试
pnpm test
```

### 贡献指南
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送分支
5. 创建 Pull Request

## 🎉 总结

**本插件让 Agnes-2.5-Flash 免费模型获得视觉能力，实现 DeepSeek Harness 的完整功能，完全免费！**

- ✅ Agnes-2.5-Flash 免费模型
- ✅ PaddleOCR 每日 20,000 页次免费额度
- ✅ 支持图片、PDF、Word、Excel
- ✅ 无缝集成 DSH，用户体验一致
- ✅ 无需付费订阅，适合个人和小团队

## 📄 许可证

MIT License

## 🔗 相关链接

- [DSH 官方文档](https://github.com/deepseek-ai/dsh)
- [Agnes API 控制台](https://platform.agnes-ai.cn/settings/apiKeys) - 免费申请 API Key
- [百度 PaddleOCR API](https://aistudio.baidu.com/paddleocr) - 免费申请 OCR Token
- [modlens 参考实现](https://github.com/liustack/modlens)
