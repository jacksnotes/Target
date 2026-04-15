import { ExecutionType } from "./types";

type TaskLike = { title?: string; description?: string; executionType?: string };

const REVIEW_TASK_PATTERN = /错误|错题|复盘|分析/;
const NON_CODING_DOMAIN_PATTERN = /厨艺|烹饪|厨房|菜肴|食材|调味|切菜|翻炒|炖|煮|烤|食谱/;
const REFLECTION_TASK_PATTERN = /记录|心得|总结|复盘|感想|选择|列出|准备|购买|采购/;
const CODING_TASK_PATTERN =
  /代码|编程|程序|函数|算法|调试|脚本|Python|JavaScript|TypeScript|Java\b|C\+\+|SQL|HTML|CSS|API|正则|Git|React|Node|接口|测试用例|编写|实现|开发|构建|部署|调用|爬取|解析|保存数据/i;

function getTaskText(task: TaskLike, context = "") {
  return `${context} ${task.title ?? ""} ${task.description ?? ""}`;
}

function normalizeExecutionType(task: TaskLike, context = ""): string | undefined {
  if (task.executionType !== "coding") return task.executionType;

  const text = getTaskText(task, context);
  if (NON_CODING_DOMAIN_PATTERN.test(text)) return "practice";
  if (REFLECTION_TASK_PATTERN.test(text) && !CODING_TASK_PATTERN.test(text)) return "practice";
  if (!CODING_TASK_PATTERN.test(text)) return "practice";

  return "coding";
}

export function getTaskExecutionType(task: TaskLike, context = ""): ExecutionType | undefined {
  const executionType = normalizeExecutionType(task, context);
  if (executionType === "checklist" && isTaskExecutionRequired(task, context)) return "practice";
  return executionType && executionType !== "checklist" ? (executionType as ExecutionType) : undefined;
}

export function isTaskExecutionRequired(task: TaskLike, context = "") {
  const executionType = normalizeExecutionType(task, context);
  if (executionType && executionType !== "checklist") return true;
  return REVIEW_TASK_PATTERN.test(getTaskText(task, context));
}
