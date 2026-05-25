import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Check, UploadCloud, FileText } from 'lucide-react';
import { fetchWithAuth } from '../../../stores/authStore';

export const KnowledgeBasePanel: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWithAuth('/admin/coach-studio/knowledge')
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) setFaqs(d);
      })
      .catch(err => console.error(err));

    fetchDocuments();
  }, []);

  const fetchDocuments = () => {
    fetchWithAuth('/admin/coach-studio/knowledge/documents')
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) setDocuments(d);
      })
      .catch(err => console.error(err));
  };

  const addRow = () => {
    setFaqs([...faqs, { 
      id: crypto.randomUUID(), 
      question: '', 
      answer: '', 
      is_active: true 
    }]);
  };

  const saveAll = () => {
    setIsSaving(true);
    fetchWithAuth('/admin/coach-studio/knowledge', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: faqs })
    }).then(res => {
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    }).finally(() => {
      setIsSaving(false);
    });
  };

  const deleteRow = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    fetchWithAuth('/admin/coach-studio/knowledge/upload', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(() => {
      fetchDocuments();
      if (fileInputRef.current) fileInputRef.current.value = '';
    })
    .catch(err => console.error("Upload failed", err))
    .finally(() => setIsUploading(false));
  };

  const deleteDocument = (id: string) => {
    fetchWithAuth(`/admin/coach-studio/knowledge/documents/${id}`, {
      method: 'DELETE'
    })
    .then(() => fetchDocuments());
  };

  return (
    <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-xl overflow-hidden space-y-6 pb-6">
      <div className="px-6 py-4 border-b border-[#3A3F4D] bg-[#242834] flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Knowledge Base & FAQs</h2>
          <p className="text-xs text-gray-500 mt-1">Upload documents (PDF, Word, Excel) or manually add FAQs.</p>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="px-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Uploaded Documents</h3>
        
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between bg-[#0D1117] border border-[#3A3F4D] p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#242834] rounded text-[#7B9EA8]">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-200 font-medium">{doc.name}</p>
                  <p className="text-xs text-gray-500">Uploaded {doc.date} • <span className="text-green-400">{doc.status}</span></p>
                </div>
              </div>
              <button onClick={() => deleteDocument(doc.id)} className="text-gray-500 hover:text-red-400 transition-colors p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {documents.length === 0 && (
            <p className="text-xs text-gray-500 mb-2">No documents uploaded yet.</p>
          )}

          <div>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileUpload} 
               className="hidden" 
               accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading}
               className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-[#3A3F4D] rounded-lg text-gray-400 hover:text-[#7B9EA8] hover:border-[#7B9EA8] transition-colors"
             >
               <UploadCloud size={20} />
               <span className="text-sm font-medium">
                 {isUploading ? "Uploading & Processing..." : "Upload Document (PDF, Word, Excel)"}
               </span>
             </button>
          </div>
        </div>
      </div>

      <div className="px-6">
        <hr className="border-[#3A3F4D] mb-6" />
      </div>

      {/* Manual FAQs Section */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manual FAQs</h3>
          <div className="flex gap-2">
            <button onClick={addRow} className="flex items-center gap-1 text-[#7B9EA8] hover:text-white text-xs bg-[#242834] px-2 py-1 rounded border border-[#3A3F4D]">
              <Plus size={14}/> Add FAQ
            </button>
            <button 
              onClick={saveAll} 
              disabled={isSaving}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                savedSuccess ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-[#7B9EA8] text-[#0D1117] hover:bg-[#A3BFC7]'
              }`}
            >
              {savedSuccess ? <><Check size={14}/> Saved</> : <><Save size={14}/> Save FAQs</>}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.length === 0 && <p className="text-gray-500 text-xs">No manual FAQs added yet.</p>}
          {faqs.map((f, i) => (
            <div key={f.id || i} className={`bg-[#0D1117] border ${f.is_active ? 'border-[#3A3F4D]' : 'border-red-900/30 opacity-60'} p-4 rounded-md space-y-4 relative transition-all`}>
              
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <label className="block text-xs text-gray-400 mb-1">Question / Topic</label>
                  <input 
                    type="text" 
                    value={f.question} 
                    onChange={e => {
                      const newFaqs = [...faqs]; 
                      newFaqs[i].question = e.target.value; 
                      setFaqs(newFaqs);
                    }} 
                    className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded px-3 py-2 text-white text-sm outline-none focus:border-[#7B9EA8]" 
                    placeholder="e.g. What is the extension policy?" 
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={f.is_active} 
                      onChange={e => {
                        const newFaqs = [...faqs]; 
                        newFaqs[i].is_active = e.target.checked; 
                        setFaqs(newFaqs);
                      }} 
                      className="accent-[#7B9EA8]"
                    />
                    <span className="text-xs text-gray-400">Active</span>
                  </label>
                  <button onClick={() => deleteRow(i)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Answer / Information</label>
                <textarea 
                  value={f.answer} 
                  onChange={e => {
                      const newFaqs = [...faqs]; 
                      newFaqs[i].answer = e.target.value; 
                      setFaqs(newFaqs);
                    }} 
                  className="w-full h-24 bg-[#1C2128] border border-[#3A3F4D] rounded px-3 py-2 text-white text-sm outline-none focus:border-[#7B9EA8]" 
                  placeholder="e.g. Students get a 2-day grace period for late submissions without penalty."
                />
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
