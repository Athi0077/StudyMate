import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser, login } = useContext(AuthContext); // Need `login` from context to update local user state if needed, or we can just reload
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bloodGroup: 'Unknown / Not specified',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  useEffect(() => {
    if (currentUser) {
      let dobStr = '';
      if (currentUser.dateOfBirth) {
        dobStr = new Date(currentUser.dateOfBirth).toISOString().split('T')[0];
      }
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        dateOfBirth: dobStr,
        bloodGroup: currentUser.bloodGroup || 'Unknown / Not specified'
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (formData.dateOfBirth) {
      const dobDate = new Date(formData.dateOfBirth);
      if (dobDate > new Date()) {
        return toast.error("Date of Birth cannot be in the future");
      }
    }

    try {
      setSubmitting(true);
      const res = await api.put('/users/profile', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth || null,
        bloodGroup: formData.bloodGroup,
        password: formData.password || undefined
      });
      
      toast.success("Profile updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const picData = new FormData();
    picData.append('profilePic', file);

    try {
      setUploadingPic(true);
      await api.post('/users/profile/upload', picData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile picture updated!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to upload picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handlePicDelete = async () => {
    try {
      setUploadingPic(true);
      await api.delete('/users/profile/upload');
      toast.success('Profile picture removed!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to remove picture');
    } finally {
      setUploadingPic(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        
        <div className="bg-white p-8 rounded-3xl shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                {currentUser?.profilePic ? (
                  <img src={currentUser.profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-inner">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition shadow-lg" title="Upload Picture">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} disabled={uploadingPic} />
                  📷
                </label>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{currentUser?.name}</h3>
                <p className="text-gray-500">{currentUser?.role.toUpperCase()}</p>
                {currentUser?.profilePic && (
                  <button type="button" onClick={handlePicDelete} disabled={uploadingPic} className="text-red-500 text-xs font-bold hover:underline mt-1">
                    Remove Picture
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  name="dateOfBirth"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
                <select
                  name="bloodGroup"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="Unknown / Not specified">Unknown / Not specified</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <textarea 
                name="address"
                rows="3"
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full address"
              ></textarea>
            </div>

            <hr className="border-gray-100" />
            <h4 className="text-lg font-bold text-gray-800">Change Password (Optional)</h4>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input 
                type="password" 
                name="password"
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Leave blank to keep current password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={submitting}
                className="px-8 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
