import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Plus, MapPin } from 'lucide-react';

const PrincipalTransportRouteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    pickupTime: '',
    dropTime: '',
    sequence: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchRouteDetails();
  }, [id]);

  const fetchRouteDetails = async () => {
    try {
      const res = await transportService.getRoute(id);
      setRoute(res.data.route);
      setStops(res.data.stops);
    } catch (err) {
      toast.error('Failed to load route details');
      navigate('/principal/transport/routes');
    }
  };

  const handleOpenModal = (stop = null) => {
    if (stop) {
      setFormData({
        name: stop.name,
        location: stop.location || '',
        pickupTime: stop.pickupTime,
        dropTime: stop.dropTime,
        sequence: stop.sequence,
        status: stop.status
      });
      setEditingId(stop._id);
    } else {
      setFormData({
        name: '',
        location: '',
        pickupTime: '',
        dropTime: '',
        sequence: (stops.length > 0 ? Math.max(...stops.map(s => s.sequence)) + 1 : 1).toString(),
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
      const payload = { ...formData, route: id };
      if (editingId) {
        await transportService.updateBusStop(editingId, payload);
        toast.success('Stop updated successfully');
      } else {
        await transportService.createBusStop(payload);
        toast.success('Stop added successfully');
      }
      setIsModalOpen(false);
      fetchRouteDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving stop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (stopId) => {
    if (!window.confirm("Delete Stop?\n\nAre you sure you want to delete this stop from the route?")) return;
    try {
      await transportService.deleteBusStop(stopId);
      toast.success('Stop deleted');
      fetchRouteDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting stop');
    }
  };

  if (!route) return <Layout><div className="flex justify-center p-12">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/principal/transport/routes')} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-full transition">
            <ArrowLeft className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{route.routeNumber} - {route.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{route.description || 'Route Details'}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <MapPin className="text-blue-500" /> Stops along this route
          </h3>
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <Plus size={18} /> Add Stop
          </button>
        </div>

        {stops.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] p-8 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No stops have been added to this route yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stops.map((stop) => (
              <div key={stop._id} className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-[#1E293B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-[#1E293B] text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {stop.sequence}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      {stop.name}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${stop.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {stop.status}
                      </span>
                    </h4>
                    {stop.location && <p className="text-sm text-gray-500 dark:text-gray-400">{stop.location}</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <div className="text-sm">
                    <p className="text-gray-500 dark:text-gray-400">Pickup</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{stop.pickupTime}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500 dark:text-gray-400">Drop</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{stop.dropTime}</p>
                  </div>
                  <div className="flex gap-2 ml-auto sm:ml-4">
                    <button onClick={() => handleOpenModal(stop)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-[#1E293B] rounded-lg transition">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(stop._id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-[#1E293B] rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#1E293B] rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition disabled:opacity-50">
                    {isLoading ? 'Saving...' : (editingId ? 'Update Stop' : 'Add Stop')}
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

export default PrincipalTransportRouteDetails;
