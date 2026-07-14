import React from 'react';

const ChatBubble = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] gap-3.5 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase ${isUser ? 'bg-blue-600' : 'bg-slate-700'}`}>
          {isUser ? 'ME' : 'AI'}
        </div>
        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
        }`}>
          <p className="whitespace-pre-line">{message.content}</p>
          <span className={`text-[10px] block mt-1.5 text-right ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
