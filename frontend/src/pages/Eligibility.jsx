import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  HelpCircle, 
  Award, 
  ArrowRight, 
  XCircle, 
  AlertCircle, 
  PlusCircle, 
  Briefcase 
} from 'lucide-react';
import { documentAPI, aiAPI } from '../utils/api.js';

export default function Eligibility({ language }) {
  // Form input states
  const [age, setAge] = useState(25);
  const [education, setEducation] = useState('Graduate');
  const [businessType, setBusinessType] = useState('Service');
  const [investmentAmount, setInvestmentAmount] = useState(150000);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const educationOptions = [
    'Under 10th Class',
    '10th Pass (High School)',
    '12th Pass (Higher Secondary)',
    'Graduate',
    'Postgraduate'
  ];

  const businessOptions = [
    'Manufacturing',
    'Service',
    'Retail / Trading',
    'Agriculture & Allied Activities',
    'Greenfield Startup (First-time venture)'
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await documentAPI.getAll();
      setDocuments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDocCheckboxChange = (id) => {
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCheckEligibility = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    const profile = {
      age: parseInt(age),
      education,
      businessType,
      investmentAmount: parseInt(investmentAmount),
      schemeIds: selectedDocIds
    };

    try {
      const report = await aiAPI.checkEligibility(profile);
      setResults(report.schemes || []);
    } catch (err) {
      alert('Failed to check eligibility. Please verify your Gemini API key is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 py-4 max-w-4xl mx-auto text-left">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-white">Scheme Eligibility Auditor</h1>
        <p className="text-xs text-slate-400 mt-1">
          Evaluate your eligibility for government schemes and financial loans based on your demographics and business profile.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Form Column */}
        <form onSubmit={handleCheckEligibility} className="md:col-span-2 glass-card rounded-2xl p-6 border border-white/5 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white mb-2 pb-2.5 border-b border-white/5 flex items-center gap-2">
            <Briefcase className="w-4.5 h-4.5 text-indigo-400" /> Profile Metrics
          </h3>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Applicant Age (Years)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="18"
              max="100"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white glass-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Educational Level</label>
            <select
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white glass-input font-medium"
            >
              {educationOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-slate-300">{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business / Sector Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white glass-input font-medium"
            >
              {businessOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-slate-300">{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Capital Investment Amount (INR)</label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              min="0"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white glass-input"
              required
            />
          </div>

          {/* Scheme file selectors */}
          {documents.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Audited Scheme Knowledge (Optional)
              </label>
              <p className="text-[9px] text-slate-400 leading-tight">
                Select uploaded files representing custom schemes to evaluate against instead of default databases.
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`check_scheme_${doc._id}`}
                      checked={selectedDocIds.includes(doc._id)}
                      onChange={() => handleDocCheckboxChange(doc._id)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <label htmlFor={`check_scheme_${doc._id}`} className="text-[11px] text-slate-300 truncate cursor-pointer" title={doc.fileName}>
                      {doc.fileName}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-primary text-white hover:opacity-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all uppercase tracking-wide pt-3"
          >
            {loading ? 'Evaluating Profile...' : 'Audit Eligibility'}
          </button>
        </form>

        {/* Results Column */}
        <div className="md:col-span-3 space-y-6">
          {loading ? (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3.5"></div>
              Evaluating eligibility parameters against schemes using Gemini 2.5 Flash...
            </div>
          ) : !results ? (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full space-y-3">
              <Award className="w-8 h-8 text-slate-500" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">Awaiting Profile Input</h4>
                <p className="max-w-xs text-[11px] leading-relaxed">
                  Fill in your age, education, and business type on the left to review which government schemes fit your parameters.
                </p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs">
              No matching schemes found. Adjust your profile variables or try uploading scheme details.
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-base font-bold font-display text-white">Eligible Programs & Schemes ({results.length})</h2>
              
              <div className="space-y-4">
                {results.map((scheme, idx) => {
                  const isEligible = scheme.status === 'Eligible';
                  const isPotential = scheme.status === 'Potentially Eligible';
                  
                  return (
                    <div 
                      key={idx} 
                      className={`glass-card rounded-xl border p-5 space-y-4.5 transition-all ${
                        isEligible 
                          ? 'border-emerald-500/25 bg-emerald-500/2' 
                          : isPotential 
                            ? 'border-amber-500/25 bg-amber-500/2' 
                            : 'border-red-500/20 bg-red-500/2 opacity-75'
                      }`}
                    >
                      {/* Title & Badge */}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-sm font-bold text-white font-display">{scheme.schemeName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                          isEligible 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : isPotential 
                              ? 'bg-amber-500/10 text-amber-400' 
                              : 'bg-red-500/10 text-red-400'
                        }`}>
                          {scheme.status}
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold block text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Evaluation Verdict:</span>
                        {scheme.reason}
                      </div>

                      {/* Documents and Next Steps layout */}
                      {(isEligible || isPotential) && (
                        <div className="grid sm:grid-cols-2 gap-4 pt-3.5 border-t border-white/5 text-xs">
                          {/* Documents Checklist */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-indigo-400 text-[10px] uppercase tracking-wider block">Prepare Required Forms:</span>
                            <ul className="space-y-1">
                              {scheme.requiredDocuments?.map((doc, dIdx) => (
                                <li key={dIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                  <span className="text-indigo-400 mt-0.5">•</span>
                                  <span>{doc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Next Steps Checklist */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider block">Application Roadmap:</span>
                            <ul className="space-y-1">
                              {scheme.nextSteps?.map((step, sIdx) => (
                                <li key={sIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
