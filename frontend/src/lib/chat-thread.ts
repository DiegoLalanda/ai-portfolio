const STORAGE_KEY = "portfolio-chat-thread-id";

export function getChatThreadId(): string {
  if (typeof localStorage === "undefined") {
    return "";
  }
  let threadId = localStorage.getItem(STORAGE_KEY);
  if (!threadId) {
    threadId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, threadId);
  }
  return threadId;
}

export function resetChatThreadId(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}
