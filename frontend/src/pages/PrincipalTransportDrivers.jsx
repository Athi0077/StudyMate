import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import toast from 'react-hot-toast';
import { User, Edit, Trash2, Plus } from 'lucide-react';

const PrincipalTransportDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    experience: '',
    emergencyContact: '',
    status: 'ACTIVE'
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await transportService.getDrivers();
      setDrivers(res.data.drivers);
    } catch (err) {
      toast.error('Failed to load drivers');
    }
  };

  const handleOpenModal = (driver = null) => {
    if (driver) {
      setFormData({
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: new Date(driver.licenseExpiry).toISOString().split('T')[0],
        experience: driver.experience || '',
        emergencyContact: driver.emergencyContact || '',
        status: driver.status
      });
      setEditingId(driver._id);
    } else {
      setFormData({
        name: '',
        phone: '',
        licenseNumber: '',
        licenseExpiry: '',
        experience: '',
        emergencyContact: '',
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
      if (editingId) {
        await transportService.updateDriver(editingId, formData);
        toast.success('Driver updated successfully');
      } else {
        await transportService.createDriver(formData);
        toast.success('Driver created successfully');
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving driver');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Driver?\n\nAre you sure you want to delete this driver?\n\nThis action cannot be undone.")) return;
    try {
      await transportService.deleteDriver(id);
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting driver');
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.phone.includes(search) ||
    d.licenseNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Driver Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage school bus drivers</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <input
            type="text"
            placeholder="Search by name, phone, or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <Plus size={18} /> Add Driver
          </button>
        </div>

        {filteredDrivers.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] p-8 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No drivers found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first driver to start managing school transportation.</p>
            <button onClick={() => handleOpenModal()} className="text-blue-600 font-medium hover:underline">
              + Add Driver
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-[#1E293B] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1E293B] text-gray-600 dark:text-gray-300 text-sm">
                  <th className="p-4 font-semibold rounded-tl-2xl">Driver Name</th>
                  <th className="p-4 font-semibold">Phone</th>
                  <th className="p-4 font-semibold">License Number</th>
                  <th className="p-4 font-semibold">License Expiry</th>
                  <th className="p-4 font-semibold">Assigned Bus</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold rounded-tr-2xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                {filteredDrivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition text-gray-800 dark:text-gray-200">
                    <td className="p-4 font-medium">{driver.name}</td>
                    <td className="p-4">{driver.phone}</td>
                    <td className="p-4">{driver.licenseNumber}</td>
                    <td className="p-4">{new Date(driver.licenseExpiry).toLocaleDateString()}</td>
                    <td className="p-4 text-gray-500">Not Assigned</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${driver.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(driver)} className="text-blue-500 hover:text-blue-700 p-1">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(driver._id)} className="text-red-500 hover:text-red-700 p-1">
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
                {editingId ? 'Edit Driver' : 'Add Driver'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driver Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                  <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Number *</label>
                    <input type="text" required value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Expiry *</label>
                    <input type="date" required value={formData.licenseExpiry} onChange={e => setFormData({...formData, licenseExpiry: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience (Years)</label>
                    <input type="number" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                    <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
                  <input type="text" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#1E293B] rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition disabled:opacity-50">
                    {isLoading ? 'Saving...' : (editingId ? 'Update Driver' : 'Create Driver')}
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

export default PrincipalTransportDrivers;
