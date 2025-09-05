"use client";

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No chat history yet. Ask your first question!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="bg-white rounded-lg shadow p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Question</h4>
              <span className="text-xs text-gray-500">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-700 mt-1">{message.question}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Answer</h4>
            <div className="text-gray-700 whitespace-pre-wrap">
              {message.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
