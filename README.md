# dsh-paddle-ocr

DSH 插件：为 Agnes-2.5-Flash 添加本地图片 OCR 识别能力

## 🎯 解决的问题

### 问题背景
DSH 的 Agnes-2.5-Flash 模型虽然支持图片理解，但有以下限制：
- ❌ 只能处理网络图片（URL），无法直接识别本地截图
- ❌ 用户上传的本地图片无法被模型理解
- ❌ 截图、本地文档扫描等场景无法使用

### 解决方案
本插件通过 PaddleOCR VL 1.6 为 DSH 添加本地图片 OCR 能力：
- ✅ **本地文件支持** - 用户上传的截图可直接识别
- ✅ **网络图片支持** - URL 图片也可识别
- ✅ **高精度文字识别** - 专门针对文字优化
- ✅ **完全免费** - Agnes 免费 + PaddleOCR 每日 20,000 页免费额度

---

## 🔧 实现方式

### 核心技术
- **Agnes-2.5-Flash** - DeepSeek 提供的免费文本模型（支持网络图片）
- **百度 PaddleOCR VL 1.6** - 免费 OCR API（支持本地文件 + URL）
- **DSH Cordis 插件系统** - 使用官方 API 注册工具和模型变体

### 工作流程
```
用户上传图片（本地或 URL）
    ↓
插件检测图片类型
    ↓
本地文件 → 上传到 PaddleOCR API → OCR 识别
网络图片 → 直接使用 Agnes 原生能力
    ↓
返回文字内容
    ↓
模型接收文本，回答问题
```

### 关键特性
- ✅ **本地文件支持** - 支持 PNG, JPEG, PDF, Word, Excel
- ✅ **网络图片支持** - 支持 HTTP/HTTPS URL
- ✅ **高精度识别** - 中文、英文、表格、公式
- ✅ **坐标定位** - 返回文字位置信息
- ✅ **完全免费** - 无额外费用

---

## 📦 安装方式

### 前置要求
- Node.js >= 22.19
- DSH >= 0.1.0-rc.6
- **PaddleOCR API Token**（免费申请）

### 申请 API Token

1. 访问 [百度 PaddleOCR API 申请页面](https://aistudio.baidu.com/paddleocr)
2. 注册/登录百度 AI Studio 账号
3. 申请 PaddleOCR VL API 权限（**免费**）
4. 获取 API Token（约需 1-3 个工作日审核）

**免费额度：每天 20,000 页次**

### 步骤 1：克隆项目
```bash
git clone https://github.com/tenglongbohai/dsh-paddle-ocr.git
cd dsh-paddle-ocr
```

### 步骤 2：安装依赖
```bash
pnpm install
```

### 步骤 3：配置 API Token
```bash
# 方式 1：环境变量（推荐）
export PADDLE_OCR_TOKEN="your_token_here"

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

---

## 🚀 使用方法

### 方式 1：工具调用
```javascript
// AI 会自动调用，或手动调用
await tools.paddle_ocr({
  image_path: "/path/to/local/image.png",  // 本地文件
  // 或
  image_path: "https://example.com/image.jpg",  // 网络图片
  prompt: "提取所有文字",
  return_bbox: true
});
```

### 方式 2：视觉模型变体
1. 刷新 DSH 网页
2. 在模型选择中找到 `agnes-2.5-flash (PaddleOCR)`
3. 上传图片，自动识别并回答问题

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

---

## 📋 API 说明

### paddle_ocr 工具

**参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| image_path | string | ✅ | 本地文件路径或网络 URL |
| prompt | string | ❌ | 识别提示词 |
| return_bbox | boolean | ❌ | 是否返回坐标，默认 true |

**支持的本地文件格式：**
- **图片**：PNG, JPEG, WEBP, GIF, BMP, TIFF, HEIC
- **文档**：PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

**错误处理：**
- 文件不存在：返回 `error: "文件不存在"`
- API 调用失败：返回 `error: "API 错误信息"`
- 识别超时：返回 `error: "OCR 超时"`
- 额度不足：返回 `error: "API 额度不足"`

---

## 💡 使用场景

### 场景 1：本地截图识别
- 用户上传本地截图
- PaddleOCR 识别文字内容
- Agnes 基于文字回答问题
- **解决 Agnes 不支持本地文件的限制**

### 场景 2：文档处理
- 上传 PDF/Word/Excel 文档
- 自动识别文字内容
- 基于内容进行问答
- **节省付费模型调用成本**

### 场景 3：批量处理
- 每日 20,000 页次免费额度
- 适合个人和小团队使用
- 可配合 Cron 任务自动处理

---

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

---

## 🎉 总结

**本插件弥补了 Agnes-2.5-Flash 只能处理网络图片的限制，让 DSH 用户能够：**
- ✅ 识别本地截图
- ✅ 处理本地文档
- ✅ 享受完全免费的 OCR 服务
- ✅ 获得高精度的文字识别能力

**技术栈：**
- Agnes-2.5-Flash：免费文本模型（支持网络图片）
- PaddleOCR VL 1.6：免费 OCR API（支持本地 + 网络）

---

## 📄 许可证

MIT License

## 🔗 相关链接

- [DSH 官方文档](https://github.com/deepseek-ai/dsh)
- [百度 PaddleOCR API](https://aistudio.baidu.com/paddleocr) - 免费申请
- [Agnes AI](https://agnes-ai.cn) - 免费模型
- [modlens 参考实现](https://github.com/liustack/modlens)
