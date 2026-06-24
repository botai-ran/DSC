import "dotenv/config";

import { ModelConfigurationError } from "./errors";

/**
 * 只包含建立 DeepSeek API 连接所需的配置。
 *
 * MODEL_API_MODEL 不属于这里：模型选择是一次请求的策略，
 * 应由 provider 或更上层的 service 决定。
 */
export interface ModelClientConfig {
  apiKey: string;
  baseURL: string;
  timeout: number;
  maxRetries: number;
}

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * 从环境变量中读取并校验客户端配置。
 *
 * env 参数使测试可以传入一份假的环境变量，而不需要修改全局 process.env。
 */
export function loadModelClientConfig(
  env: NodeJS.ProcessEnv = process.env,
): ModelClientConfig {
  const apiKey = env.MODEL_API_KEY?.trim();

  if (!apiKey) {
    throw new ModelConfigurationError(
      "缺少 MODEL_API_KEY，无法创建 DeepSeek 客户端。",
    );
  }

  return {
    apiKey,
    baseURL: env.MODEL_API_URL?.trim() || DEFAULT_BASE_URL,
    timeout: readNonNegativeInteger(
      env.MODEL_API_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
      "MODEL_API_TIMEOUT_MS",
    ),
    maxRetries: readNonNegativeInteger(
      env.MODEL_API_MAX_RETRIES,
      DEFAULT_MAX_RETRIES,
      "MODEL_API_MAX_RETRIES",
    ),
  };
}

function readNonNegativeInteger(
  rawValue: string | undefined,
  defaultValue: number,
  variableName: string,
): number {
  if (rawValue === undefined || rawValue.trim() === "") {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 0) {
    throw new ModelConfigurationError(
      `${variableName} 必须是非负整数，当前值为 "${rawValue}"。`,
    );
  }

  return value;
}
