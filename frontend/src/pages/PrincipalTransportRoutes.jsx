import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrincipalTransportRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    routeNumber: '',
    description: '',
    status: 'ACTIVE'
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await transportService.getRoutes();
      setRoutes(res.data.routes);
    } catch (err) {
      toast.error('Failed to load routes');
    }
  };

  const handleOpenModal = (route = null) => {
    if (route) {
      setFormData({
        name: route.name,
        routeNumber: route.routeNumber,
        description: route.description || '',
        status: route.status
      });
      setEditingId(route.id);
    } else {
      setFormData({
        name: '',
        routeNumber: '',
        description: '',
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
        await transportService.updateRoute(editingId, formData);
        toast.success('Route updated successfully');
      } else {
        await transportService.createRoute(formData);
        toast.success('Route created successfully');
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving route');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Route?\n\nAre you sure you want to delete this route and all its stops?\n\nThis action cannot be undone.")) return;
    try {
      await transportService.deleteRoute(id);
      toast.success('Route deleted successfully');
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting route');
    }
  };

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.routeNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Route Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage school transport routes</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <input
            type="text"
            placeholder="Search by route name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#0F172A] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <Plus size={18} /> Add Route
          </button>
        </div>

        {filteredRoutes.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] p-8 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center">
            <Map className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No routes found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first route to start mapping school transportation.</p>
            <button onClick={() => handleOpenModal()} className="text-blue-600 font-medium hover:underline">
              + Add Route
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-[#1E293B] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1E293B] text-gray-600 dark:text-gray-300 text-sm">
                  <th className="p-4 font-semibold rounded-tl-2xl">Route Number</th>
                  <th className="p-4 font-semibold">Route Name</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold">Number of Stops</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold rounded-tr-2xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                {filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50 dark:hover:bg-[#172235] transition text-gray-800 dark:text-gray-200">
                    <td className="p-4 font-medium">{route.routeNumber}</td>
                    <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">
                      <button onClick={() => navigate(`/principal/transport/routes/${route.id}`)} className="hover:underline text-left">
                        {route.name}
                      </button>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{route.description || '-'}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 rounded-md font-medium text-sm">
                        {route.stopsCount} Stops
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${route.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => navigate(`/principal/transport/routes/${route.id}`)} className="text-gray-500 hover:text-blue-600 font-medium text-sm px-2">
                        View
                      </button>
                      <button onClick={() => handleOpenModal(route)} className="text-blue-500 hover:text-blue-700 p-1">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(route.id)} className="text-red-500 hover:text-red-700 p-1">
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
                {editingId ? 'Edit Route' : 'Add Route'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route Number *</label>
                    <input type="text" required value={formData.routeNumber} onChange={e => setFormData({...formData, routeNumber: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white"></textarea>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#1E293B] rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition disabled:opacity-50">
                    {isLoading ? 'Saving...' : (editingId ? 'Update Route' : 'Create Route')}
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

export default PrincipalTransportRoutes;
