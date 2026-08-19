# dsh-paddle-ocr

DSH 插件：为纯文本模型添加 PaddleOCR 视觉识别能力

## 🎯 解决的问题

### 问题背景
许多 LLM 提供商的文本模型不支持图片输入，导致用户在 DSH 中无法使用图片功能：
- ❌ Agnes-2.5-Flash 仅支持网络图片 URL，无法处理本地截图
- ❌ DeepSeek-V4 系列官方声明为纯文本模型
- ❌ MiniMax-M2.x 系列不支持图片输入
- ❌ GLM 纯文本模型（不带 V）不支持图片输入
- ❌ Mimo-v2.5-pro 是纯文本模型，不支持图片

### 解决方案
本插件通过 PaddleOCR VL 1.6 为纯文本模型添加视觉能力：
- ✅ **本地文件支持** - 用户上传的截图可直接识别
- ✅ **网络图片支持** - URL 图片也可识别
- ✅ **多提供商支持** - Agnes, DeepSeek, MiniMax, GLM, Mimo
- ✅ **智能检测** - 自动跳过多模态模型（如 GLM-4V, MiniMax-M3, Mimo-v2.5）
- ✅ **完全免费** - Agnes 免费 + PaddleOCR 每日 20,000 页免费额度

---

## 🔧 实现方式

### 核心技术
- **PaddleOCR VL 1.6** - 百度飞桨视觉语言模型
- **DSH Cordis 插件系统** - 使用官方 API 注册工具和模型变体
- **智能检测** - 自动判断模型是否已支持图片

### 工作流程
```
用户上传图片（本地或 URL）
    ↓
插件检测模型类型
    ↓
纯文本模型 → 调用 PaddleOCR → OCR 识别
多模态模型 → 跳过（已有视觉能力）
    ↓
返回文字内容
    ↓
模型接收文本，回答问题
```

### 关键特性
- ✅ **多提供商支持** - 自动适配 Agnes, DeepSeek, MiniMax, GLM, Mimo
- ✅ **智能过滤** - 自动跳过多模态模型（GLM-4V/5V, MiniMax-M3, Mimo-v2.5 等）
- ✅ **本地文件支持** - PNG, JPEG, PDF, Word, Excel
- ✅ **网络图片支持** - HTTP/HTTPS URL
- ✅ **高精度识别** - 中文、英文、表格、公式
- ✅ **坐标定位** - 返回文字位置信息

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
2. 在模型选择中找到 `模型名 (PaddleOCR)` 变体
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

## 📋 支持的模型

### ✅ 支持（纯文本模型，会创建视觉变体）
| 提供商 | 模型 | 说明 |
|--------|------|------|
| **Agnes** | 2.5-Flash | 免费文本模型 |
| **DeepSeek** | V4, V4-Pro, V4-Flash | 官方声明为纯文本 |
| **MiniMax** | M2.7, M2.5, M2.1, M2 | 纯文本版本 |
| **GLM** | GLM-5.x, GLM-4.x（不带V） | 纯文本版本 |
| **Mimo** | v2.5-pro | 纯文本版本 |

### ❌ 自动跳过（已支持图片的多模态模型）
| 提供商 | 模型 | 原因 |
|--------|------|------|
| **MiniMax** | M3 | 已是多模态模型 |
| **GLM** | GLM-4V, GLM-5V 系列 | 名称带 V，已是多模态 |
| **Mimo** | v2.5 | 已是多模态模型 |
| **DeepSeek** | V4.5（如有） | 如支持图片则跳过 |

---

## 📝 GLM 模型识别规则

根据智谱 AI 官方文档，GLM 模型命名规则非常清晰：

| 规则 | 类型 | 示例 | 插件行为 |
|------|------|------|----------|
| **不带 V** | 纯文本 | GLM-4-Flash, GLM-5.3 | ✅ 创建视觉变体 |
| **带 V** | 多模态 | GLM-4V-Flash, GLM-5V-Turbo | ❌ 自动跳过 |

**一眼区分法：**
- 名称中有 `V` → 视觉模型（多模态）
- 名称中无 `V` → 文本模型（纯文本）

---

## 📝 API 说明

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
- Agnes/DeepSeek/GLM 等基于文字回答问题
- **解决纯文本模型不支持本地文件的限制**

### 场景 2：批量文档处理
- 上传 PDF/Word/Excel 文档
- 自动识别文字内容
- 基于内容进行问答
- **节省付费多模态模型调用成本**

### 场景 3：多模型适配
- 插件自动检测所有配置的提供商
- 纯文本模型自动创建视觉变体
- 多模态模型自动跳过
- **无需手动配置每个模型**

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

### 添加新提供商
在 `lib/index.js` 的 `providers` 数组中添加：
```javascript
const providers = [
  'agnes-ai',
  'deepseek',
  'minimax',
  'glm',
  'mimo',
  'your-provider'  // 添加新的提供商
];
```

---

## 🎉 总结

**本插件为纯文本 LLM 添加 PaddleOCR 视觉能力，让 DSH 用户能够：**
- ✅ 识别本地截图和文档
- ✅ 使用免费模型获得视觉体验
- ✅ 自动适配多个提供商
- ✅ 智能跳过已支持图片的模型

**技术栈：**
- PaddleOCR VL 1.6：免费 OCR API（支持本地 + 网络）
- DSH Cordis：官方插件系统
- 智能检测：自动适配纯文本/多模态模型

---

## 📄 许可证

MIT License

## 🔗 相关链接

- [DSH 官方文档](https://github.com/deepseek-ai/dsh)
- [百度 PaddleOCR API](https://aistudio.baidu.com/paddleocr) - 免费申请
- [智谱 AI 模型文档](https://docs.bigmodel.cn) - GLM 模型分类
- [modlens 参考实现](https://github.com/liustack/modlens)
