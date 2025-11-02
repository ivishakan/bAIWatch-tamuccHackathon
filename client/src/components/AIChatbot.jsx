import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI Emergency Assistant. I can help you with:\n\n• Emergency preparedness tips\n• Weather hazard information\n• Evacuation planning\n• Supply checklist guidance\n• Real-time safety alerts\n\nHow can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Simulate AI response (replace with actual API call)
      setTimeout(() => {
        const aiResponse = generateAIResponse(inputMessage);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        }]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
      setIsTyping(false);
    }
  };

  const generateAIResponse = (message) => {
    const lowerMsg = message.toLowerCase();
    
    // Emergency preparedness
    if (lowerMsg.includes('hurricane') || lowerMsg.includes('storm')) {
      return '🌀 **Hurricane Safety:**\n\n1. Secure outdoor items\n2. Stock up on water (1 gal/person/day for 3 days)\n3. Fill prescriptions\n4. Charge devices\n5. Know your evacuation zone\n\nWould you like specific evacuation routes or shelter information?';
    }
    
    if (lowerMsg.includes('flood')) {
      return '🌊 **Flood Safety:**\n\n• Never walk/drive through flood water\n• Move to higher ground immediately\n• Turn off utilities if safe\n• Avoid downed power lines\n\nCheck your flood zone at FEMA.gov. Need help finding evacuation routes?';
    }
    
    if (lowerMsg.includes('tornado')) {
      return '🌪️ **Tornado Safety:**\n\n• Go to lowest floor, interior room\n• Stay away from windows\n• Cover yourself with mattress/blankets\n• Monitor weather radio/alerts\n\nDo you have a safe room identified in your home?';
    }
    
    if (lowerMsg.includes('evacuation') || lowerMsg.includes('evacuate')) {
      return '🚗 **Evacuation Tips:**\n\n1. Follow official evacuation orders\n2. Take "go bag" with essentials\n3. Fill gas tank\n4. Notify family/friends\n5. Know multiple routes\n\nWould you like me to help you plan an evacuation route?';
    }
    
    if (lowerMsg.includes('checklist') || lowerMsg.includes('supplies')) {
      return '📋 **Essential Emergency Supplies:**\n\n✓ Water (3-day supply)\n✓ Non-perishable food\n✓ Flashlight + batteries\n✓ First aid kit\n✓ Medications\n✓ Important documents\n✓ Cash\n✓ Phone chargers\n\nWant a personalized checklist based on your household?';
    }
    
    if (lowerMsg.includes('alert') || lowerMsg.includes('notification')) {
      return '🔔 **Stay Informed:**\n\nI can help you set up emergency alerts via:\n• Email notifications\n• SMS text messages\n• Real-time weather updates\n\nGo to Alert Settings to configure your preferences!';
    }
    
    if (lowerMsg.includes('weather')) {
      return '🌦️ **Weather Monitoring:**\n\nI can provide:\n• Current conditions\n• Severe weather alerts\n• 5-day forecasts\n• Hazard analysis\n\nWhat\'s your location? I can check for active weather alerts in your area.';
    }

    // Default response
    return '🤖 I\'m here to help with emergency preparedness! I can assist with:\n\n• Hurricane, flood, tornado safety\n• Evacuation planning\n• Supply checklists\n• Weather alerts\n• Emergency contacts\n\nWhat would you like to know more about?';
  };

  const quickActions = [
    { icon: '🌀', label: 'Hurricane Tips', query: 'Tell me about hurricane safety' },
    { icon: '🚗', label: 'Evacuation Routes', query: 'Help me plan evacuation' },
    { icon: '📋', label: 'Supply Checklist', query: 'What supplies do I need?' },
    { icon: '🌦️', label: 'Weather Alerts', query: 'Check weather alerts' }
  ];

  return (
    <>
      {/* Chat Button - Hidden */}
      
      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transition-all duration-300 ease-out ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Emergency Assistant</h3>
              <p className="text-xs text-white/80">Online • Ready to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="h-[420px] overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputMessage(action.query);
                    handleSendMessage();
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-xs font-medium transition flex items-center gap-1"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="w-10 h-10 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
