import React, { useState, useRef, useEffect } from "react";
import { AiFillMessage } from "react-icons/ai";
import { IoSend } from "react-icons/io5";

const Vincent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // Start with empty messages
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse = generateBotResponse(currentInput);
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    const userMessage = {
      id: messages.length + 1,
      text: action,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse = generateBotResponse(action);
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const generateBotResponse = (userInput) => {
    const responses = [
      "Thank you for your inquiry! TRISHKAYE Enterprises offers comprehensive water treatment solutions. Would you like to know more about our specific services?",
      "Great question! We provide chemical cleaning, descaling, and water treatment chemicals. What type of facility are you working with?",
      "I'd be happy to help you with pricing information. For detailed quotes, I can connect you with our team through the service request system.",
      "TRISHKAYE has been serving industrial clients since 2000. We work with companies like JMATERIALS CORPORATION and AMKOR TECHNOLOGY. How can we assist your business?",
      "Our services include water testing, laboratory analysis, and pipeline disinfection. What specific water treatment needs do you have?",
      "For immediate assistance, you can also contact our team directly or submit a service request through our system. Is there anything specific I can help clarify?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickActions = [
    "Types of Services",
    "Request a Service",
    "Payment Options",
    "Pricing Info",
  ];

  const handleBackdropClick = (e) => {
    // Close the chat if clicking on the backdrop (not the chat window)
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
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
                    VINCENT CHATBOT
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
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
            <div className="flex-1 space-y-3 p-4 bg-gray-50">
              {messages.length === 0 ? (
                // Show logo in center when no messages
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
                // Show messages when conversation has started
                messages.map((message) => (
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
                      {message.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions - only show when no messages */}
            {messages.length === 0 && (
              <div className="px-4 py-2 bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      className="bg-[#285F9B] text-white text-xs p-3 rounded-lg hover:scale-102 transition-colors text-start cursor-pointer"
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
                    if (e.key === "Enter") {
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Do you supply chemicals only without the service?"
                  className="w-full border border-gray-500 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#1B4781]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#1B4781] p-2 rounded-full cursor-pointer hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <IoSend size={20}/>
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
