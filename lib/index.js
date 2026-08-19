// dsh-paddle-ocr: PaddleOCR VL integration for DSH
// 支持文字位置识别

// ⚠️ 请在这里配置你的 API Token
const TOKEN = process.env.PADDLE_OCR_TOKEN || "YOUR_API_TOKEN_HERE";
const API_URL = "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs";
const MODEL = "PaddleOCR-VL-1.6";

export const name = 'dsh-paddle-ocr';
export const inject = ['tools', 'llm'];

export function apply(ctx) {
  // 1. 注册 OCR 工具（带坐标）
  ctx.tools.register({
    name: 'paddle_ocr',
    description: '使用 PaddleOCR VL 识别图片中的文字和位置。支持中文、英文、表格、公式识别。返回文字内容和坐标信息。',
    parameters: {
      type: 'object',
      properties: {
        image_path: {
          type: 'string',
          description: '图片文件路径或 URL'
        },
        prompt: {
          type: 'string',
          description: '可选：识别提示词'
        },
        return_bbox: {
          type: 'boolean',
          description: '是否返回文字边界框坐标，默认 true'
        }
      },
      required: ['image_path']
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          result: { type: 'string' },
          blocks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                bbox: { type: 'array', items: { type: 'number' } },
                type: { type: 'string' }
              }
            }
          },
          error: { type: 'string' },
          model: { type: 'string' }
        }
      },
      render: (_args, value) => {
        if (value.error) {
          return [{ type: 'text', text: `❌ OCR 失败：${value.error}` }];
        }
        
        let text = `📷 OCR 识别结果：\n\n${value.result || '识别完成'}`;
        
        if (value.blocks && value.blocks.length > 0) {
          text += '\n\n📍 文字位置：\n';
          value.blocks.slice(0, 10).forEach((block, i) => {
            const preview = block.text.substring(0, 30).replace(/\n/g, ' ');
            text += `${i + 1}. [${block.bbox.join(',')}] ${block.type}: ${preview}...\n`;
          });
          if (value.blocks.length > 10) {
            text += `\n... 共 ${value.blocks.length} 个文字块`;
          }
        }
        
        return [{ type: 'text', text }];
      }
    },
    execute: async (args) => {
      try {
        const result = await recognizeImage(args.image_path, args.prompt || '');
        const returnBbox = args.return_bbox !== false;
        
        return {
          status: 'success',
          result: result.text,
          blocks: returnBbox ? result.blocks : null,
          model: MODEL
        };
      } catch (error) {
        return {
          status: 'error',
          error: error.message
        };
      }
    }
  });

  // 2. 注册视觉模型变体
  if (typeof ctx.llm?.registerAdapter !== 'function') {
    console.warn('[dsh-paddle-ocr] registerAdapter not available');
    return;
  }

  const upstreamProvider = 'agnes-ai';
  const wrapperProviderId = 'paddle-ocr-vision';

  const withVision = (info, providerId) => {
    const inputModalities = Array.isArray(info?.inputModalities) ? [...info.inputModalities] : []
    if (!inputModalities.includes('text')) inputModalities.unshift('text')
    if (!inputModalities.includes('image')) inputModalities.push('image')
    return { ...info, provider: providerId, inputModalities }
  }

  const shouldWrap = (info) => {
    if (Array.isArray(info?.inputModalities) && info.inputModalities.includes('image')) return false
    return true
  }

  try {
    ctx.llm.registerAdapter([wrapperProviderId], {
      providerInfo(provider) {
        return { id: provider, name: 'PaddleOCR Vision' };
      },
      providerRetryPolicy() {
        return undefined;
      },
      async listModels(provider, signal) {
        try {
          const models = await ctx.llm.listModels(upstreamProvider, signal);
          return models
            .filter(shouldWrap)
            .map(model => ({
              ...withVision(model, provider),
              name: `${model.name || model.id} (PaddleOCR)`
            }));
        } catch (error) {
          console.error('[dsh-paddle-ocr] Failed to list models:', error);
          return [];
        }
      },
      async resolveModel(provider, model, signal) {
        try {
          const info = await ctx.llm.resolveModelInfo(upstreamProvider, model, signal);
          if (!shouldWrap(info)) {
            throw new Error(`model "${model}" is outside the PaddleOCR vision wrap scope`);
          }
          return { ...withVision(info, provider), id: model };
        } catch (error) {
          console.error('[dsh-paddle-ocr] Failed to resolve model:', error);
          throw error;
        }
      },
      async *stream(options) {
        try {
          const converted = await convertImagesToEvidence(ctx, options.messages, options.signal);
          yield* ctx.llm.stream({ ...options, provider: upstreamProvider, messages: converted });
        } catch (error) {
          console.error('[dsh-paddle-ocr] Stream error:', error);
          throw error;
        }
      }
    });
    console.log(`[dsh-paddle-ocr] Vision wrapper registered: ${wrapperProviderId}`);
  } catch (error) {
    console.error(`[dsh-paddle-ocr] Failed to register: ${error.message}`);
  }
}

async function convertImagesToEvidence(ctx, messages, signal) {
  return Promise.all(messages.map(async msg => {
    if (msg.role !== 'user' || !Array.isArray(msg.content)) return msg;
    const newContent = [];
    for (const part of msg.content) {
      if (part.type === 'image') {
        try {
          const imageUrl = part.image_url || part.path;
          const ocrResult = await recognizeImage(imageUrl);
          newContent.push({ type: 'text', text: `[图片内容]\n${ocrResult.text}` });
        } catch (error) {
          newContent.push({ type: 'text', text: `[图片识别失败: ${error.message}]` });
        }
      } else {
        newContent.push(part);
      }
    }
    return { ...msg, content: newContent };
  }));
}

// ===== OCR 识别函数 =====

async function recognizeImage(inputPath, prompt = '') {
  let jobId;
  
  if (inputPath.startsWith('http')) {
    jobId = await submitJob(inputPath);
  } else {
    jobId = await submitFile(inputPath);
  }
  
  const result = await pollResult(jobId);
  return parseResult(result, prompt);
}

async function submitJob(fileUrl) {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      model: MODEL, 
      fileUrl,
      optionalPayload: { 
        useDocOrientationClassify: true,
        useDocUnwarping: true,
        useChartRecognition: false 
      }
    })
  });
  const data = await resp.json();
  if (data.code !== 0) throw new Error(data.msg || 'API 错误');
  return data.data.jobId;
}

async function submitFile(filePath) {
  const fs = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  
  const tempDir = join(tmpdir(), 'dsh-ocr', Date.now().toString());
  await fs.mkdir(tempDir, { recursive: true });
  
  const fileName = filePath.split('/').pop() || 'image.png';
  const destPath = join(tempDir, fileName);
  
  const source = await fs.open(filePath, 'r');
  const dest = await fs.open(destPath, 'w');
  const buffer = await source.readFile();
  await dest.writeFile(buffer);
  await source.close();
  await dest.close();
  
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('model', MODEL);
  form.append('file', await fs.readFile(destPath));
  
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: form
  });
  
  const data = await resp.json();
  if (data.code !== 0) throw new Error(data.msg || 'API 错误');
  return data.data.jobId;
}

async function pollResult(jobId) {
  const startTime = Date.now();
  while (Date.now() - startTime < 180000) {
    await new Promise(r => setTimeout(r, 3000));
    const resp = await fetch(`${API_URL}/${jobId}`, { 
      headers: { 'Authorization': `Bearer ${TOKEN}` } 
    });
    const data = await resp.json();
    const state = data.data?.state;
    
    if (state === 'done') return data.data;
    if (state === 'failed') throw new Error(data.data?.errorMsg || 'OCR 失败');
  }
  throw new Error('OCR 超时');
}

async function parseResult(resultData, prompt) {
  const jsonUrl = resultData.resultUrl?.jsonUrl;
  if (!jsonUrl) {
    return { text: `识别完成 (Job ID: ${resultData.jobId})`, blocks: [] };
  }
  
  // 获取详细结果
  const resp = await fetch(jsonUrl);
  const text = await resp.text();
  const lines = text.trim().split('\n');
  
  let resultText = '';
  const blocks = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      const res = parsed.result;
      
      if (res?.layoutParsingResults) {
        for (const page of res.layoutParsingResults) {
          // 提取 markdown 文本
          const md = page.markdown?.text;
          if (md) {
            resultText += md + '\n\n';
          }
          
          // 提取坐标信息
          const pruned = page.prunedResult;
          if (pruned?.parsing_res_list) {
            for (const block of pruned.parsing_res_list) {
              blocks.push({
                text: block.block_content,
                bbox: block.block_bbox,
                type: block.block_label
              });
            }
          }
        }
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  return { text: resultText.trim(), blocks };
}
