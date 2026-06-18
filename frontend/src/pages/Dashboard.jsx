import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ListChecks, 
  MessageSquareShare, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Key,
  FolderOpen
} from 'lucide-react';
import { documentAPI, aiAPI } from '../utils/api.js';

export default function Dashboard({ language }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [activeDocId, setActiveDocId] = useState(null); // Expanded summary card
  const [apiKeyActive, setApiKeyActive] = useState(false);

  // Missing documents checker state
  const [schemes, setSchemes] = useState([
    {
      id: 'scheme_mudra_1',
      name: 'Pradhan Mantri Mudra Yojana (PMMY)',
      docs: ["Aadhaar Card", "PAN Card", "Business Quotation or Project Report", "Proof of Business Address (Utility bill, GST registration)", "Bank Statement (Last 6 Months)"]
    },
    {
      id: 'scheme_cmyuva_2',
      name: 'Chief Minister Yuva Swarozgar Yojana (CMYSY)',
      docs: ["Aadhaar Card", "10th Marksheet or Certificate", "Domicile Certificate", "Income Certificate", "Detailed Project Report (DPR)"]
    },
    {
      id: 'scheme_standup_3',
      name: 'Stand-Up India Scheme',
      docs: ["Aadhaar Card", "PAN Card", "SC/ST Category Certificate (if applicable)", "Project Report for Greenfield venture", "Company Incorporation / Partnership Deed"]
    }
  ]);
  const [selectedSchemeId, setSelectedSchemeId] = useState('scheme_mudra_1');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);

  useEffect(() => {
    fetchDocuments();
    checkApiKey();
    
    // Add window listener to detect API Key save updates
    const handleStorageChange = () => checkApiKey();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkApiKey = () => {
    const key = localStorage.getItem('gemini_api_key');
    setApiKeyActive(!!key);
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const data = await documentAPI.getAll();
      setDocuments(data);
    } catch (e) {
      console.error('Failed to load documents', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const newDoc = await documentAPI.upload(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload document. Please ensure it is a valid format (PDF, DOCX, TXT, JPG, PNG).');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id, e) => {
    e.stopPropagation(); // Prevent card expansion
    if (!window.confirm('Are you sure you want to delete this document? This will remove its search context.')) return;

    try {
      await documentAPI.delete(id);
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      if (activeDocId === id) setActiveDocId(null);
      if (auditReport) setAuditReport(null);
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const toggleExpandDoc = (id) => {
    setActiveDocId(activeDocId === id ? null : id);
  };

  const handleAuditDocuments = async () => {
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme) return;

    setAuditLoading(true);
    setAuditReport(null);

    // Collect all uploaded doc IDs
    const docIds = documents.map(d => d._id);

    try {
      const report = await aiAPI.checkMissingDocs(scheme.name, scheme.docs, docIds);
      setAuditReport(report);
    } catch (err) {
      console.error(err);
      alert('Audit failed. Ensure Gemini API Key is configured.');
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="space-y-10 py-4">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-white">Document Vault</h1>
          <p className="text-xs text-slate-400">Upload forms, proofs, or scheme files to build your local AI knowledge base.</p>
        </div>
        
        {!apiKeyActive && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Please configure your **Gemini API Key** in the navbar to enable parsing!</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Zone & Documents List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag & Drop Zone */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-indigo-500/30 rounded-xl p-8 text-center transition-colors relative">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <div className="bg-indigo-500/10 p-4 rounded-xl text-indigo-400 mb-3.5">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Upload Document</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PDF, DOCX, TXT, JPG, PNG (Max 10MB)
              </p>
            </div>

            {/* Uploading progress bar */}
            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                  <span>Extracting text & creating embeddings...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-primary h-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Uploaded Documents Vault */}
          <div className="space-y-4.5">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <FolderOpen className="w-4.5 h-4.5 text-indigo-400" />
              Your Uploaded Files
            </h2>

            {loadingDocs ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto mb-3"></div>
                Loading documents vault...
              </div>
            ) : documents.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center text-slate-400 text-xs">
                No files uploaded yet. Add forms, invoices, or scheme guidelines to start.
              </div>
            ) : (
              <div className="space-y-3.5">
                {documents.map((doc) => {
                  const isExpanded = activeDocId === doc._id;
                  return (
                    <div 
                      key={doc._id} 
                      className={`glass-card rounded-xl border transition-all ${
                        isExpanded ? 'border-indigo-500/30 bg-slate-900/50' : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Card Header */}
                      <div 
                        onClick={() => toggleExpandDoc(doc._id)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400">
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{doc.fileName}</h4>
                            <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(doc.uploadDate).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span className="uppercase text-[9px] font-semibold bg-white/5 px-1.5 py-0.5 rounded text-slate-300">
                                {doc.fileType.split('/')[1] || 'DOC'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={(e) => handleDeleteDoc(doc._id, e)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
                        </div>
                      </div>

                      {/* Expandable Summary Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4.5 pt-1.5 border-t border-white/5 text-left space-y-4 animate-fadeIn">
                          {/* Short Summary */}
                          <div>
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Summary</h5>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {doc.summary.shortSummary}
                            </p>
                          </div>

                          {/* Highlights */}
                          {doc.summary.highlights?.length > 0 && (
                            <div>
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">Key Highlights</h5>
                              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-300">
                                {doc.summary.highlights.map((h, i) => (
                                  <li key={i} className="flex items-start gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                                    <span>{h}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action Items */}
                          {doc.summary.actionItems?.length > 0 && (
                            <div>
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">Required Action Items</h5>
                              <div className="space-y-1.5">
                                {doc.summary.actionItems.map((item, i) => (
                                  <div key={i} className="flex items-center gap-2.5 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                                    <input 
                                      type="checkbox" 
                                      id={`action_${doc._id}_${i}`} 
                                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0" 
                                    />
                                    <label htmlFor={`action_${doc._id}_${i}`} className="text-xs text-slate-300 cursor-pointer">
                                      {item}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action links */}
                          <div className="flex gap-3 pt-2.5">
                            <button
                              onClick={() => navigate(`/chat?docId=${doc._id}`)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                            >
                              <MessageSquareShare className="w-3.5 h-3.5" />
                              Chat with Document
                            </button>
                            <a
                              href={doc.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 text-slate-300 transition-all"
                            >
                              View Original
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Missing Document Auditor Panel */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-5 text-left h-fit">
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-indigo-400" />
                Missing Document Audit
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check whether your uploaded documents satisfy requirements for standard government financial schemes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Scheme Target</label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => {
                    setSelectedSchemeId(e.target.value);
                    setAuditReport(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white glass-input font-medium"
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-300">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Requirements checklist preview */}
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Required Document Checklist:</h4>
                <ul className="space-y-1.5">
                  {schemes.find(s => s.id === selectedSchemeId)?.docs.map((docName, idx) => (
                    <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{docName}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleAuditDocuments}
                disabled={documents.length === 0 || auditLoading}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-primary text-white hover:opacity-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
              >
                {auditLoading ? 'Auditing Vault...' : 'Audit Uploaded Documents'}
              </button>
            </div>

            {/* Audit Result Report */}
            {auditReport && (
              <div className="mt-2 border-t border-white/5 pt-4 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Audit Result</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    auditReport.missingCount === 0 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {auditReport.missingCount === 0 ? 'Complete' : `${auditReport.missingCount} Missing`}
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
                  {auditReport.summary}
                </p>

                {auditReport.missing?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400">Missing Documents:</h4>
                    <div className="space-y-2">
                      {auditReport.missing.map((m, i) => (
                        <div key={i} className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                          <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 text-left">
                            <span className="font-bold text-slate-200 block">{m.documentName}</span>
                            <span className="text-[10px] text-red-300 font-semibold bg-red-500/10 px-1.5 py-0.2 rounded w-fit block my-1">
                              {m.importance}
                            </span>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{m.relevance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {auditReport.missingCount === 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-400">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-semibold">Perfect Match! You have uploaded all necessary forms for this scheme.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
