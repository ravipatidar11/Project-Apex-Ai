// API Client Service connecting React frontend to FastAPI backend

const BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` 
  : '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch (e) {
        // ignore parse error
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Health status check
  getHealth: () => request('/health'),

  // List all chat threads
  getChats: () => request('/chats'),

  // Create a new empty chat thread
  createChat: (title = "New Chat") => 
    request('/chats', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  // Clear all chats
  clearAllChats: () =>
    request('/chats', {
      method: 'DELETE',
    }),

  // Fetch full details & messages of a specific chat
  getChatDetail: (chatId) => request(`/chats/${chatId}`),

  // Delete a chat thread
  deleteChat: (chatId) => 
    request(`/chats/${chatId}`, {
      method: 'DELETE',
    }),

  // Send user message & retrieve complete AI assistant response
  sendMessage: (chatId, content, model = "gemini-2.5-flash") => 
    request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, model }),
    }),

  // Stream AI response real-time via Server-Sent Events (SSE)
  sendMessageStream: async (chatId, content, model = "gemini-2.5-flash", onChunk) => {
    const url = `${BASE_URL}/chats/${chatId}/messages/stream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, model }),
    });

    if (!response.ok) {
      throw new Error(`Stream Error ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
          } catch (e) {
            // ignore JSON parse error for partial lines
          }
        }
      }
    }
  },
};
