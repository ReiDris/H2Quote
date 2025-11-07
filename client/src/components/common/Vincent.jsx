import React, { useState, useRef, useEffect } from "react";
import { AiFillMessage } from "react-icons/ai";
import { IoSend } from "react-icons/io5";
import { chatbotAPI } from "../../config/api";

const STORAGE_KEYS = {
  SESSION_ID: 'vincent_session_id',
  MESSAGES: 'vincent_messages',
  IS_OPEN: 'vincent_is_open'
};

const isAuthenticated = () => {
  return !!localStorage.getItem('h2quote_token');
};

const wasPageRefreshed = () => {
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length > 0) {
    return navEntries[0].type === 'reload';
  }
  return performance.navigation.type === 1;
};

const Vincent = () => {
  const useStorage = isAuthenticated() ? localStorage : sessionStorage;
  const storageType = isAuthenticated() ? 'localStorage' : 'sessionStorage';
  
  const shouldClearStorage = !isAuthenticated() && wasPageRefreshed();
  
  if (shouldClearStorage) {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    sessionStorage.removeItem(STORAGE_KEYS.MESSAGES);
    sessionStorage.removeItem(STORAGE_KEYS.IS_OPEN);
  }

  const [isOpen, setIsOpen] = useState(() => {
    if (shouldClearStorage) {
      return false;
    }
    const saved = useStorage.getItem(STORAGE_KEYS.IS_OPEN);
    return saved === 'true';
  });

  const [messages, setMessages] = useState(() => {
    if (shouldClearStorage) {
      return [];
    }
    const saved = useStorage.getItem(STORAGE_KEYS.MESSAGES);
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed;
  });

  const [inputMessage, setInputMessage] = useState("");
  
  const [sessionId, setSessionId] = useState(() => {
    if (shouldClearStorage) {
      return null;
    }
    const id = useStorage.getItem(STORAGE_KEYS.SESSION_ID);
    return id;
  });

  const [quickActions, setQuickActions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const storage = isAuthenticated() ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEYS.IS_OPEN, isOpen);
  }, [isOpen]);

  useEffect(() => {
    const storage = isAuthenticated() ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const storage = isAuthenticated() ? localStorage : sessionStorage;
    if (sessionId) {
      storage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    } else {
      storage.removeItem(STORAGE_KEYS.SESSION_ID);
    }
  }, [sessionId]);

  useEffect(() => {
    const startSession = async () => {
      if (isOpen && !sessionId) {
        try {
          const isSystemUser = isAuthenticated();
          
          const userContext = {
            isAuthenticated: isSystemUser,
            userType: isSystemUser ? 'system' : 'public'
          };
          
          const response = await chatbotAPI.startSession(userContext);
          const data = await response.json();
          
          if (data.success) {
            setSessionId(data.data.sessionId);
          }
        } catch (error) {
          console.error("Vincent: Failed to start chat session:", error);
        }
      }
    };

    startSession();
  }, [isOpen, sessionId]);

  useEffect(() => {
    const loadQuickActions = async () => {
      try {
        const response = await chatbotAPI.getQuickActions();
        const data = await response.json();
        
        if (data.success) {
          setQuickActions(data.data.map(action => action.action_text));
        }
      } catch (error) {
        console.error("Vincent: Failed to load quick actions:", error);
        setQuickActions([
          "Types of Services",
          "Request a Service",
          "Payment Options",
          "Pricing Info",
        ]);
      }
    };

    loadQuickActions();
  }, []);

  useEffect(() => {
    const clearVincentData = () => {
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.IS_OPEN);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      sessionStorage.removeItem(STORAGE_KEYS.MESSAGES);
      sessionStorage.removeItem(STORAGE_KEYS.IS_OPEN);
      
      // End session if exists
      if (sessionId) {
        chatbotAPI.endSession(sessionId).catch(console.error);
      }
      
      // Reset state
      setSessionId(null);
      setMessages([]);
      setIsOpen(false);
    };

    window.addEventListener('user-logout', clearVincentData);

    if (isAuthenticated()) {
      const checkTokenInterval = setInterval(() => {
        const hasToken = !!localStorage.getItem('h2quote_token');
        const hasVincentSession = !!localStorage.getItem(STORAGE_KEYS.SESSION_ID);
        
        if (!hasToken && hasVincentSession) {
          clearVincentData();
        }
      }, 500);

      return () => {
        window.removeEventListener('user-logout', clearVincentData);
        clearInterval(checkTokenInterval);
      };
    } else {
      return () => {
        window.removeEventListener('user-logout', clearVincentData);
      };
    }
  }, [sessionId]);

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseChat();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(sessionId, currentInput);
      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: data.data.botMessage.id,
          text: data.data.botMessage.text,
          sender: "bot",
          timestamp: new Date(data.data.botMessage.timestamp),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error("Failed to get bot response");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      
      const errorMessage = {
        id: Date.now(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    if (!sessionId || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: action,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(sessionId, action);
      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: data.data.botMessage.id,
          text: data.data.botMessage.text,
          sender: "bot",
          timestamp: new Date(data.data.botMessage.timestamp),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error("Failed to get bot response");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      
      const errorMessage = {
        id: Date.now(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedMessage = (text) => {
    return text.split('\n').map((line, index) => {
      const linkWithTextMatch = line.match(/🔗\s*\[(.*?)\|(.*?)\]/);
      if (linkWithTextMatch) {
        const url = linkWithTextMatch[1];
        const linkText = linkWithTextMatch[2];
        return (
          <a
            key={index}
            href={url}
            target="_self"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-100 underline block mt-1 mb-1"
          >
            {linkText}
          </a>
        );
      }
      
      const linkMatch = line.match(/🔗\s*\[(.*?)\]/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[1]}
            target="_self"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-100 underline block mt-1 mb-1"
          >
            Click here to visit
          </a>
        );
      }
      
      return line ? <div key={index}>{line}</div> : <br key={index} />;
    });
  };

  return (
    <>
      {/* Chat Button */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen ? "scale-0" : "scale-100"
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0260A0] cursor-pointer text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center w-16 h-16"
        >
          <AiFillMessage size={40} />
        </button>
      </div>

      {/* Backdrop and Chat Window Container */}
      <div
        className={`fixed inset-0 transition-all duration-300 ${
          isOpen
            ? "bg-black/60 z-[9999] opacity-100"
            : "bg-transparent z-[-1] opacity-0 pointer-events-none"
        }`}
        onClick={handleBackdropClick}
      >
        {/* Chat Window */}
        <div
          className={`fixed bottom-6 right-6 transition-all duration-300 ${
            isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        >
          <div className="rounded-3xl shadow-2xl w-120 h-150 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-[#1B4781] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10">
                  <img src="/images/logos/Vincent.png" alt="Vincent Logo" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm italic">
                    CHAT WITH VINCENT
                  </h3>
                </div>
              </div>
              <button
                onClick={handleCloseChat}
                className="text-white hover:text-gray-200 transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Messages or Logo */}
            <div className="flex-1 space-y-3 p-4 bg-gray-50 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full ">
                  <div className="w-20 h-20">
                    <img
                      src="/images/logos/Vincent-fill.png"
                      alt="Vincent Logo"
                      className="object-contain"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.sender === "user"
                            ? "bg-[#1B4781] text-gray-200 rounded-br-none"
                            : "bg-[#1B4781] text-gray-200 rounded-bl-none"
                        }`}
                      >
                        {message.sender === "bot" ? (
                          <div className="whitespace-pre-line">
                            {renderFormattedMessage(message.text)}
                          </div>
                        ) : (
                          message.text
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#1B4781] text-gray-200 rounded-lg rounded-bl-none px-4 py-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 0 && (
              <div className="px-4 py-2 bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      disabled={isLoading}
                      className="bg-[#285F9B] text-white text-xs p-3 rounded-lg hover:scale-102 transition-colors text-start cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-gray-50">
              <div className="relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={isLoading ? "Waiting for response..." : "Type your message here..."}
                  disabled={isLoading}
                  className="w-full border border-gray-500 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#1B4781] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#1B4781] p-2 rounded-full cursor-pointer hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-[#1B4781] border-t-transparent rounded-full"></div>
                  ) : (
                    <IoSend size={20}/>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Vincent;