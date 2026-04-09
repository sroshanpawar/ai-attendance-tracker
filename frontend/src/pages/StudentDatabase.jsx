import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Users, ArrowLeft, Search, CheckSquare, Trash2, Edit2, X, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StudentDatabase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingBatches, setEditingBatches] = useState(new Set());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatchId, setFilterBatchId] = useState(null);

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batches');
      setBatches(response.data);
    } catch (err) {
      console.error('Could not fetch batches.', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (err) {
      setError('Could not fetch students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchStudents();
  }, []);

  const handleEditClick = (student) => {
    if (editingStudentId === student.id) {
      setEditingStudentId(null);
    } else {
      setEditingStudentId(student.id);
      setEditingBatches(new Set(student.batches.map(b => b.id)));
    }
  };

  const handleToggleBatch = (batchId) => {
    setEditingBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) newSet.delete(batchId);
      else newSet.add(batchId);
      return newSet;
    });
  };

  const handleSaveStudentBatches = async (studentId) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.put(`/student/${studentId}/batches`, { batch_ids: Array.from(editingBatches) });
      setMessage('Student batches updated successfully.');
      setEditingStudentId(null);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update student.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student permanently?")) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.delete(`/student/${studentId}`);
      setMessage('Student deleted successfully!');
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete student.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const nameMatches = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const batchMatches = filterBatchId === null || student.batches.some(batch => batch.id === filterBatchId);
      return nameMatches && batchMatches;
    });
  }, [students, searchTerm, filterBatchId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
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
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-primary">Student Database</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">View, edit, or remove enrolled students.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-primary font-semibold rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            <button
              onClick={() => setFilterBatchId(null)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                filterBatchId === null ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
            >
              All Batches
            </button>
            {batches.map(batch => (
              <button
                key={batch.id}
                onClick={() => setFilterBatchId(batch.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                  filterBatchId === batch.id ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
              >
                {batch.batch_name}
              </button>
            ))}
          </div>
        </div>

        {/* Database List */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
          
          {loading && students.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p className="text-sm font-bold">Loading students...</p>
            </div>
          )}

          {!loading && students.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-bold">Database is empty.</p>
            </div>
          )}

          {!loading && students.length > 0 && filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-bold">No matches found.</p>
            </div>
          )}

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white">
                <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 border border-blue-100 flex-shrink-0">
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-primary">{student.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.batches.length > 0 ? (
                          student.batches.map(b => (
                            <span key={b.id} className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
                              {b.batch_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-medium text-amber-500">No Batches Assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(student)}
                      disabled={loading}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        editingStudentId === student.id ? "bg-accent text-white" : "text-blue-500 hover:bg-blue-50"
                      )}
                    >
                      {editingStudentId === student.id ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      disabled={loading}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Edit Form Dropdown */}
                {editingStudentId === student.id && (
                  <div className="bg-slate-50/50 p-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Adjust Batches for {student.name}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {batches.map(batch => (
                        <label key={batch.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="peer appearance-none w-4 h-4 border-2 border-slate-300 rounded cursor-pointer checked:bg-emerald-500 checked:border-emerald-500 transition-all"
                              checked={editingBatches.has(batch.id)}
                              onChange={() => handleToggleBatch(batch.id)}
                            />
                            <CheckSquare className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{batch.batch_name}</p>
                            <p className="text-[10px] font-medium text-slate-500 truncate">{batch.subject}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingStudentId(null)}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveStudentBatches(student.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-primary hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
