import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Bot, 
  User, 
  Layers, 
  Trash2, 
  FileText, 
  BookOpen, 
  Globe, 
  AlertCircle 
} from 'lucide-react';
import { documentAPI, aiAPI } from '../utils/api.js';

export default function Chat({ language }) {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('docId');

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
    fetchChatHistory();
  }, []);

  // Update selected doc if URL params change
  useEffect(() => {
    if (initialDocId) {
      setSelectedDocId(initialDocId);
    }
  }, [initialDocId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchDocuments = async () => {
    try {
      const data = await documentAPI.getAll();
      setDocuments(data);
    } catch (e) {
      console.error('Failed to load documents', e);
    }
  };

  const fetchChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await aiAPI.getHistory();
      const formatted = history.map(chat => ({
        id: chat._id,
        sender: 'user',
        text: chat.message,
        timestamp: chat.timestamp
      })).reduce((acc, current, idx, arr) => {
        // Find matching response
        const matchingResponse = history[idx];
        acc.push({
          sender: 'user',
          text: matchingResponse.message,
          timestamp: matchingResponse.timestamp
        });
        acc.push({
          sender: 'bot',
          text: matchingResponse.response,
          sources: [], // Historical sources not saved in db, but response is
          timestamp: matchingResponse.timestamp
        });
        return acc;
      }, []);
      
      // Filter out double insertions (the reduce inserts 2 items per index, we should just iterate pairs)
      const pairsOnly = [];
      for (let i = 0; i < history.length; i++) {
        pairsOnly.push({
          sender: 'user',
          text: history[i].message,
          timestamp: history[i].timestamp
        });
        pairsOnly.push({
          sender: 'bot',
          text: history[i].response,
          sources: [],
          timestamp: history[i].timestamp
        });
      }

      setMessages(pairsOnly);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiAPI.chat(userMessage.text, selectedDocId || null, language);
      const botMessage = {
        sender: 'bot',
        text: response.response,
        sources: response.sources || [],
        timestamp: response.timestamp
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `Error: ${err.response?.data?.error || 'Failed to query AI Assistant. Make sure your API key is correct.'}`,
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all conversation history?')) return;
    try {
      await aiAPI.clearHistory();
      setMessages([]);
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find currently active document for the details side panel
  const activeDocument = documents.find(d => d._id === selectedDocId);

  return (
    <div className="grid lg:grid-cols-3 gap-8 py-4 h-[calc(100vh-140px)]">
      {/* Left Columns - Chat Stream */}
      <div className="lg:col-span-2 flex flex-col glass-card rounded-2xl border border-white/5 overflow-hidden h-full">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-300">Search Scope:</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl text-xs text-white glass-input font-medium"
            >
              <option value="">Query All Vault Files</option>
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  Only: {doc.fileName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Response Mode: {language}
            </span>
            <button
              onClick={handleClearHistory}
              disabled={messages.length === 0}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mb-2"></div>
              Loading chat logs...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center space-y-4 px-6">
              <div className="bg-indigo-500/10 p-4 rounded-full text-indigo-400">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">Start a Conversation</h4>
                <p className="max-w-xs text-[11px] leading-relaxed">
                  Ask questions about repayment rates, eligibility rules, missing papers, or loan parameters.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isBot = msg.sender === 'bot';
              return (
                <div 
                  key={idx} 
                  className={`flex gap-3.5 max-w-3xl ${
                    isBot ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                  } animate-fadeIn`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 h-fit ${
                    isBot ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="space-y-2">
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isBot 
                        ? msg.isError 
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                          : 'bg-white/5 border border-white/5 text-slate-200'
                        : 'bg-gradient-primary text-white text-left'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Sources / Citations */}
                    {isBot && msg.sources?.length > 0 && (
                      <div className="space-y-1.5 ml-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          RAG Retrieved Sources ({msg.sources.length})
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <details key={sIdx} className="bg-white/5 border border-white/5 rounded-lg text-[10px] text-slate-300">
                              <summary className="px-2.5 py-1.5 font-semibold cursor-pointer hover:bg-white/5 flex items-center justify-between">
                                <span>Source Chunk #{sIdx + 1}</span>
                                <span className="text-[9px] text-slate-400">Match: {Math.round(src.score * 100)}%</span>
                              </summary>
                              <p className="px-2.5 pb-2 pt-1 text-slate-400 leading-relaxed text-left whitespace-pre-wrap border-t border-white/5">
                                {src.text}
                              </p>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex gap-3.5 mr-auto">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 h-fit">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span>Gemini is reading matching context...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-slate-900/40 flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a question in ${language}...`}
            className="flex-1 px-4 py-3 rounded-xl text-xs text-white glass-input"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-primary hover:opacity-95 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      {/* Right Column - Context Side Panel */}
      <div className="hidden lg:block h-full overflow-y-auto">
        {activeDocument ? (
          <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-6 text-left">
            <div className="flex items-center gap-2.5 pb-4.5 border-b border-white/5">
              <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white line-clamp-1">{activeDocument.fileName}</h3>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Selected Context</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Short Summary */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Doc Summary</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {activeDocument.summary.shortSummary}
                </p>
              </div>

              {/* Highlights */}
              {activeDocument.summary.highlights?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">Highlights</h4>
                  <ul className="space-y-1.5">
                    {activeDocument.summary.highlights.map((h, i) => (
                      <li key={i} className="text-[11px] text-slate-300 flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {activeDocument.summary.actionItems?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">Action Items</h4>
                  <ul className="space-y-1.5">
                    {activeDocument.summary.actionItems.map((item, i) => (
                      <li key={i} className="text-[11px] text-slate-300 flex items-start gap-2 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2">
              <a
                href={activeDocument.filePath}
                target="_blank"
                rel="noreferrer"
                className="w-full text-center block py-2.5 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 text-slate-300 transition-all"
              >
                Inspect Original Document
              </a>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-white/5 p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full space-y-3.5">
            <Layers className="w-8 h-8 text-slate-500" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-300">RAG Context Engine</h4>
              <p className="max-w-xs text-[11px] leading-relaxed">
                Select a specific document from the search scope dropdown to view its summary, highlights, and action list side-by-side.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
