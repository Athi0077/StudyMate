import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role] = useState('student');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const uniqueStandards = [...new Set(availableClasses.map(c => c.standard))];
  const availableSections = selectedStandard ? availableClasses.filter(c => c.standard === selectedStandard) : [];
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    import('../utils/api').then(({ default: api }) => {
      api.get('/classes/available').then(res => {
        setAvailableClasses(res.data.data);
      }).catch(err => console.error(err));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await register(name, email, password, role, selectedClassId);
      setSuccessMsg('Registration successful! Redirecting to dashboard...');
      setTimeout(() => navigate('/student/dashboard'), 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{successMsg}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>

          <div className="mb-6">
            {availableClasses.length > 0 ? (
              <div className="mt-4 p-4 border rounded bg-blue-50 space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Select Your Standard</label>
                  <select 
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedStandard}
                    onChange={(e) => {
                      setSelectedStandard(e.target.value);
                      setSelectedClassId('');
                    }}
                    required
                  >
                    <option value="" disabled>-- Select a standard --</option>
                    {uniqueStandards.map(std => (
                      <option key={std} value={std}>{std}</option>
                    ))}
                  </select>
                </div>
                
                {selectedStandard && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Select Your Section</label>
                    <select 
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      required
                    >
                      <option value="" disabled>-- Select a section --</option>
                      {availableSections.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.section}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-2">
                      Choosing a section will automatically send a join request to the teacher.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 p-4 border rounded bg-red-50">
                <p className="text-sm text-red-600 font-semibold">No classes are currently available for registration.</p>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
