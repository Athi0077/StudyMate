import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, Info } from 'lucide-react';

const BusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
);

const PrincipalTransportBuses = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    busNumber: '',
    registrationNumber: '',
    capacity: '',
    driver: '',
    attenderName: '',
    attenderPhone: '',
    status: 'ACTIVE'
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchBuses();
    fetchDrivers();
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await transportService.getTransportSummary();
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await transportService.getBuses();
      setBuses(res.data.buses);
    } catch (err) {
      toast.error('Failed to load buses');
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await transportService.getDrivers();
      setDrivers(res.data.drivers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (bus = null) => {
    if (bus) {
      setFormData({
        busNumber: bus.busNumber,
        registrationNumber: bus.registrationNumber,
        capacity: bus.capacity,
        driver: bus.driver?._id || '',
        attenderName: bus.attenderName || '',
        attenderPhone: bus.attenderPhone || '',
        status: bus.status
      });
      setEditingId(bus._id);
    } else {
      setFormData({
        busNumber: '',
        registrationNumber: '',
        capacity: '',
        driver: '',
        attenderName: '',
        attenderPhone: '',
        status: 'ACTIVE'
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { ...formData, driver: formData.driver || null };
      if (editingId) {
        await transportService.updateBus(editingId, payload);
        toast.success('Bus updated successfully');
      } else {
        await transportService.createBus(payload);
        toast.success('Bus created successfully');
      }
      setIsModalOpen(false);
      fetchBuses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving bus');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Bus?\n\nAre you sure you want to delete this bus?\n\nThis action cannot be undone.")) return;
    try {
      await transportService.deleteBus(id);
      toast.success('Bus deleted successfully');
      fetchBuses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting bus');
    }
  };

  const filteredBuses = buses.filter(b => 
    b.busNumber.toLowerCase().includes(search.toLowerCase()) || 
    b.registrationNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bus Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage school buses and transport vehicles</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-gray-100 dark:border-[#1E293B] shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Buses</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{buses.length}</p>
          </div>
          <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-gray-100 dark:border-[#1E293B] shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600">{buses.filter(b => b.status === 'ACTIVE').length}</p>
          </div>
          <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-gray-100 dark:border-[#1E293B] shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Maintenance</p>
            <p className="text-2xl font-bold text-orange-500">{buses.filter(b => b.status === 'MAINTENANCE').length}</p>
          </div>
          <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-gray-100 dark:border-[#1E293B] shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Students Using Transport</p>
            <p className="text-2xl font-bold text-blue-600">{summary?.assignedStudents || 0}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <input
            type="text"
            placeholder="Search by bus number or registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <Plus size={18} /> Add Bus
          </button>
        </div>

        {filteredBuses.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] p-8 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center">
            <BusIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No buses found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first school bus to start managing school transportation.</p>
            <button onClick={() => handleOpenModal()} className="text-blue-600 font-medium hover:underline">
              + Add Bus
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-[#1E293B] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1E293B] text-gray-600 dark:text-gray-300 text-sm">
                  <th className="p-4 font-semibold rounded-tl-2xl">Bus Number</th>
                  <th className="p-4 font-semibold">Registration Number</th>
                  <th className="p-4 font-semibold">Capacity</th>
                  <th className="p-4 font-semibold">Driver</th>
                  <th className="p-4 font-semibold">Attender</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold rounded-tr-2xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                {filteredBuses.map((bus) => (
                  <tr key={bus._id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition text-gray-800 dark:text-gray-200">
                    <td className="p-4 font-medium">{bus.busNumber}</td>
                    <td className="p-4">{bus.registrationNumber}</td>
                    <td className="p-4">{bus.capacity}</td>
                    <td className="p-4">{bus.driver?.name || <span className="text-gray-400">Unassigned</span>}</td>
                    <td className="p-4">
                      {bus.attenderName ? (
                        <div>
                          <div>{bus.attenderName}</div>
                          <div className="text-xs text-gray-500">{bus.attenderPhone}</div>
                        </div>
                      ) : <span className="text-gray-400">None</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                        ${bus.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                          bus.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(bus)} className="text-blue-500 hover:text-blue-700 p-1">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(bus._id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-100 dark:border-[#1E293B]">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {editingId ? 'Edit Bus' : 'Add Bus'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bus Number *</label>
                    <input type="text" required value={formData.busNumber} onChange={e => setFormData({...formData, busNumber: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registration Number *</label>
                    <input type="text" required value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity *</label>
                    <input type="number" required min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                    <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driver</label>
                  <select value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white">
                    <option value="">Select a driver</option>
                    {drivers.filter(d => d.status === 'ACTIVE').map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.licenseNumber})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attender Name</label>
                    <input type="text" value={formData.attenderName} onChange={e => setFormData({...formData, attenderName: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attender Phone</label>
                    <input type="text" value={formData.attenderPhone} onChange={e => setFormData({...formData, attenderPhone: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#1E293B] rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition disabled:opacity-50">
                    {isLoading ? 'Saving...' : (editingId ? 'Update Bus' : 'Create Bus')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalTransportBuses;
