import React, { useState, useEffect } from 'react';
import { FileText, Upload, ShieldCheck, Download, Trash2, Eye } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Record {
  _id: string;
  title: string;
  description: string;
  fileUrl?: string;
  createdAt: string;
  verified: boolean;
}

export const MedicalRecords = () => {
  const { token } = useAuthStore();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          fileUrl: imageBase64,
          verified: true // mocking blockchain verification
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowUpload(false);
        setFormData({ title: '', description: '' });
        setImageBase64(null);
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your lab reports and prescriptions securely.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm shadow-sky-500/30 flex items-center transition-all"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Record
        </button>
      </div>

      {showUpload && (
        <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">Upload New Record</h2>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title / Report Type</label>
              <input 
                required
                type="text"
                placeholder="e.g., Blood Test Results"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 bg-white/50 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input 
                required
                type="text"
                placeholder="Brief summary"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 bg-white/50 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image / File</label>
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-1.5 bg-white/50 focus:ring-sky-500 focus:border-sky-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
            </div>
            <div className="flex space-x-3 md:col-span-3 mt-2">
              <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-xl hover:bg-sky-600 transition-colors shadow-sm">
                Save
              </button>
              <button type="button" onClick={() => setShowUpload(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
          {imageBase64 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Preview:</p>
              <img src={imageBase64} alt="Preview" className="h-32 rounded-lg object-cover border border-slate-200 shadow-sm" />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {records.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 bg-white/50 rounded-2xl border border-white/50">
            No medical records found. Upload your first record above.
          </div>
        )}
        {records.map(record => (
          <div key={record._id} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 hover:shadow-md transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              {record.verified && (
                <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Verified
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-1">{record.title}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{record.description}</p>
            {record.fileUrl && (
              <div className="mb-4 flex-1">
                <img src={record.fileUrl} alt="Record Preview" className="w-full h-32 object-cover rounded-xl border border-slate-100 shadow-sm" />
              </div>
            )}
            <div className="flex items-center justify-between mt-auto border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">
                {new Date(record.createdAt).toLocaleDateString()}
              </span>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-slate-400 hover:text-sky-500 transition-colors" title="View">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-sky-500 transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
