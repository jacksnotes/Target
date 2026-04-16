import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  ai: router({
    chat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string(),
            }),
          ),
        }),
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "你是一个专业的学习规划助手，擅长将学习目标拆分为具体可执行的子任务。请用简洁的中文回答。",
            },
            ...input.messages,
          ],
        });
        const content =
          (response as any).choices?.[0]?.message?.content ?? "无法生成任务，请重试";
        return { content };
      }),
  }),
});

export type AppRouter = typeof appRouter;