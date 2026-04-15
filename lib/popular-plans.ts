/**
 * 热门学习计划数据模型和分类系统
 * 包含四大核心分类：职业与考证、生活与技能、运动与健康、个人成长
 */

export interface PlanTemplate {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconColor: string;
  duration: string; // 如 "30天" "90天"
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  description: string;
  /** AI 拆分时的 prompt 上下文 */
  aiContext: string;
  /** 用户现状问卷选项 */
  levelOptions: { label: string; value: string }[];
}

export interface PlanCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconColor: string;
  bgGradient: [string, string]; // gradient start/end
  plans: PlanTemplate[];
}

/** 任务执行类型 */
export type TaskExecutionType =
  | "flashcard"   // 卡片学习（背单词/划卡片）
  | "reading"     // 文章阅读
  | "coding"      // 代码练习
  | "checklist"   // 清单打卡
  | "quiz"        // 测验问答
  | "practice";   // 实践练习

export interface ExecutableTask {
  id: string;
  dayIndex: number;
  title: string;
  description: string;
  executionType: TaskExecutionType;
  /** 任务内容（由 AI 生成） */
  content: {
    /** 卡片学习内容 */
    flashcards?: { front: string; back: string }[];
    /** 阅读内容 */
    article?: { title: string; body: string };
    /** 代码练习 */
    codeChallenge?: {
      prompt: string;
      language: string;
      starterCode: string;
      expectedOutput: string;
      hint: string;
    };
    /** 清单项 */
    checklistItems?: string[];
    /** 测验题目 */
    quizQuestions?: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };
  completed: boolean;
}

// ===== 1. 职业与考证 Career & Certification =====

const CAREER_PLANS: PlanTemplate[] = [
  // === 翻译官计划 (多语种) ===
  {
    id: "translator-en",
    title: "翻译官计划 · 英语",
    subtitle: "英语专八 / CATTI 备考",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "90天",
    difficulty: "advanced",
    tags: ["英语", "翻译", "考证"],
    description: "系统提升英语翻译能力，涵盖笔译和口译核心技巧，助力通过 CATTI 考试。",
    aiContext: "用户正在备考英语翻译资格考试（CATTI），需要系统的翻译训练计划，包括词汇积累、翻译技巧、实战练习。",
    levelOptions: [
      { label: "零基础，刚开始学翻译", value: "beginner" },
      { label: "有一定基础，通过了英语六级", value: "intermediate" },
      { label: "已有翻译经验，冲刺高分", value: "advanced" },
    ],
  },
  {
    id: "translator-fr",
    title: "翻译官计划 · 法语",
    subtitle: "法语 DALF 备考",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "90天",
    difficulty: "intermediate",
    tags: ["法语", "翻译"],
    description: "从基础到进阶的法语学习路线，注重听说读写全面提升。",
    aiContext: "用户正在学习法语，目标是通过 DALF 考试或达到流利对话水平。",
    levelOptions: [
      { label: "零基础", value: "beginner" },
      { label: "学过一些基础（A1-A2）", value: "intermediate" },
      { label: "有较好基础（B1+）", value: "advanced" },
    ],
  },
  {
    id: "translator-de",
    title: "翻译官计划 · 德语",
    subtitle: "德语 TestDaF 备考",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "90天",
    difficulty: "intermediate",
    tags: ["德语", "翻译"],
    description: "系统学习德语，从发音到语法，逐步提升至 B2 水平。",
    aiContext: "用户正在学习德语，目标是通过 TestDaF 考试。",
    levelOptions: [
      { label: "零基础", value: "beginner" },
      { label: "学过基础（A1-A2）", value: "intermediate" },
      { label: "有较好基础（B1+）", value: "advanced" },
    ],
  },
  {
    id: "translator-es",
    title: "翻译官计划 · 西班牙语",
    subtitle: "DELE 考试备考",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "60天",
    difficulty: "intermediate",
    tags: ["西班牙语", "翻译"],
    description: "西班牙语系统学习，覆盖语法、词汇、口语和文化。",
    aiContext: "用户正在学习西班牙语，目标是通过 DELE 考试。",
    levelOptions: [
      { label: "零基础", value: "beginner" },
      { label: "学过基础", value: "intermediate" },
      { label: "有较好基础", value: "advanced" },
    ],
  },
  {
    id: "translator-ar",
    title: "翻译官计划 · 阿拉伯语",
    subtitle: "阿拉伯语入门到进阶",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "90天",
    difficulty: "beginner",
    tags: ["阿拉伯语"],
    description: "从字母和发音开始，系统学习阿拉伯语基础。",
    aiContext: "用户正在学习阿拉伯语，从零基础开始。",
    levelOptions: [
      { label: "完全零基础", value: "beginner" },
      { label: "认识字母", value: "intermediate" },
      { label: "能简单对话", value: "advanced" },
    ],
  },
  {
    id: "translator-zh",
    title: "翻译官计划 · 汉语",
    subtitle: "HSK 考试 / 对外汉语",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "60天",
    difficulty: "intermediate",
    tags: ["汉语", "HSK"],
    description: "面向外国学习者的汉语学习计划，从拼音到流利表达。",
    aiContext: "用户正在学习汉语（作为外语），目标是通过 HSK 考试。",
    levelOptions: [
      { label: "零基础", value: "beginner" },
      { label: "HSK 1-2 水平", value: "intermediate" },
      { label: "HSK 3+ 水平", value: "advanced" },
    ],
  },
  {
    id: "translator-jp",
    title: "翻译官计划 · 日语",
    subtitle: "JLPT N2/N1 备考",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "90天",
    difficulty: "intermediate",
    tags: ["日语", "JLPT"],
    description: "系统学习日语，从五十音到 N2/N1 水平。",
    aiContext: "用户正在学习日语，目标是通过 JLPT N2 或 N1 考试。",
    levelOptions: [
      { label: "零基础", value: "beginner" },
      { label: "N4-N3 水平", value: "intermediate" },
      { label: "N2 冲刺 N1", value: "advanced" },
    ],
  },
  {
    id: "translator-kr",
    title: "翻译官计划 · 韩语",
    subtitle: "TOPIK 考试备考",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "60天",
    difficulty: "intermediate",
    tags: ["韩语", "TOPIK"],
    description: "韩语系统学习，从韩文字母到日常对话。",
    aiContext: "用户正在学习韩语，目标是通过 TOPIK 考试。",
    levelOptions: [
      { label: "零基础", value: "beginner" },
      { label: "认识韩文字母", value: "intermediate" },
      { label: "能简单对话", value: "advanced" },
    ],
  },
  {
    id: "translator-ru",
    title: "翻译官计划 · 俄语",
    subtitle: "俄语入门到进阶",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "90天",
    difficulty: "beginner",
    tags: ["俄语"],
    description: "从西里尔字母开始，系统学习俄语基础。",
    aiContext: "用户正在学习俄语，从零基础开始。",
    levelOptions: [
      { label: "完全零基础", value: "beginner" },
      { label: "认识字母", value: "intermediate" },
      { label: "能简单对话", value: "advanced" },
    ],
  },
  {
    id: "translator-pt",
    title: "翻译官计划 · 葡萄牙语",
    subtitle: "葡语入门到进阶",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "60天",
    difficulty: "beginner",
    tags: ["葡萄牙语"],
    description: "葡萄牙语系统学习，覆盖巴西葡语和欧洲葡语。",
    aiContext: "用户正在学习葡萄牙语。",
    levelOptions: [
      { label: "零基础", value: "beginner" },
      { label: "有一定基础", value: "intermediate" },
      { label: "能简单对话", value: "advanced" },
    ],
  },
  {
    id: "translator-it",
    title: "翻译官计划 · 意大利语",
    subtitle: "意语入门到进阶",
    iconName: "globe",
    iconColor: "#4A90D9",
    duration: "60天",
    difficulty: "beginner",
    tags: ["意大利语"],
    description: "意大利语系统学习，从发音到日常对话。",
    aiContext: "用户正在学习意大利语。",
    levelOptions: [
      { label: "零基础", value: "beginner" },
      { label: "有一定基础", value: "intermediate" },
      { label: "能简单对话", value: "advanced" },
    ],
  },
  // === 金融分析师 ===
  {
    id: "cfa-prep",
    title: "金融分析师计划",
    subtitle: "CFA 备考 · 金融建模",
    iconName: "chart.line.uptrend.xyaxis",
    iconColor: "#2ECC71",
    duration: "120天",
    difficulty: "advanced",
    tags: ["CFA", "金融", "考证"],
    description: "CFA 考试系统备考计划，涵盖道德、定量分析、经济学、财务报告等核心科目。",
    aiContext: "用户正在备考 CFA（特许金融分析师）考试，需要系统的备考计划。",
    levelOptions: [
      { label: "金融零基础", value: "beginner" },
      { label: "有金融/会计背景", value: "intermediate" },
      { label: "已通过 CFA Level 1", value: "advanced" },
    ],
  },
  // === 考公考编 ===
  {
    id: "civil-service",
    title: "考公考编计划",
    subtitle: "行测 + 申论系统备考",
    iconName: "briefcase.fill",
    iconColor: "#E74C3C",
    duration: "90天",
    difficulty: "intermediate",
    tags: ["公务员", "考公", "行测", "申论"],
    description: "公务员考试系统备考，行测每日刷题 + 申论核心框架训练。",
    aiContext: "用户正在备考公务员考试（国考/省考），需要行测和申论的系统训练计划。",
    levelOptions: [
      { label: "第一次备考", value: "beginner" },
      { label: "考过一次，想提高", value: "intermediate" },
      { label: "有基础，冲刺高分", value: "advanced" },
    ],
  },
  // === PMP ===
  {
    id: "pmp-cert",
    title: "项目经理计划",
    subtitle: "PMP 认证备考",
    iconName: "checkmark.seal.fill",
    iconColor: "#9B59B6",
    duration: "60天",
    difficulty: "intermediate",
    tags: ["PMP", "项目管理", "考证"],
    description: "PMP 项目管理专业人士认证备考计划，系统学习 PMBOK 知识体系。",
    aiContext: "用户正在备考 PMP（项目管理专业人士）认证考试。",
    levelOptions: [
      { label: "无项目管理经验", value: "beginner" },
      { label: "有 1-3 年项目经验", value: "intermediate" },
      { label: "有丰富项目经验", value: "advanced" },
    ],
  },
  // === 雅思 ===
  {
    id: "ielts-prep",
    title: "雅思高分冲刺",
    subtitle: "IELTS 7.0+ 备考",
    iconName: "graduationcap.fill",
    iconColor: "#3498DB",
    duration: "60天",
    difficulty: "advanced",
    tags: ["雅思", "英语", "留学"],
    description: "雅思考试系统备考，听说读写四科全面提升。",
    aiContext: "用户正在备考雅思考试，目标 7.0 分以上。",
    levelOptions: [
      { label: "英语基础一般（四级水平）", value: "beginner" },
      { label: "英语较好（六级水平）", value: "intermediate" },
      { label: "英语优秀，冲刺 7.5+", value: "advanced" },
    ],
  },
];

// ===== 2. 生活与技能 Life & Skills =====

const LIFE_SKILLS_PLANS: PlanTemplate[] = [
  // === 开发者计划 ===
  {
    id: "dev-python",
    title: "开发者计划 · Python",
    subtitle: "从入门到爬虫",
    iconName: "desktopcomputer",
    iconColor: "#3776AB",
    duration: "30天",
    difficulty: "beginner",
    tags: ["Python", "编程", "爬虫"],
    description: "Python 零基础入门，从变量和循环到实战爬虫项目。",
    aiContext: "用户正在学习 Python 编程，目标是从零基础到能独立编写爬虫程序。请生成具有端内可执行性的任务：flashcard 类型用于记忆语法关键字，coding 类型用于编程练习（需提供 starter code 和 expected output），reading 类型用于理论知识学习。",
    levelOptions: [
      { label: "完全零基础", value: "beginner" },
      { label: "了解基本概念", value: "intermediate" },
      { label: "有其他语言基础", value: "advanced" },
    ],
  },
  {
    id: "dev-java",
    title: "开发者计划 · Java",
    subtitle: "Java 核心到 Spring Boot",
    iconName: "desktopcomputer",
    iconColor: "#ED8B00",
    duration: "60天",
    difficulty: "intermediate",
    tags: ["Java", "编程", "后端"],
    description: "Java 系统学习路线，从基础语法到 Spring Boot 企业级开发。",
    aiContext: "用户正在学习 Java 编程，目标是掌握 Spring Boot 后端开发。",
    levelOptions: [
      { label: "编程零基础", value: "beginner" },
      { label: "了解基本编程概念", value: "intermediate" },
      { label: "有其他语言经验", value: "advanced" },
    ],
  },
  {
    id: "dev-cpp",
    title: "开发者计划 · C++",
    subtitle: "C++ 基础到算法竞赛",
    iconName: "desktopcomputer",
    iconColor: "#00599C",
    duration: "60天",
    difficulty: "intermediate",
    tags: ["C++", "编程", "算法"],
    description: "C++ 系统学习，从基础语法到 STL 和算法竞赛入门。",
    aiContext: "用户正在学习 C++ 编程，目标是掌握算法和数据结构。",
    levelOptions: [
      { label: "编程零基础", value: "beginner" },
      { label: "了解 C 语言", value: "intermediate" },
      { label: "有编程基础", value: "advanced" },
    ],
  },
  {
    id: "dev-js",
    title: "开发者计划 · JavaScript",
    subtitle: "全栈工程师路线",
    iconName: "desktopcomputer",
    iconColor: "#F7DF1E",
    duration: "45天",
    difficulty: "intermediate",
    tags: ["JavaScript", "前端", "全栈"],
    description: "JavaScript 全栈学习路线，从 DOM 操作到 Node.js 后端开发。",
    aiContext: "用户正在学习 JavaScript，目标是成为全栈工程师。",
    levelOptions: [
      { label: "编程零基础", value: "beginner" },
      { label: "了解 HTML/CSS", value: "intermediate" },
      { label: "有前端基础", value: "advanced" },
    ],
  },
  {
    id: "dev-react",
    title: "开发者计划 · React",
    subtitle: "React + React Native",
    iconName: "desktopcomputer",
    iconColor: "#61DAFB",
    duration: "30天",
    difficulty: "intermediate",
    tags: ["React", "前端", "移动端"],
    description: "React 生态系统学习，从组件化思维到跨平台移动开发。",
    aiContext: "用户正在学习 React 和 React Native，目标是能开发 Web 和移动应用。",
    levelOptions: [
      { label: "了解 JavaScript 基础", value: "beginner" },
      { label: "有前端开发经验", value: "intermediate" },
      { label: "有 React 基础", value: "advanced" },
    ],
  },
  {
    id: "dev-go",
    title: "开发者计划 · Go",
    subtitle: "Go 语言云原生开发",
    iconName: "desktopcomputer",
    iconColor: "#00ADD8",
    duration: "30天",
    difficulty: "intermediate",
    tags: ["Go", "后端", "云原生"],
    description: "Go 语言系统学习，从基础到并发编程和微服务开发。",
    aiContext: "用户正在学习 Go 语言，目标是掌握云原生后端开发。",
    levelOptions: [
      { label: "编程零基础", value: "beginner" },
      { label: "有其他语言基础", value: "intermediate" },
      { label: "有后端开发经验", value: "advanced" },
    ],
  },
  {
    id: "dev-rust",
    title: "开发者计划 · Rust",
    subtitle: "Rust 系统编程",
    iconName: "desktopcomputer",
    iconColor: "#CE422B",
    duration: "45天",
    difficulty: "advanced",
    tags: ["Rust", "系统编程"],
    description: "Rust 语言学习，掌握所有权系统、生命周期和并发安全。",
    aiContext: "用户正在学习 Rust 编程语言。",
    levelOptions: [
      { label: "有 C/C++ 基础", value: "beginner" },
      { label: "有其他语言经验", value: "intermediate" },
      { label: "有系统编程经验", value: "advanced" },
    ],
  },
  {
    id: "dev-swift",
    title: "开发者计划 · Swift",
    subtitle: "iOS 应用开发",
    iconName: "desktopcomputer",
    iconColor: "#FA7343",
    duration: "30天",
    difficulty: "intermediate",
    tags: ["Swift", "iOS", "移动端"],
    description: "Swift 语言和 iOS 开发，从 SwiftUI 到完整应用上架。",
    aiContext: "用户正在学习 Swift 和 iOS 开发。",
    levelOptions: [
      { label: "编程零基础", value: "beginner" },
      { label: "有编程基础", value: "intermediate" },
      { label: "有移动端经验", value: "advanced" },
    ],
  },
  {
    id: "dev-kotlin",
    title: "开发者计划 · Kotlin",
    subtitle: "Android 应用开发",
    iconName: "desktopcomputer",
    iconColor: "#7F52FF",
    duration: "30天",
    difficulty: "intermediate",
    tags: ["Kotlin", "Android", "移动端"],
    description: "Kotlin 语言和 Android 开发，从 Jetpack Compose 到完整应用。",
    aiContext: "用户正在学习 Kotlin 和 Android 开发。",
    levelOptions: [
      { label: "编程零基础", value: "beginner" },
      { label: "有 Java 基础", value: "intermediate" },
      { label: "有移动端经验", value: "advanced" },
    ],
  },
  {
    id: "dev-sql",
    title: "开发者计划 · SQL",
    subtitle: "数据库从入门到精通",
    iconName: "desktopcomputer",
    iconColor: "#336791",
    duration: "21天",
    difficulty: "beginner",
    tags: ["SQL", "数据库"],
    description: "SQL 系统学习，从基础查询到高级优化和数据库设计。",
    aiContext: "用户正在学习 SQL 和数据库。",
    levelOptions: [
      { label: "完全零基础", value: "beginner" },
      { label: "会基本查询", value: "intermediate" },
      { label: "想深入优化", value: "advanced" },
    ],
  },
  {
    id: "dev-typescript",
    title: "开发者计划 · TypeScript",
    subtitle: "类型安全的 JavaScript",
    iconName: "desktopcomputer",
    iconColor: "#3178C6",
    duration: "21天",
    difficulty: "intermediate",
    tags: ["TypeScript", "前端"],
    description: "TypeScript 系统学习，从类型基础到高级泛型和工具类型。",
    aiContext: "用户正在学习 TypeScript。",
    levelOptions: [
      { label: "了解 JavaScript", value: "beginner" },
      { label: "有 JS 项目经验", value: "intermediate" },
      { label: "想深入类型系统", value: "advanced" },
    ],
  },
  // === 自媒体与设计 ===
  {
    id: "video-editing",
    title: "短视频剪辑速成",
    subtitle: "Pr / CapCut 实战教学",
    iconName: "video.fill",
    iconColor: "#FF6B6B",
    duration: "21天",
    difficulty: "beginner",
    tags: ["剪辑", "短视频", "自媒体"],
    description: "21 天掌握短视频剪辑核心技能，从素材收集到发布上线全流程。",
    aiContext: "用户想学习短视频剪辑，目标是能独立制作高质量的短视频内容。请包含 reading（剪辑理论）、checklist（操作练习）、practice（实战项目）类型任务。",
    levelOptions: [
      { label: "从未剪过视频", value: "beginner" },
      { label: "会基础剪切拼接", value: "intermediate" },
      { label: "想提升到专业水平", value: "advanced" },
    ],
  },
  {
    id: "uiux-design",
    title: "UI/UX 设计师入门",
    subtitle: "从零到产品设计",
    iconName: "paintbrush.fill",
    iconColor: "#A855F7",
    duration: "30天",
    difficulty: "beginner",
    tags: ["UI设计", "UX", "Figma"],
    description: "系统学习 UI/UX 设计，从设计基础原理到 Figma 实战项目。",
    aiContext: "用户想学习 UI/UX 设计，从零基础到能独立完成产品设计。",
    levelOptions: [
      { label: "完全零基础", value: "beginner" },
      { label: "了解基本工具", value: "intermediate" },
      { label: "有一定审美基础", value: "advanced" },
    ],
  },
  // === 小语种日常会话 ===
  {
    id: "lang-french-convo",
    title: "法语日常会话",
    subtitle: "从入门到日常交流",
    iconName: "bubble.left.and.bubble.right.fill",
    iconColor: "#0052CC",
    duration: "30天",
    difficulty: "beginner",
    tags: ["法语", "会话", "日常"],
    description: "30 天法语日常会话训练，从打招呼到流利日常交流。",
    aiContext: "用户想学习法语日常会话，注重实际交流能力。请多使用 flashcard（常用词汇和短语记忆）和 practice（情景对话练习）类型任务。",
    levelOptions: [
      { label: "完全零基础", value: "beginner" },
      { label: "知道一些基本词汇", value: "intermediate" },
      { label: "能简单自我介绍", value: "advanced" },
    ],
  },
  {
    id: "lang-japanese-convo",
    title: "日语日常会话",
    subtitle: "从五十音到日常交流",
    iconName: "bubble.left.and.bubble.right.fill",
    iconColor: "#DC2626",
    duration: "30天",
    difficulty: "beginner",
    tags: ["日语", "会话", "日常"],
    description: "30 天日语日常会话训练，从五十音开始到能进行日常交流。",
    aiContext: "用户想学习日语日常会话，从五十音开始。",
    levelOptions: [
      { label: "完全零基础", value: "beginner" },
      { label: "知道五十音", value: "intermediate" },
      { label: "能简单自我介绍", value: "advanced" },
    ],
  },
  // === 生活技能 ===
  {
    id: "cooking-basics",
    title: "厨艺入门计划",
    subtitle: "从零开始学做饭",
    iconName: "flame.fill",
    iconColor: "#E67E22",
    duration: "30天",
    difficulty: "beginner",
    tags: ["烹饪", "生活技能"],
    description: "30 天学会 20 道家常菜，从食材选购到烹饪技巧全覆盖。",
    aiContext: "用户想学习烹饪，从零基础开始学做家常菜。",
    levelOptions: [
      { label: "完全不会做饭", value: "beginner" },
      { label: "会做简单的菜", value: "intermediate" },
      { label: "想提升厨艺", value: "advanced" },
    ],
  },
  {
    id: "photography",
    title: "摄影入门计划",
    subtitle: "手机摄影到专业相机",
    iconName: "camera.fill",
    iconColor: "#8E44AD",
    duration: "30天",
    difficulty: "beginner",
    tags: ["摄影", "创意"],
    description: "从构图基础到后期修图，系统学习摄影技巧。",
    aiContext: "用户想学习摄影，从手机摄影开始。",
    levelOptions: [
      { label: "只会随手拍", value: "beginner" },
      { label: "了解基本构图", value: "intermediate" },
      { label: "有相机想深入", value: "advanced" },
    ],
  },
];

// ===== 3. 运动与健康 Fitness & Health =====

const FITNESS_PLANS: PlanTemplate[] = [
  // === 马拉松备赛 ===
  {
    id: "marathon-half",
    title: "马拉松备赛计划",
    subtitle: "从 3km 到半马完赛",
    iconName: "figure.run",
    iconColor: "#F97316",
    duration: "90天",
    difficulty: "intermediate",
    tags: ["跑步", "马拉松", "有氧"],
    description: "系统的周期化训练计划，从 3 公里跑走结合到半程马拉松完赛。包含速度训练、长距离跑和恢复期安排。",
    aiContext: "用户要备赛半程马拉松（21km），目前能跑 3-5 公里。需要 90 天分阶段训练计划，包含基础期、巩固期和竞赛前期。请使用 checklist（每日训练打卡）、reading（跑步知识理论）、practice（跑姿和呼吸练习）类型任务。",
    levelOptions: [
      { label: "只能跑 1-3 公里", value: "beginner" },
      { label: "能跑 5-10 公里", value: "intermediate" },
      { label: "能跑 10km+，冲半马PB", value: "advanced" },
    ],
  },
  {
    id: "running-5k",
    title: "跑步计划 · 5K",
    subtitle: "从零到完成 5 公里",
    iconName: "figure.run",
    iconColor: "#2ECC71",
    duration: "30天",
    difficulty: "beginner",
    tags: ["跑步", "有氧"],
    description: "30 天跑步训练计划，从走跑结合到连续跑完 5 公里。",
    aiContext: "用户想开始跑步，目标是 30 天内能连续跑完 5 公里。",
    levelOptions: [
      { label: "完全不跑步", value: "beginner" },
      { label: "能跑 1-2 公里", value: "intermediate" },
      { label: "能跑 3 公里以上", value: "advanced" },
    ],
  },
  // === 体态矫正与减脂 ===
  {
    id: "core-strength",
    title: "21天核心力量唤醒",
    subtitle: "居家徒手训练",
    iconName: "dumbbell.fill",
    iconColor: "#EF4444",
    duration: "21天",
    difficulty: "beginner",
    tags: ["核心", "力量", "居家"],
    description: "21 天居家核心力量训练计划，无需器材，科学循序渐进提升核心力量。",
    aiContext: "用户想进行居家核心力量训练，无器材限制。请使用 checklist（训练动作打卡）和 reading（训练原理学习）类型任务。每天训练 15-30 分钟。",
    levelOptions: [
      { label: "从不运动", value: "beginner" },
      { label: "偶尔运动", value: "intermediate" },
      { label: "有运动习惯", value: "advanced" },
    ],
  },
  {
    id: "posture-fix",
    title: "圆肩驼背改善计划",
    subtitle: "体态矫正 · 告别驼背",
    iconName: "figure.stand",
    iconColor: "#14B8A6",
    duration: "30天",
    difficulty: "beginner",
    tags: ["体态", "矫正", "拉伸"],
    description: "30 天科学改善圆肩驼背，包含拉伸、强化和日常姿势纠正。",
    aiContext: "用户有圆肩驼背问题，想通过每日训练来改善体态。请使用 checklist（每日拉伸和训练动作）和 reading（体态知识）类型任务。",
    levelOptions: [
      { label: "圆肩驼背严重", value: "beginner" },
      { label: "轻微体态不良", value: "intermediate" },
      { label: "想预防和优化", value: "advanced" },
    ],
  },
  // === 作息重塑 ===
  {
    id: "sleep-improvement",
    title: "作息重塑 · 戒断熬夜",
    subtitle: "科学睡眠 · 告别晚睡",
    iconName: "bed.double.fill",
    iconColor: "#6366F1",
    duration: "21天",
    difficulty: "beginner",
    tags: ["睡眠", "健康", "习惯"],
    description: "21 天科学戒断熬夜，建立健康作息规律，提升睡眠质量。",
    aiContext: "用户经常熬夜，想通过 21 天计划建立健康作息。请使用 checklist（每日打卡：入睡时间、起床时间、睡前仪式等）和 reading（睡眠科学知识）类型任务。",
    levelOptions: [
      { label: "经常凌晨 2 点后睡", value: "beginner" },
      { label: "12点左右但不规律", value: "intermediate" },
      { label: "想进一步优化睡眠质量", value: "advanced" },
    ],
  },
  // === 其他运动健康 ===
  {
    id: "yoga-daily",
    title: "每日瑜伽计划",
    subtitle: "身心平衡 · 柔韧提升",
    iconName: "heart.fill",
    iconColor: "#9B59B6",
    duration: "30天",
    difficulty: "beginner",
    tags: ["瑜伽", "柔韧性", "冥想"],
    description: "每日 15-30 分钟瑜伽练习，提升柔韧性和身心平衡。",
    aiContext: "用户想开始练习瑜伽，注重柔韧性和放松。",
    levelOptions: [
      { label: "从未练过瑜伽", value: "beginner" },
      { label: "偶尔练习", value: "intermediate" },
      { label: "有一定基础", value: "advanced" },
    ],
  },
  {
    id: "meditation",
    title: "冥想入门计划",
    subtitle: "正念冥想 · 减压放松",
    iconName: "brain",
    iconColor: "#1ABC9C",
    duration: "21天",
    difficulty: "beginner",
    tags: ["冥想", "正念", "减压"],
    description: "21 天冥想入门，从 5 分钟开始，逐步建立正念习惯。",
    aiContext: "用户想学习冥想，目标是减压和提升专注力。",
    levelOptions: [
      { label: "从未冥想过", value: "beginner" },
      { label: "偶尔尝试过", value: "intermediate" },
      { label: "想深入练习", value: "advanced" },
    ],
  },
  {
    id: "fat-loss",
    title: "科学减脂计划",
    subtitle: "饮食 + 运动双管齐下",
    iconName: "flame.fill",
    iconColor: "#F59E0B",
    duration: "30天",
    difficulty: "intermediate",
    tags: ["减脂", "饮食", "运动"],
    description: "30 天科学减脂计划，结合饮食管理和有效运动，健康减重。",
    aiContext: "用户想科学减脂，需要饮食和运动相结合的计划。",
    levelOptions: [
      { label: "不了解减脂原理", value: "beginner" },
      { label: "尝试过但效果不佳", value: "intermediate" },
      { label: "想系统化管理", value: "advanced" },
    ],
  },
];

// ===== 4. 个人成长 Personal Growth =====

const GROWTH_PLANS: PlanTemplate[] = [
  {
    id: "speed-reading",
    title: "高效阅读计划",
    subtitle: "每周一本书深度拆解",
    iconName: "text.book.closed.fill",
    iconColor: "#E67E22",
    duration: "30天",
    difficulty: "intermediate",
    tags: ["阅读", "效率", "知识管理"],
    description: "掌握高效阅读方法，每周深度拆解一本书并输出读书笔记。",
    aiContext: "用户想提高阅读效率，目标是每周读完一本书并做深度拆解。请使用 reading（阅读方法论学习）、checklist（每日阅读打卡）、practice（输出读书笔记）类型任务。",
    levelOptions: [
      { label: "很少读书", value: "beginner" },
      { label: "每月读 1-2 本", value: "intermediate" },
      { label: "想提升阅读效率", value: "advanced" },
    ],
  },
  {
    id: "public-speaking",
    title: "公众表达力计划",
    subtitle: "克服演讲恐惧",
    iconName: "mic.fill",
    iconColor: "#E74C3C",
    duration: "30天",
    difficulty: "intermediate",
    tags: ["演讲", "表达", "沟通"],
    description: "30 天提升公众表达能力，从克服恐惧到即兴发言结构训练。",
    aiContext: "用户想提升公众表达能力，可能有演讲恐惧。请使用 reading（演讲理论）、practice（每日发言练习）、quiz（表达技巧自测）类型任务。",
    levelOptions: [
      { label: "非常害怕公开发言", value: "beginner" },
      { label: "能发言但不自信", value: "intermediate" },
      { label: "想提升演讲技巧", value: "advanced" },
    ],
  },
  {
    id: "financial-literacy",
    title: "理财小白计划",
    subtitle: "记账习惯 · 复利思维",
    iconName: "banknote.fill",
    iconColor: "#2ECC71",
    duration: "30天",
    difficulty: "beginner",
    tags: ["理财", "投资", "记账"],
    description: "30 天建立理财意识，从记账习惯到基础投资知识。",
    aiContext: "用户想学习个人理财，从零开始建立理财意识。请使用 reading（理财知识）、checklist（每日记账打卡）、quiz（理财知识测验）类型任务。",
    levelOptions: [
      { label: "完全不懂理财", value: "beginner" },
      { label: "有记账习惯", value: "intermediate" },
      { label: "想学习投资", value: "advanced" },
    ],
  },
  {
    id: "time-management",
    title: "时间管理大师",
    subtitle: "GTD · 番茄工作法",
    iconName: "clock.fill",
    iconColor: "#3498DB",
    duration: "21天",
    difficulty: "beginner",
    tags: ["时间管理", "效率", "GTD"],
    description: "21 天掌握时间管理核心方法，提升日常效率。",
    aiContext: "用户想提升时间管理能力，经常感觉时间不够用。",
    levelOptions: [
      { label: "经常拖延", value: "beginner" },
      { label: "有一定计划性", value: "intermediate" },
      { label: "想系统优化", value: "advanced" },
    ],
  },
  {
    id: "writing-skills",
    title: "写作能力提升",
    subtitle: "从日记到公众号写作",
    iconName: "doc.text.fill",
    iconColor: "#8E44AD",
    duration: "30天",
    difficulty: "beginner",
    tags: ["写作", "创作", "表达"],
    description: "30 天提升写作能力，从每日日记到结构化写作。",
    aiContext: "用户想提升写作能力。",
    levelOptions: [
      { label: "很少写东西", value: "beginner" },
      { label: "偶尔写日记", value: "intermediate" },
      { label: "想提升写作质量", value: "advanced" },
    ],
  },
  {
    id: "critical-thinking",
    title: "批判性思维训练",
    subtitle: "逻辑推理 · 独立思考",
    iconName: "lightbulb.fill",
    iconColor: "#F39C12",
    duration: "21天",
    difficulty: "intermediate",
    tags: ["思维", "逻辑", "认知"],
    description: "21 天训练批判性思维，提升逻辑推理和独立思考能力。",
    aiContext: "用户想提升批判性思维和逻辑推理能力。",
    levelOptions: [
      { label: "想开始训练", value: "beginner" },
      { label: "有一定基础", value: "intermediate" },
      { label: "想深入提升", value: "advanced" },
    ],
  },
  {
    id: "habit-building",
    title: "习惯养成计划",
    subtitle: "原子习惯 · 21天打卡",
    iconName: "checkmark.circle.fill",
    iconColor: "#10B981",
    duration: "21天",
    difficulty: "beginner",
    tags: ["习惯", "自律", "打卡"],
    description: "基于《原子习惯》方法论，21 天建立一个持久好习惯。",
    aiContext: "用户想培养一个新习惯（如早起、运动、阅读等）。请使用 reading（习惯科学理论）、checklist（每日习惯打卡）类型任务。",
    levelOptions: [
      { label: "经常半途而废", value: "beginner" },
      { label: "能坚持但不稳定", value: "intermediate" },
      { label: "想同时培养多个习惯", value: "advanced" },
    ],
  },
];

// ===== 导出分类 =====

export const PLAN_CATEGORIES: PlanCategory[] = [
  {
    id: "career",
    title: "职业与考证",
    subtitle: "Career & Certification",
    iconName: "briefcase.fill",
    iconColor: "#4A90D9",
    bgGradient: ["#4A90D9", "#2C5F8A"],
    plans: CAREER_PLANS,
  },
  {
    id: "life-skills",
    title: "生活与技能",
    subtitle: "Life & Skills",
    iconName: "desktopcomputer",
    iconColor: "#2ECC71",
    bgGradient: ["#2ECC71", "#1A8A4C"],
    plans: LIFE_SKILLS_PLANS,
  },
  {
    id: "fitness",
    title: "运动与健康",
    subtitle: "Sports & Health",
    iconName: "dumbbell.fill",
    iconColor: "#E74C3C",
    bgGradient: ["#E74C3C", "#A93226"],
    plans: FITNESS_PLANS,
  },
  {
    id: "growth",
    title: "个人成长",
    subtitle: "Personal Growth",
    iconName: "lightbulb.fill",
    iconColor: "#F39C12",
    bgGradient: ["#F39C12", "#C47F0E"],
    plans: GROWTH_PLANS,
  },
];

/** 根据 ID 查找计划模板 */
export function findPlanById(planId: string): PlanTemplate | undefined {
  for (const category of PLAN_CATEGORIES) {
    const plan = category.plans.find((p) => p.id === planId);
    if (plan) return plan;
  }
  return undefined;
}

/** 根据 ID 查找分类 */
export function findCategoryByPlanId(planId: string): PlanCategory | undefined {
  for (const category of PLAN_CATEGORIES) {
    if (category.plans.some((p) => p.id === planId)) return category;
  }
  return undefined;
}
