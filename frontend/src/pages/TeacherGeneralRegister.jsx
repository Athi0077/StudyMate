import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import { getStudents, registerStudent, updateStudent, deleteStudent } from '../utils/generalRegisterApi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherGeneralRegister = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', name: '', password: '', gender: 'Male', classId: '', isClassLeader: false });
  const [editingId, setEditingId] = useState(null);

  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        getStudents(),
        api.get('/classes/my-classes')
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.isClassLeader && formData.classId) {
      const selectedClass = classes.find(c => c._id === formData.classId);
      if (selectedClass && selectedClass.classLeader) {
        const replace = window.confirm(`This class already has a leader (${selectedClass.classLeader.name || 'someone'}). Do you want to replace them with ${formData.name}?`);
        if (!replace) return;
      }
    }

    try {
      const res = await registerStudent(formData);
      toast.success(`${res.message}. Temp Password: ${res.data.tempPassword}`, { duration: 5000 });
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (formData.isClassLeader && formData.classId) {
      const selectedClass = classes.find(c => c._id === formData.classId);
      if (selectedClass && selectedClass.classLeader && selectedClass.classLeader._id !== editingId) {
        const replace = window.confirm(`This class already has a leader (${selectedClass.classLeader.name || 'someone'}). Do you want to replace them with ${formData.name}?`);
        if (!replace) return;
      }
    }

    try {
      const res = await updateStudent(editingId, formData);
      toast.success(res.message || 'Student updated successfully');
      setEditingId(null);
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const res = await deleteStudent(id);
      toast.success(res.message || 'Student deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const openAddModal = () => {
    const classTeacherClasses = classes.filter(c => c.teacherId === currentUserId);
    const defaultClassId = classTeacherClasses.length === 1 ? classTeacherClasses[0]._id : '';
    setFormData({ studentId: '', name: '', password: '', gender: 'Male', classId: defaultClassId, isClassLeader: false });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (student) => {
    const studentClass = classes.find(c => c.students && (c.students.includes(student._id) || c.students.some(s => s._id === student._id)));
    const classId = studentClass ? studentClass._id : '';
    const isLeader = studentClass && studentClass.classLeader && studentClass.classLeader._id === student._id ? true : false;
    
    setFormData({ studentId: student.studentId || '', name: student.name, password: '', gender: student.gender, classId: classId, isClassLeader: isLeader });
    setEditingId(student._id);
    setShowModal(true);
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left w-full sm:w-auto">
            {classes.some(c => c.teacherId === currentUserId) 
              ? `My Students - ${classes.find(c => c.teacherId === currentUserId)?.className}` 
              : 'Students'}
          </h2>
          {classes.some(c => c.teacherId === currentUserId) && (
            <button onClick={openAddModal} className="w-full sm:w-auto text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
              + Add Student
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Student ID</th>
                    <th className="p-4 font-semibold text-gray-600">Name</th>
                    <th className="p-4 font-semibold text-gray-600">Class</th>
                    <th className="p-4 font-semibold text-gray-600">Gender</th>
                    <th className="p-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                  {students.map((student, index) => (
                    <motion.tr 
                      key={student._id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="p-4">{student.studentId}</td>
                      <td className="p-4 font-bold">{student.name}</td>
                      <td className="p-4">
                        {classes.find(c => c.students && (c.students.includes(student._id) || c.students.some(s => s._id === student._id)))?.className || 'Unassigned'}
                      </td>
                      <td className="p-4">{student.gender}</td>
                      <td className="p-4 flex gap-3">
                        {classes.find(c => c.students && (c.students.includes(student._id) || c.students.some(s => s._id === student._id)))?.teacherId === currentUserId && (
                          <>
                            <button onClick={() => openEditModal(student)} className="text-blue-600 hover:text-blue-800 transition" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(student._id)} className="text-red-600 hover:text-red-800 transition" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                  </AnimatePresence>
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
        )}
      </div>

      <AnimatePresence>
      {showModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
          >
            <div className="p-6 border-b bg-gray-50/50">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Student' : 'Register Student'}</h3>
            </div>
            <form onSubmit={editingId ? handleUpdate : handleRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student ID {!editingId && <span className="text-gray-400 text-xs">(Leave blank to auto-generate)</span>}</label>
                <input type="text" className={`w-full border rounded p-2 ${editingId ? 'bg-gray-50' : ''}`} value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required type="text" className="w-full border rounded p-2" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password {editingId && <span className="text-gray-400 text-xs">(Leave blank to keep unchanged)</span>} {!editingId && <span className="text-gray-400 text-xs">(Leave blank to auto-generate)</span>}</label>
                <input type="text" className="w-full border rounded p-2" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingId ? "New Password" : "Leave blank to auto-generate"} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select className="w-full border rounded p-2" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select required className="w-full border rounded p-2" value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} disabled={classes.filter(c => c.teacherId === currentUserId).length === 1}>
                  <option value="">Select Class</option>
                  {classes.filter(c => c.teacherId === currentUserId).map(c => (
                    <option key={c._id} value={c._id}>{c.className}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <input 
                  type="checkbox" 
                  id="isClassLeader"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={formData.isClassLeader}
                  onChange={(e) => setFormData({ ...formData, isClassLeader: e.target.checked })} 
                />
                <div>
                  <label htmlFor="isClassLeader" className="block text-sm font-bold text-gray-700 cursor-pointer">Assign as a Class Leader</label>
                  <p className="text-xs text-gray-500">Assign this student as the leader of the selected class.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingId ? 'Save Changes' : 'Register'}</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </Layout>
  );
};

export default TeacherGeneralRegister;
