import React, { useState } from 'react';
import { 
  Columns, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Info 
} from 'lucide-react';
import { aiAPI } from '../utils/api.js';

export default function Compare({ language }) {
  const [loans, setLoans] = useState([
    {
      bankName: 'SBI MSME Loan',
      interestRate: '8.75%',
      processingFee: '0.5% (Min ₹5,000)',
      maxLoanAmount: '₹15,00,000',
      repaymentPeriod: '5 Years'
    },
    {
      bankName: 'HDFC Business Credit',
      interestRate: '11.5%',
      processingFee: '1.5%',
      maxLoanAmount: '₹20,00,000',
      repaymentPeriod: '7 Years'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  const handleAddLoan = () => {
    setLoans([
      ...loans,
      {
        bankName: `Lender ${loans.length + 1}`,
        interestRate: '9.0%',
        processingFee: '1.0%',
        maxLoanAmount: '₹10,00,000',
        repaymentPeriod: '5 Years'
      }
    ]);
  };

  const handleRemoveLoan = (idx) => {
    if (loans.length <= 1) {
      alert('Must compare at least one loan.');
      return;
    }
    setLoans(loans.filter((_, i) => i !== idx));
  };

  const handleInputChange = (idx, field, value) => {
    const updated = [...loans];
    updated[idx][field] = value;
    setLoans(updated);
  };

  const handleRunComparison = async (e) => {
    e.preventDefault();
    setLoading(true);
    setComparisonResult(null);

    try {
      const data = await aiAPI.compareLoans(loans);
      setComparisonResult(data);
    } catch (err) {
      alert('Failed to compare loans. Check your Gemini API key configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 py-4 text-left">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-white">Loan Comparison Assistant</h1>
        <p className="text-xs text-slate-400 mt-1">
          Compare interest rates, processing fees, repayment periods, and structural terms side-by-side to find the optimal financing option.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Editor Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Loan Profiles</h3>
              <button
                type="button"
                onClick={handleAddLoan}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lender
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {loans.map((loan, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveLoan(idx)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-400 transition-colors"
                    title="Remove Loan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-xs font-bold text-indigo-400">Option #{idx + 1}</div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Lender / Scheme Name</label>
                      <input
                        type="text"
                        value={loan.bankName}
                        onChange={(e) => handleInputChange(idx, 'bankName', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white glass-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Interest Rate (%)</label>
                      <input
                        type="text"
                        value={loan.interestRate}
                        onChange={(e) => handleInputChange(idx, 'interestRate', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white glass-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Processing Fee</label>
                      <input
                        type="text"
                        value={loan.processingFee}
                        onChange={(e) => handleInputChange(idx, 'processingFee', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white glass-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Max Loan Amount</label>
                      <input
                        type="text"
                        value={loan.maxLoanAmount}
                        onChange={(e) => handleInputChange(idx, 'maxLoanAmount', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white glass-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Repayment Period</label>
                      <input
                        type="text"
                        value={loan.repaymentPeriod}
                        onChange={(e) => handleInputChange(idx, 'repaymentPeriod', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs text-white glass-input"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRunComparison}
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-primary text-white hover:opacity-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all uppercase tracking-wider font-display pt-3"
            >
              {loading ? 'Evaluating Loan Deck...' : 'Run AI Comparison'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3.5"></div>
              Calculating interest amortization and mapping credit conditions using Gemini 2.5 Flash...
            </div>
          ) : !comparisonResult ? (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[50vh] space-y-3">
              <Columns className="w-8 h-8 text-slate-500" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">Awaiting Loan Inputs</h4>
                <p className="max-w-xs text-[11px] leading-relaxed">
                  Modify the loan parameters on the left and click **Run AI Comparison** to view pros, cons, and calculations.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Spotlight Recommendation */}
              <div className="bg-gradient-secondary rounded-2xl p-6 border border-indigo-500/25 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center gap-2.5 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  AI Recommended Selection
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-extrabold text-white font-display">
                    {comparisonResult.bestRecommendation.recommendedBank}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {comparisonResult.bestRecommendation.reason}
                  </p>
                  
                  {comparisonResult.bestRecommendation.savingsComparison && (
                    <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl text-xs text-indigo-300">
                      <Info className="w-4.5 h-4.5 shrink-0 text-indigo-400" />
                      <span>{comparisonResult.bestRecommendation.savingsComparison}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparative Matrix Cards */}
              <div className="space-y-4">
                <h3 className="text-base font-bold font-display text-white">Comparative Matrix</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {comparisonResult.comparisonTable.map((bank, idx) => (
                    <div key={idx} className="glass-card rounded-xl border border-white/5 p-4.5 space-y-4">
                      <div className="border-b border-white/5 pb-2.5">
                        <h4 className="text-xs font-bold text-white font-display">{bank.bankName}</h4>
                      </div>

                      {/* Parameters list */}
                      <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block font-semibold">Interest Rate:</span>
                          <span className="text-slate-200">{bank.interestRate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Processing Fee:</span>
                          <span className="text-slate-200">{bank.processingFee}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Max Amount:</span>
                          <span className="text-slate-200">{bank.maxLoanAmount}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Repayment Period:</span>
                          <span className="text-slate-200">{bank.repaymentPeriod}</span>
                        </div>
                      </div>

                      {/* Pros & Cons */}
                      <div className="space-y-3.5 pt-3 border-t border-white/5">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block">Pros</span>
                          <ul className="space-y-1">
                            {bank.keyPros.map((pro, pIdx) => (
                              <li key={pIdx} className="text-[10px] text-slate-300 flex items-start gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 block">Cons</span>
                          <ul className="space-y-1">
                            {bank.keyCons.map((con, cIdx) => (
                              <li key={cIdx} className="text-[10px] text-slate-300 flex items-start gap-1">
                                <XCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
