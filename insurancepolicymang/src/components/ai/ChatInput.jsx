import React, { useState } from 'react';
import Button from '../common/Button';

const ChatInput = ({ onSend, loading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSend(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 bg-white p-4 border-t border-slate-100">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask something (e.g., 'Compare policies', 'How to claim?')..."
        disabled={loading}
        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 disabled:opacity-50"
      />
      <Button type="submit" loading={loading} disabled={!text.trim()} className="rounded-xl px-5">
        Send
      </Button>
    </form>
  );
};

export default ChatInput;
