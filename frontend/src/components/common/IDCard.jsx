import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const IDCard = ({ user, scale = 1, isPrint = false }) => {
  if (!user) return null;

  const cardStyle = {
    width: '320px',
    height: '520px',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    backgroundColor: '#fff',
    borderRadius: isPrint ? '16px' : '16px',
    boxShadow: isPrint ? '0 4px 20px rgba(0,0,0,0.08)' : '0 10px 25px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e5e7eb',
  };

  const getThemeColor = () => {
    if (user.role === 'principal') return 'from-purple-700 via-indigo-700 to-indigo-800';
    if (user.role === 'teacher') return 'from-blue-600 via-blue-700 to-indigo-700';
    return 'from-red-600 via-rose-700 to-red-800';
  };

  const getRoleBadgeBg = () => {
    if (user.role === 'principal') return 'bg-purple-50 text-purple-700 border-purple-100';
    if (user.role === 'teacher') return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const verifyUrl = `${window.location.origin}/verify-id/${user.verificationId}`;

  return (
    <div style={cardStyle} className="id-card-container font-sans">
      {/* Header Banner */}
      <div className={`h-36 bg-gradient-to-r ${getThemeColor()} flex flex-col items-center justify-start pt-5 text-white relative px-4`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-15 bg-white/20"></div>
        <h1 className="text-base font-black uppercase tracking-wider z-10 text-center leading-tight drop-shadow-sm">
          {user.schoolName || 'StudyMate School'}
        </h1>
        <p className="text-[10px] font-bold z-10 opacity-90 uppercase tracking-widest mt-1 text-white/90">
          Identity Card
        </p>
      </div>

      {/* Profile Pic Circle */}
      <div className="flex justify-center -mt-12 z-20">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-md flex items-center justify-center">
          {user.profilePic ? (
            <img 
              src={user.profilePic} 
              alt={user.name} 
              crossOrigin="anonymous" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-gray-200 to-gray-300 text-gray-600 text-4xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* User Info Section */}
      <div className="flex-1 px-6 pt-2 pb-4 flex flex-col items-center text-center">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-snug">{user.name}</h2>
        <span className={`inline-block px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-full border mt-1 mb-3 ${getRoleBadgeBg()}`}>
          {user.role === 'student' ? 'Student' : user.designation || user.role}
        </span>

        {/* Details Table */}
        <div className="w-full text-left text-xs space-y-2 mb-3 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
          {user.role === 'student' ? (
            <>
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Admission No</span>
                <span className="font-bold text-gray-800">{user.studentId || '-'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Class</span>
                <span className="font-bold text-gray-800">{user.className || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Academic Year</span>
                <span className="font-bold text-gray-800">{user.academicYear || '-'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Employee ID</span>
                <span className="font-bold text-gray-800">{user.employeeId || '-'}</span>
              </div>
              {user.role === 'teacher' && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Classes</span>
                  <span className="font-bold text-gray-800 truncate max-w-[130px] text-right" title={user.assignedClasses}>
                    {user.assignedClasses || '-'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* QR Code Section */}
        <div className="mt-auto flex flex-col items-center">
          <div className="p-1.5 bg-white border border-gray-200/80 rounded-xl shadow-xs">
            <QRCodeSVG value={verifyUrl} size={60} level="M" />
          </div>
          <p className="text-[9px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">Scan to verify</p>
        </div>
      </div>

      {/* Footer Accent Line */}
      <div className={`h-2.5 bg-gradient-to-r ${getThemeColor()}`}></div>
    </div>
  );
};

export default IDCard;
