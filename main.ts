import { getModelClient } from "./model/client";

async function main(): Promise<void> {
  const client = getModelClient();

  const response = await client.messages.create({
    model: process.env.MODEL_API_MODEL ?? "deepseek-v4-flash",
    max_tokens: 1024,
    system: "回答问题简洁高效，不过过多表达。",
    messages: [
      {
        role: "user",
        content: "你好",
      },
    ],
  });

  // content 可能包含文本、工具调用等不同类型的数据块。
  const answer = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  console.log("模型回复:", answer);
}

main().catch((error: unknown) => {
  console.error("模型调用失败：", error);
  process.exitCode = 1;
});