/**
 * 表示模型客户端在初始化前发现了无效配置。
 *
 * 单独定义错误类型后，应用启动层可以区分“配置错误”和“远程 API 错误”，
 * 避免把缺少环境变量之类的问题误判为 DeepSeek 服务故障。
 */
export class ModelConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelConfigurationError";
  }
}
