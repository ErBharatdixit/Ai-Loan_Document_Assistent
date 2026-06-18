import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MessageSquare, 
  CheckSquare, 
  Columns, 
  Key, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Globe 
} from 'lucide-react';

export default function Navbar({ user, onLogout, language, setLanguage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);
  }, []);

  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setShowKeyModal(false);
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowKeyModal(false);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Building2 },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Eligibility', path: '/eligibility', icon: CheckSquare },
    { name: 'Compare Loans', path: '/compare', icon: Columns },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass-card border-b border-white/5 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-display" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-gradient-primary p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Building2 className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-none">Bharat's AI Agent</span>
            <span className="text-xs font-medium text-slate-400">Document & Loan Assistant</span>
          </div>
        </Link>

        
        {user && (
          <div className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3.5">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'English' ? 'Hindi' : 'English')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold glass-input text-indigo-300 hover:text-white"
          >
            <Globe className="w-3.5 h-3.5" />
            {language}
          </button>

          {/* Gemini Key */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              apiKey 
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10' 
                : 'border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            {apiKey ? 'API Key Active' : 'Configure API Key'}
          </button>

          {/* Auth Controls */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-xs font-medium">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                {user.name}
              </div>
              <button
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-primary text-white glow-btn"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2.5">
          {/* Quick Lang Toggle on Mobile */}
          <button
            onClick={() => setLanguage(language === 'English' ? 'Hindi' : 'English')}
            className="p-2 rounded-xl text-indigo-400 bg-white/5"
          >
            <Globe className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3.5 pt-3.5 border-t border-white/5 flex flex-col gap-2.5 animate-fadeIn">
          {user && navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.name}
              </Link>
            );
          })}

          <hr className="border-white/5 my-1" />

          {/* Gemini Key Config Mobile */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setShowKeyModal(true);
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium border text-left ${
              apiKey 
                ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' 
                : 'border-amber-500/20 text-amber-400 bg-amber-500/5'
            }`}
          >
            <Key className="w-4.5 h-4.5" />
            {apiKey ? 'API Key Active' : 'Configure API Key'}
          </button>

          {/* Mobile Auth Status */}
          {user ? (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 text-slate-300">
              <span className="text-xs font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                {user.name}
              </span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                  navigate('/');
                }}
                className="flex items-center gap-1.5 text-xs text-red-400 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mx-4 py-2.5 text-center text-sm font-semibold rounded-xl bg-gradient-primary text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-white/10 shadow-2xl relative animate-scaleIn">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Configure Gemini API Key</h3>
                <p className="text-xs text-slate-400">Used securely on requests directly to the API</p>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white glass-input"
                  required
                />
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                🔒 Your API Key is stored locally in your browser's storage and is never saved permanently on our servers. It is sent as a secure header for AI operations.
              </div>

              <div className="flex items-center gap-3.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                >
                  Save API Key
                </button>
                {localStorage.getItem('gemini_api_key') && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    Clear Key
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
