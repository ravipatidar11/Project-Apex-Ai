import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import EmptyState from './components/EmptyState';
import { api } from './services/api';

export default function App() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash-lite');
  const [isDbConnected, setIsDbConnected] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    loadHealthAndChats();

    const interval = setInterval(async () => {
      try {
        const health = await api.getHealth();
        const connected = health.database === 'ok';
        setIsDbConnected((prev) => {
          if (!prev && connected) {
            // Backend just became available: load chats
            api.getChats().then(setChats).catch(() => {});
          }
          return connected;
        });
      } catch (e) {
        setIsDbConnected(false);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const loadHealthAndChats = async () => {
    try {
      const health = await api.getHealth();
      setIsDbConnected(health.database === 'ok');
    } catch (e) {
      console.warn('Backend server offline or starting up...');
      setIsDbConnected(false);
    }

    try {
      const chatList = await api.getChats();
      setChats(chatList);
      if (chatList.length > 0 && !activeChatId) {
        selectChat(chatList[0].id);
      }
    } catch (e) {
      console.error('Failed to load chats:', e);
    }
  };

  const selectChat = async (chatId) => {
    setActiveChatId(chatId);
    try {
      const detail = await api.getChatDetail(chatId);
      setMessages(detail.messages || []);
    } catch (e) {
      console.error('Error fetching chat detail:', e);
      setMessages([]);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await api.createChat('New Chat');
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
    } catch (e) {
      console.error('Error creating chat:', e);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));

      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c.id !== chatId);
        if (remaining.length > 0) {
          selectChat(remaining[0].id);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error('Error deleting chat:', e);
    }
  };

  // Real-time Streaming Message Handler
  const handleSendMessage = async (customPrompt = null) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isLoading) return;

    let targetChatId = activeChatId;

    if (!targetChatId) {
      try {
        const newChat = await api.createChat('New Chat');
        setChats((prev) => [newChat, ...prev]);
        targetChatId = newChat.id;
        setActiveChatId(targetChatId);
      } catch (e) {
        console.error('Failed to create chat:', e);
        return;
      }
    }

    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;

    const userMsg = {
      id: userMsgId,
      chat_id: targetChatId,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toISOString(),
    };

    const assistantMsgPlaceholder = {
      id: assistantMsgId,
      chat_id: targetChatId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsgPlaceholder]);
    setInput('');
    setIsLoading(true);

    try {
      // Stream tokens real-time
      await api.sendMessageStream(targetChatId, promptToSend, selectedModel, (chunk) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      });

      // Refresh sidebar titles after message completes
      const updatedChats = await api.getChats();
      setChats(updatedChats);
    } catch (e) {
      console.warn('Streaming fallback to standard REST endpoint...', e);
      try {
        const fullResponse = await api.sendMessage(targetChatId, promptToSend, selectedModel);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMsgId ? fullResponse : msg
          )
        );
      } catch (restErr) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `❌ **Connection Error**: ${restErr.message || 'Unable to communicate with backend service.'}`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="app-container">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDbConnected={isDbConnected}
      />

      <main className="main-content">
        <Header
          currentChatTitle={activeChat ? activeChat.title : ''}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          isDbConnected={isDbConnected}
        />

        <div className="messages-container">
          {messages.length === 0 ? (
            <EmptyState onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          ) : (
            <div className="messages-wrapper">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {isLoading && messages.length > 0 && !messages[messages.length - 1].content && (
                <div className="message-row assistant">
                  <div className="avatar ai-avatar">⚡</div>
                  <div className="message-content-box">
                    <div className="bubble">
                      <div className="typing-dots">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          isLoading={isLoading}
          onStop={() => setIsLoading(false)}
        />
      </main>
    </div>
  );
}
