import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MessageSquare, 
  CheckSquare, 
  Columns, 
  FileText, 
  Search, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';

export default function Home({ user }) {
  const features = [
    {
      title: 'Multimodal Document Upload',
      description: 'Supports PDFs, Word docs, raw text, and images. Parses complex details, terms, and tables instantly.',
      icon: FileText,
      color: 'text-indigo-400 bg-indigo-500/10'
    },
    {
      title: 'Context-Aware AI Chat',
      description: 'Conversational assistant queries the knowledge base of your documents using Gemini 2.5 Flash RAG pipeline.',
      icon: MessageSquare,
      color: 'text-purple-400 bg-purple-500/10'
    },
    {
      title: 'Eligibility Auditing',
      description: 'Enter your business metrics to evaluate eligibility, required documents, and next steps for schemes.',
      icon: CheckSquare,
      color: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      title: 'Structured Loan Comparison',
      description: 'Compares loan options, interest rates, margins, and repayment schedules side-by-side to recommend the best pick.',
      icon: Columns,
      color: 'text-amber-400 bg-amber-500/10'
    }
  ];

  const steps = [
    { num: '01', title: 'Upload Files', text: 'Drag-and-drop loan applications, government schemes, invoices, or bank forms.' },
    { num: '02', title: 'Automated Summaries', text: 'Get high-level details, pros/cons, and checklists instantly.' },
    { num: '03', title: 'Interact with AI', text: 'Chat, perform gap audits for documents, and evaluate eligibility.' }
  ];

  return (
    <div className="space-y-20 py-8 lg:py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
          <ShieldCheck className="w-3.5 h-3.5" /> Next-Gen AI Financial Assistant
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-display text-white">
          Analyze and Query Your <span className="text-gradient">Financial Documents</span> Instantly
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Unlock the power of Gemini 2.5 Flash and RAG to summarize lengthy PDFs, find missing documents, audit criteria, and compare loans in seconds.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              to="/dashboard"
              className="px-8 py-3.5 text-sm font-bold rounded-2xl bg-gradient-primary text-white shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all glow-btn"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-8 py-3.5 text-sm font-bold rounded-2xl bg-gradient-primary text-white shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all glow-btn"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 text-sm font-bold rounded-2xl bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-2.5 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-white">Advanced AI Features</h2>
          <p className="text-sm text-slate-400">Everything you need to navigate loans and schemes efficiently.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col gap-4">
                <div className={`${feat.color} p-3 rounded-xl w-fit`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white font-display">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card rounded-3xl p-8 lg:p-12 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl w-fit">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold font-display text-white">Simplified Workflow</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We process text and media files through high-density vector databases to offer zero-latency queries.
            </p>
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="space-y-3 relative">
                <div className="text-3xl font-extrabold text-indigo-500/40 font-display">{step.num}</div>
                <h4 className="text-sm font-bold text-slate-200">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
