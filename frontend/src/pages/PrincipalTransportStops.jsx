import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, MapPin } from 'lucide-react';

const PrincipalTransportStops = () => {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    pickupTime: '',
    dropTime: '',
    sequence: '',
    route: '',
    status: 'ACTIVE'
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStops();
    fetchRoutes();
  }, []);

  const fetchStops = async () => {
    try {
      const res = await transportService.getBusStops();
      setStops(res.data.stops);
    } catch (err) {
      toast.error('Failed to load bus stops');
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await transportService.getRoutes();
      setRoutes(res.data.routes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (stop = null) => {
    if (stop) {
      setFormData({
        name: stop.name,
        location: stop.location || '',
        latitude: stop.latitude || '',
        longitude: stop.longitude || '',
        pickupTime: stop.pickupTime,
        dropTime: stop.dropTime,
        sequence: stop.sequence,
        route: stop.route?._id || '',
        status: stop.status
      });
      setEditingId(stop._id);
    } else {
      setFormData({
        name: '',
        location: '',
        latitude: '',
        longitude: '',
        pickupTime: '',
        dropTime: '',
        sequence: '',
        route: '',
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
        await transportService.updateBusStop(editingId, formData);
        toast.success('Bus stop updated successfully');
      } else {
        await transportService.createBusStop(formData);
        toast.success('Bus stop created successfully');
      }
      setIsModalOpen(false);
      fetchStops();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving bus stop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Bus Stop?\n\nAre you sure you want to delete this stop?\n\nThis action cannot be undone.")) return;
    try {
      await transportService.deleteBusStop(id);
      toast.success('Bus stop deleted successfully');
      fetchStops();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting bus stop');
    }
  };

  const filteredStops = stops.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.route?.name && s.route.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bus Stop Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage route stops and timings</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <input
            type="text"
            placeholder="Search by stop name or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <Plus size={18} /> Add Stop
          </button>
        </div>

        {filteredStops.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] p-8 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No bus stops found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first stop to build a complete route.</p>
            <button onClick={() => handleOpenModal()} className="text-blue-600 font-medium hover:underline">
              + Add Stop
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-[#1E293B] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1E293B] text-gray-600 dark:text-gray-300 text-sm">
                  <th className="p-4 font-semibold rounded-tl-2xl">Stop Name</th>
                  <th className="p-4 font-semibold">Route</th>
                  <th className="p-4 font-semibold">Pickup Time</th>
                  <th className="p-4 font-semibold">Drop Time</th>
                  <th className="p-4 font-semibold">Sequence</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold rounded-tr-2xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                {filteredStops.map((stop) => (
                  <tr key={stop._id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition text-gray-800 dark:text-gray-200">
                    <td className="p-4 font-medium">{stop.name}</td>
                    <td className="p-4 text-blue-600 dark:text-blue-400 font-medium">
                      {stop.route ? `${stop.route.routeNumber} - ${stop.route.name}` : <span className="text-gray-400">Unknown Route</span>}
                    </td>
                    <td className="p-4">{stop.pickupTime}</td>
                    <td className="p-4">{stop.dropTime}</td>
                    <td className="p-4">
                      <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[#1E293B] text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                        {stop.sequence}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stop.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {stop.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(stop)} className="text-blue-500 hover:text-blue-700 p-1">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(stop._id)} className="text-red-500 hover:text-red-700 p-1">
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
                {editingId ? 'Edit Stop' : 'Add Stop'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stop Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route *</label>
                  <select required value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white">
                    <option value="">Select a route</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.routeNumber} - {r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Time *</label>
                    <input type="time" required value={formData.pickupTime} onChange={e => setFormData({...formData, pickupTime: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Drop Time *</label>
                    <input type="time" required value={formData.dropTime} onChange={e => setFormData({...formData, dropTime: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sequence (Order) *</label>
                    <input type="number" required min="1" value={formData.sequence} onChange={e => setFormData({...formData, sequence: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location / Landmark</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude (for map)</label>
                    <input type="number" step="any" placeholder="e.g. 13.1234" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude (for map)</label>
                    <input type="number" step="any" placeholder="e.g. 80.1234" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#1E293B] rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition disabled:opacity-50">
                    {isLoading ? 'Saving...' : (editingId ? 'Update Stop' : 'Create Stop')}
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

export default PrincipalTransportStops;
