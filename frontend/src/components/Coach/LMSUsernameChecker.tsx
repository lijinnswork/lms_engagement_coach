import React, { useState, useRef, useEffect } from 'react';
import { Send, UserCheck, RefreshCw, AlertCircle, BookOpen } from 'lucide-react';

interface Enrollment {
  course_name: string;
  course_id: string;
  is_active: boolean;
  grade?: {
    grade_percent: number;
    letter_grade: string | null;
    passed: boolean;
  };
  progress?: {
    progress_percent: number;
    total_items: number;
    completed_items: number;
  };
}

interface Message {
  sender: 'user' | 'bot';
  text?: string;
  enrollments?: Enrollment[];
  error?: string;
}

export const LMSUsernameChecker: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hi! Enter any LMS username (e.g., crispybot, Vishal-Reddy_456, Vishal12345) to fetch their current courses and progress from iimbx.edu.in.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const username = input.trim();
    if (!username || isTyping) return;

    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text: username }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`/api/coach/lms-check/${username}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch details');
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Here are the courses found for "${username}":`,
          enrollments: data.enrollments
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          error: err.message || 'An error occurred while checking the LMS.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-secondary dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-bg-primary dark:bg-bg-dark border-b border-border-light dark:border-border-dark">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserCheck size={20} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] text-text-primary">LMS Username Checker</h2>
            <p className="text-[12px] text-text-secondary">Direct Live Verification (iimbx.edu.in)</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-secondary dark:bg-bg-dark">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-text-primary text-bg-primary rounded-tr-none'
                  : 'bg-bg-primary dark:bg-bg-dark border border-border-light dark:border-border-dark text-text-primary rounded-tl-none'
              }`}
            >
              {msg.text && <p className="text-[14px] leading-relaxed font-medium mb-2">{msg.text}</p>}

              {/* Render Enrollments */}
              {msg.enrollments && msg.enrollments.length > 0 && (
                <div className="space-y-3 mt-3">
                  {msg.enrollments.map((course, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-bg-secondary dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg flex flex-col space-y-2 text-text-primary"
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                          <BookOpen size={16} className="text-emerald-500 shrink-0" />
                          <span className="font-bold text-[13px] line-clamp-2">
                            {course.course_name}
                          </span>
                        </div>
                        {course.grade && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                            Grade: {(course.grade.grade_percent * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-secondary select-all font-mono">
                        {course.course_id}
                      </span>
                      
                      {course.progress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-text-secondary">
                            <span>
                              {course.progress.completed_items} / {course.progress.total_items} items
                            </span>
                            <span>{course.progress.progress_percent.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${course.progress.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {msg.enrollments && msg.enrollments.length === 0 && (
                <p className="text-[13px] italic text-text-secondary mt-2">
                  No course enrollments found for this user.
                </p>
              )}

              {/* Render Error */}
              {msg.error && (
                <div className="flex items-center space-x-2 text-red-500 dark:text-red-400 mt-1">
                  <AlertCircle size={16} />
                  <span className="text-[13px] font-medium">{msg.error}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-bg-primary dark:bg-bg-dark border border-border-light dark:border-border-dark text-text-primary rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center space-x-2">
              <RefreshCw size={14} className="animate-spin text-emerald-500" />
              <span className="text-[13px] text-text-secondary font-medium">Checking LMS live data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-bg-primary dark:bg-bg-dark border-t border-border-light dark:border-border-dark flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          placeholder={isTyping ? "Fetching..." : "Enter username (e.g. Vishal12345)"}
          className="flex-1 bg-bg-secondary dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-full px-5 py-2.5 text-[14px] text-text-primary focus:outline-none focus:border-emerald-500 shadow-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
