import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import type { Announcement } from '../../components/dashboard/AnnouncementBanner';

export const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    text: '',
    type: 'info',
    action_url: '',
    action_text: '',
    start_date: '',
    end_date: ''
  });

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements/admin');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Convert to local time string format for datetime-local input
    const toLocalISOString = (d: Date) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0,16);

    setFormData({
      text: '',
      type: 'info',
      action_url: '',
      action_text: '',
      start_date: toLocalISOString(today),
      end_date: toLocalISOString(nextMonth)
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    const toLocalISOString = (d: Date) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
    setFormData({
      text: item.text,
      type: item.type,
      action_url: item.action_url || '',
      action_text: item.action_text || '',
      start_date: toLocalISOString(new Date(item.start_date)),
      end_date: toLocalISOString(new Date(item.end_date))
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/admin/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/announcements/admin/${editingId}` : '/api/announcements/admin';
      const method = editingId ? 'PATCH' : 'POST';
      
      const payload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-8 relative">
      <div className="max-w-6xl mx-auto space-y-6 pt-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white font-serif">Announcements</h1>
            <p className="text-sm text-gray-400 mt-1">Manage global announcements and nudges.</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#7B9EA8] text-white rounded-md text-sm font-medium hover:bg-[#7B9EA8]/90 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Create Announcement
          </button>
        </div>

        <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#3A3F4D] text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-[#1C2128]">
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-200">
              {announcements.map((item: any) => {
                const now = new Date();
                const start = new Date(item.start_date);
                const end = new Date(item.end_date);
                const isActive = item.is_active && now >= start && now <= end;

                return (
                  <tr key={item.id} className="border-b border-[#3A3F4D] last:border-0 hover:bg-[#1C2128] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{item.text}</div>
                      {item.action_text && (
                        <div className="text-xs text-gray-400 mt-1">Action: {item.action_text} ({item.action_url})</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#7B9EA8]/20 text-[#7B9EA8] rounded text-xs capitalize border border-[#7B9EA8]/30">
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-white transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
              />
              <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="bg-[#242834] border border-[#3A3F4D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
                  style={{ maxHeight: 'calc(100vh - 120px)' }}
                >
                  <div className="flex justify-between items-center p-6 border-b border-[#3A3F4D] shrink-0">
                    <h2 className="text-xl font-serif text-white">{editingId ? 'Edit Announcement' : 'Create Announcement'}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Message Text</label>
                        <input required type="text" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#7B9EA8]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#7B9EA8]">
                          <option value="info">Info</option>
                          <option value="new_course">New Course</option>
                          <option value="deadline">Deadline</option>
                          <option value="achievement">Achievement</option>
                          <option value="update">Update</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Action Text (Optional)</label>
                          <input type="text" value={formData.action_text} onChange={e => setFormData({...formData, action_text: e.target.value})} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#7B9EA8]" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Action URL (Optional)</label>
                          <input type="text" value={formData.action_url} onChange={e => setFormData({...formData, action_url: e.target.value})} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#7B9EA8]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                          <input required type="datetime-local" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#7B9EA8]" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                          <input required type="datetime-local" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full bg-[#1C2128] border border-[#3A3F4D] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#7B9EA8]" />
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[#7B9EA8] text-white rounded-md text-sm font-medium hover:bg-[#7B9EA8]/90 transition-colors">Save Announcement</button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
