import { create } from 'zustand'

const useChatStore = create((set) => ({
  messages: [],   // [{ id, role: 'user'|'assistant', content }]
  isTyping: false,
  pendingPrompt: null, // set by Tooltip actions; AIChat picks it up and sends

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, { id: crypto.randomUUID(), ...msg }] })),

  appendToLastMessage: (token) =>
    set((s) => {
      if (s.messages.length === 0) return s
      const msgs = [...s.messages]
      msgs[msgs.length - 1] = {
        ...msgs[msgs.length - 1],
        content: msgs[msgs.length - 1].content + token,
      }
      return { messages: msgs }
    }),

  setTyping: (isTyping) => set({ isTyping }),

  removeLastMessage: () =>
    set((s) => ({ messages: s.messages.slice(0, -1) })),

  clearMessages: () => set({ messages: [], isTyping: false }),

  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
  clearPendingPrompt: () => set({ pendingPrompt: null }),
}))

export default useChatStore
