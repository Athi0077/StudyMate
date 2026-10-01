import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const IDCard = ({ user, scale = 1, isPrint = false }) => {
  if (!user) return null;

  const cardStyle = {
    width: '320px',
    height: '500px',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    backgroundColor: '#fff',
    borderRadius: isPrint ? '0px' : '16px',
    boxShadow: isPrint ? 'none' : '0 10px 25px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    border: isPrint ? '1px solid #ccc' : 'none',
  };

  const getThemeColor = () => {
    if (user.role === 'principal') return 'from-purple-700 to-indigo-800';
    if (user.role === 'teacher') return 'from-blue-600 to-blue-800';
    return 'from-red-600 to-red-800';
  };

  const verifyUrl = `${window.location.origin}/verify-id/${user.verificationId}`;

  return (
    <div style={cardStyle} className="id-card-container">
      {/* Header */}
      <div className={`h-32 bg-gradient-to-r ${getThemeColor()} flex flex-col items-center justify-center text-white relative`}>
        <div className="absolute top-0 w-full h-full opacity-10 bg-white/20"></div>
        <h1 className="text-xl font-extrabold uppercase tracking-widest z-10">{user.schoolName || 'StudyMate School'}</h1>
        <p className="text-xs font-medium z-10 opacity-90 uppercase tracking-widest mt-1">Identity Card</p>
      </div>

      {/* Profile Pic */}
      <div className="flex justify-center -mt-12 z-20">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-sm">
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-4xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1 px-6 pt-3 pb-4 flex flex-col items-center text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
        <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">
          {user.role === 'student' ? 'Student' : user.designation || user.role}
        </p>

        <div className="w-full text-left text-sm text-gray-700 space-y-2 mb-4">
          {user.role === 'student' ? (
            <>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold">Admission No:</span>
                <span>{user.studentId || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold">Class:</span>
                <span>{user.className || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold">Academic Year:</span>
                <span>{user.academicYear || '-'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold">Employee ID:</span>
                <span>{user.employeeId || '-'}</span>
              </div>
              {user.role === 'teacher' && (
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="font-semibold">Classes:</span>
                  <span className="truncate max-w-[120px] text-right" title={user.assignedClasses}>{user.assignedClasses || '-'}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* QR Code */}
        <div className="mt-auto flex flex-col items-center">
          <div className="p-1.5 bg-white border border-gray-200 rounded-lg">
            <QRCodeSVG value={verifyUrl} size={64} level="M" />
          </div>
          <p className="text-[9px] text-gray-400 mt-1">Scan to verify</p>
        </div>
      </div>

      {/* Footer */}
      <div className={`h-2 bg-gradient-to-r ${getThemeColor()}`}></div>
    </div>
  );
};

export default IDCard;
