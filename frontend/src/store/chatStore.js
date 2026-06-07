import { create } from 'zustand'

const useChatStore = create((set) => ({
  messages: [],   // [{ id, role: 'user'|'assistant', content }]
  isTyping: false,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, { id: Date.now(), ...msg }] })),

  appendToLastMessage: (token) =>
    set((s) => {
      const msgs = [...s.messages]
      msgs[msgs.length - 1] = {
        ...msgs[msgs.length - 1],
        content: msgs[msgs.length - 1].content + token,
      }
      return { messages: msgs }
    }),

  setTyping: (isTyping) => set({ isTyping }),

  clearMessages: () => set({ messages: [], isTyping: false }),
}))

export default useChatStore
