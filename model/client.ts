import Anthropic from "@anthropic-ai/sdk";

import {
  loadModelClientConfig,
  type ModelClientConfig,
} from "./config";
import { ModelConfigurationError } from "./errors";

/**
 * DeepSeek 提供 Anthropic Messages API 兼容接口。
 *
 * 这里使用类型别名隔离第三方 SDK。正常情况下，只有 provider 层需要直接操作
 * ModelClient，Agent 和业务代码不应依赖 Anthropic SDK 的具体类型。
 */
export type ModelClient = Anthropic;

const DEEPSEEK_ORIGIN = "https://api.deepseek.com";
const DEEPSEEK_ANTHROPIC_BASE_URL = "https://api.deepseek.com/anthropic";

/**
 * 创建一个访问 DeepSeek Anthropic 兼容接口的客户端。
 *
 * 本函数只负责连接相关能力：
 * - 使用 API Key 完成认证，SDK 会自动发送 x-api-key 请求头；
 * - 配置 Anthropic 兼容接口的 base URL；
 * - 设置单次请求超时；
 * - 设置网络错误、429 和 5xx 等临时错误的 SDK 级重试次数。
 *
 * model、messages、system、tools、thinking 等属于单次模型请求参数，
 * 应由 provider 层提供，不能固定在 client 中。
 */
export function createModelClient(config: ModelClientConfig): ModelClient {
  return new Anthropic({
    apiKey: config.apiKey,
    baseURL: normalizeAnthropicBaseURL(config.baseURL),
    timeout: config.timeout,
    maxRetries: config.maxRetries,
  });
}

let sharedClient: ModelClient | undefined;

/**
 * 返回当前 Node.js 进程共享的模型客户端。
 *
 * 客户端采用惰性初始化：第一次使用时才读取环境变量并创建实例。
 * 这样既避免每次请求重复创建客户端，也不会在单纯导入模块时立即读取配置。
 */
export function getModelClient(): ModelClient {
  if (!sharedClient) {
    const config = loadModelClientConfig();
    sharedClient = createModelClient(config);
  }

  return sharedClient;
}

/**
 * 将配置中的地址规范化为 Anthropic SDK 所需的 base URL。
 *
 * 为了兼容已有配置，以下两种写法都会得到正确结果：
 * - https://api.deepseek.com
 * - https://api.deepseek.com/anthropic
 *
 * Anthropic SDK 会在 base URL 后追加 /v1/messages，因此这里不能直接配置
 * 完整的 /v1/messages 请求地址。
 */
function normalizeAnthropicBaseURL(baseURL: string): string {
  const trimmedURL = baseURL.trim().replace(/\/+$/, "");

  if (!trimmedURL) {
    return DEEPSEEK_ANTHROPIC_BASE_URL;
  }

  if (trimmedURL === DEEPSEEK_ORIGIN) {
    return DEEPSEEK_ANTHROPIC_BASE_URL;
  }

  let parsedURL: URL;

  try {
    parsedURL = new URL(trimmedURL);
  } catch {
    throw new ModelConfigurationError(
      `MODEL_API_URL 不是有效的 URL："${baseURL}"。`,
    );
  }

  if (parsedURL.protocol !== "https:" && parsedURL.hostname !== "localhost") {
    throw new ModelConfigurationError(
      "MODEL_API_URL 必须使用 HTTPS；本地 localhost 调试除外。",
    );
  }

  return trimmedURL;
}
