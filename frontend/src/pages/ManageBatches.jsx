import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Layers, ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ManageBatches() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchSubject, setNewBatchSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const response = await api.get('/batches');
        setBatches(response.data);
      } catch (err) {
        setError('Could not fetch batches.');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/batch', { batch_name: newBatchName, subject: newBatchSubject });
      setMessage('Batch created successfully!');
      setNewBatchName('');
      setNewBatchSubject('');
      setBatches(prev => [response.data.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create batch.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Delete this batch? Current students will lose this association.")) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.delete(`/batch/${batchId}`);
      setMessage('Batch deleted!');
      setBatches(prev => prev.filter(b => b.id !== batchId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <button onClick={() => navigate('/manage')} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Manage Hub
      </button>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-bold flex gap-2 items-center border border-emerald-100">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold flex gap-2 items-center border border-rose-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-primary">Manage Batches</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Create or remove student groups.</p>
          </div>
        </div>

        <form onSubmit={handleCreateBatch} className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch</label>
            <input
              type="text"
              required
              placeholder="e.g. CS-101 Morning"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-primary font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Computer Science"
              value={newBatchSubject}
              onChange={(e) => setNewBatchSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-primary font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !newBatchName || !newBatchSubject}
              className="h-[50px] px-6 bg-primary hover:bg-slate-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Create
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-primary border-b border-slate-100 pb-2">Active Batches</h3>
          {batches.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4">No batches found. Create one above.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {batches.map(batch => (
                <div key={batch.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
                  <div>
                    <h4 className="font-bold text-primary">{batch.batch_name}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{batch.subject}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteBatch(batch.id)}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete batch"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
