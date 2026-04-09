import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import api from '../lib/axios';
import { UserPlus, ArrowLeft, Camera, RefreshCw, CheckSquare, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function EnrollStudent() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [batches, setBatches] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [imgSrc, setImgSrc] = useState(null);
  const [registerSelectedBatches, setRegisterSelectedBatches] = useState(new Set());

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setError('');
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

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const handleRegisterBatchCheckbox = (batchId) => {
    setRegisterSelectedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) newSet.delete(batchId);
      else newSet.add(batchId);
      return newSet;
    });
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    if (!studentName || !imgSrc) { setError('Name and photo required.'); return; }
    if (registerSelectedBatches.size === 0) { setError('Assign to at least one batch.'); return; }
    
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/student', {
        name: studentName,
        image_base64: imgSrc,
        batch_ids: Array.from(registerSelectedBatches)
      });
      setMessage('Student registered successfully!');
      setStudentName('');
      setImgSrc(null);
      setRegisterSelectedBatches(new Set());
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
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
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-primary">Enroll Student</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Capture biometric face data and assign to classes.</p>
          </div>
        </div>

        <form onSubmit={handleRegisterStudent} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Side: Camera */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Biometric Capture</label>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner border-2 border-slate-200">
              {!imgSrc ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user", width: 1280, height: 720 }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
              )}
            </div>
            <button
              type="button"
              onClick={!imgSrc ? capture : () => setImgSrc(null)}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border-2",
                !imgSrc 
                  ? "bg-slate-50 text-primary border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              )}
            >
              {!imgSrc ? (
                <><Camera className="w-5 h-5" /> Capture Face Data</>
              ) : (
                <><RefreshCw className="w-5 h-5" /> Retake Photo</>
              )}
            </button>
          </div>

          {/* Right Side: Form */}
          <div className="space-y-6 flex flex-col">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Student Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-primary font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assign to Batches</label>
              {batches.length === 0 ? (
                <div className="bg-rose-50 text-rose-600 text-sm font-medium p-4 rounded-xl border border-rose-100">
                  Please create a batch first in Manage Batches.
                </div>
              ) : (
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-y-auto custom-scrollbar max-h-48 space-y-2">
                  {batches.map(batch => (
                    <label key={batch.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-slate-200 hover:shadow-sm">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded cursor-pointer checked:bg-emerald-500 checked:border-emerald-500 transition-all"
                          checked={registerSelectedBatches.has(batch.id)}
                          onChange={() => handleRegisterBatchCheckbox(batch.id)}
                        />
                        <CheckSquare className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-primary">{batch.batch_name}</p>
                        <p className="text-xs font-medium text-slate-500">{batch.subject}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || batches.length === 0 || !imgSrc || !studentName}
              className="w-full bg-primary hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Complete Enrollment
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
