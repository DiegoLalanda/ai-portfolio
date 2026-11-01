export type ChatStreamEvent =
  | { type: "started" }
  | { type: "status"; phase: "thinking" | "synthesizing" }
  | { type: "tool_call"; tool: string }
  | { type: "tool_done"; tool: string }
  | { type: "retrieval"; count: number }
  | {
      type: "widget_preview";
      response: import("@/types/agent-response").AgentResponse;
    }
  | { type: "done"; response: import("@/types/agent-response").AgentResponse }
  | { type: "error"; message: string };
