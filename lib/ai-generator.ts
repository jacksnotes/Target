import { getApiBaseUrl } from "@/constants/oauth";
import { ExecutionType, Task } from "./types";

interface GenerationResult {
  flashcard: { cards: { front: string; back: string }[] };
  reading: { title: string; content: string; wordCount: number };
  quiz: { questions: { question: string; options: string[]; answerIndex: number }[] };
  coding: { language: string; instructions: string; template: string; expectedOutput: string };
  checklist: any;
  practice: {
    title: string;
    scenario: string;
    instructions: string;
    prompts: { cue: string; target?: string; sampleAnswer?: string; tips?: string[] }[];
    criteria?: string[];
    deliverable?: string;
    durationMinutes?: number;
  };
}

function parseGeneratedJson<T>(jsonText: string): T {
  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    const repaired = jsonText.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    if (repaired !== jsonText) {
      return JSON.parse(repaired) as T;
    }
    throw error;
  }
}

export async function generateTaskPayload<T extends ExecutionType>(
  task: Task,
  goalTitle: string
): Promise<GenerationResult[T]> {
  let schema = "";
  let promptDetails = "";

  switch (task.executionType) {
    case "flashcard":
      schema = `{ "cards": [{ "front": "英文单词或短语", "back": "中文释义及例句" }] }`;
      promptDetails = `生成 10-15 个核心词汇或知识点的翻转卡片。适合背诵和动态测验。`;
      break;
    case "reading":
      schema = `{ "title": "文章标题", "content": "文章的 Markdown 格式正文内容", "wordCount": 1000 }`;
      promptDetails = `生成一篇高质量、专业且引人深思的学习内容/文章。使用 Markdown 排版，包含标题和层级结构。字数适中（800-1500字）。`;
      break;
    case "quiz":
      schema = `{ "questions": [{ "question": "问题描述", "options": ["选项A", "选项B", "选项C", "选项D"], "answerIndex": 0 }] }`;
      promptDetails = `生成 12 个单项选择题，覆盖该模块的核心知识、易错点和应用场景，难度逐步提高。options 是一个字符串数组，answerIndex 是正确选项在数组中的索引(0-3)。题目必须足够区分理解和猜测，不要出送分题。`;
      break;
    case "coding":
      schema = `{ "language": "javascript", "instructions": "练习要求描述...", "template": "function solve() {\\n  // TODO\\n}", "expectedOutput": "预期的测试结果或输出" }`;
      promptDetails = `生成一个编程练习题。适合作为每日代码片段练习。提供详细的实现要求、起始代码模板。`;
      break;
    case "practice":
      schema = `{ "title": "实践练习标题", "scenario": "真实练习场景，例如在咖啡馆点单或做 60 秒开场发言", "instructions": "用户应该如何开始练习", "durationMinutes": 8, "prompts": [{ "cue": "本轮要完成的具体动作或问题", "target": "目标表达或动作要点", "sampleAnswer": "可朗读的示范答案；语言学习任务用目标语言写", "tips": ["简短提示1", "简短提示2"] }], "criteria": ["完成标准1", "完成标准2"], "deliverable": "练习结束后应留下的产出" }`;
      promptDetails = `生成一个可在 App 内逐轮执行的实践练习，不要只给阅读材料或泛泛建议。prompts 生成 4-6 轮，每一轮都必须是用户能立刻开口、动手或输出的具体练习。语言学习/口语/听力任务要把 sampleAnswer 写成目标语言，并让 cue 包含听、跟读、替换表达、独立回答等步骤。非语言任务不要生成需要朗读的 sampleAnswer，可以省略 sampleAnswer 或写成具体可参考的示例，严禁使用 XXX、某某、待填写等占位符。`;
      break;
    default:
      schema = `{ "data": "暂无预设结构" }`;
      promptDetails = `生成该任务的补充材料。`;
  }

  const prompt = `作为专业的学习系统 AI 引擎，请根据以下信息为用户生成“端内闭环学习”所需的数据载荷：

总计划目标: ${goalTitle}
今日任务: ${task.title}
任务要求: ${task.description || "无"}

任务类型: ${task.executionType}

${promptDetails}

严格按照以下 JSON 格式返回，不要包含其他解释文本，只返回 JSON：
${schema}
`;

  try {
    const aiEndpoint = `${getApiBaseUrl()}/api/trpc/ai.chat`;
    const resp = await fetch(aiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ json: { messages: [{ role: "user", content: prompt }] } }),
    });

    const respText = await resp.text();
    let data;
    try {
      data = JSON.parse(respText);
    } catch (e) {
      console.error("Failed to parse API response as JSON. Raw response:", respText);
      throw new Error(`API 返回了非 JSON 数据 (状态码: ${resp.status})。请检查服务器连接。`);
    }

    // Handle TRPC error responses
    if (data.error) {
      console.error("TRPC Error returned from server:", data.error);
      throw new Error(`服务器返回错误: ${data.error.message || "未知错误"}`);
    }

    const content = data?.result?.data?.json?.content ?? "";

    // Extract JSON block
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Raw AI Content:", content);
      throw new Error("AI 未返回有效的 JSON 数据");
    }

    return parseGeneratedJson<GenerationResult[T]>(jsonMatch[0]);
  } catch (error) {
    console.error("AI Payload Generation Error:", error);
    throw error;
  }
}
