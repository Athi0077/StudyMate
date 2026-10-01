import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import TimetableView from '../components/timetable/TimetableView';

const PrincipalClassStudents = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await api.get(`/classes/${classId}`);
        setClassData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load class');
      }
    };
    fetchClass();
  }, [classId]);

  const exportPDF = () => {
    if (!classData || classData.students.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Student List - ${classData.className}`, 14, 15);
    doc.text(`Teacher: ${classData.teacherId.name}`, 14, 22);
    
    const tableColumn = ["#", "Student Name", "Email", "Phone", "Address", "Parent Name", "Parent Phone"];
    const tableRows = classData.students.map((student, index) => [
      index + 1,
      student.name,
      student.email || 'N/A',
      student.phone || 'N/A',
      student.address || 'N/A',
      student.parentName || 'N/A',
      student.parentPhone || 'N/A'
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save(`Students_${classData.className}.pdf`);
  };

  const exportCSV = () => {
    if (!classData || classData.students.length === 0) return;
    const headers = ["S.No", "Student Name", "Email", "Phone", "Address", "Parent Name", "Parent Phone"];
    const rows = classData.students.map((student, index) => [
      index + 1,
      `"${student.name}"`, // Quote to handle commas in names
      `"${student.email || 'N/A'}"`,
      `"${student.phone || 'N/A'}"`,
      `"${(student.address || 'N/A').replace(/"/g, '""')}"`,
      `"${student.parentName || 'N/A'}"`,
      `"${student.parentPhone || 'N/A'}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Students_${classData.className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) return <div className="p-6 text-red-600 font-bold">{error}</div>;
  if (!classData) return <div className="p-6">Loading...</div>;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/principal/students" className="text-blue-600 hover:underline">&larr; Back to Class List</Link>
      </div>
      <div className="bg-white shadow rounded p-6 mb-6 border-t-4 border-blue-600">
        <h2 className="text-3xl font-bold mb-2">{classData.className}</h2>
        <div className="text-gray-700 mb-1">Teacher: <span className="font-semibold">{classData.teacherId.name}</span></div>
        <div className="text-gray-700">Students: <span className="font-semibold">{classData.students.length}</span></div>
      </div>

      <div className="bg-white shadow rounded p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold">Students</h3>
          <div className="flex gap-2">
            <button 
              onClick={exportCSV}
              className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-semibold transition"
              disabled={classData.students.length === 0}
            >
              📄 Export CSV
            </button>
            <button 
              onClick={exportPDF}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold transition"
              disabled={classData.students.length === 0}
            >
              📑 Export PDF
            </button>
          </div>
        </div>
        {classData.students.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar border border-gray-100 rounded-xl mt-4">
            <table className="w-full text-left border-collapse text-sm min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4 whitespace-nowrap">Student Name</th>
                  <th className="p-4 whitespace-nowrap">Student Contact</th>
                  <th className="p-4 whitespace-nowrap">Parent Details</th>
                  <th className="p-4 w-1/4 min-w-[200px]">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {classData.students.map((student, index) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-gray-500">{index + 1}</td>
                    <td className="p-4 font-bold text-gray-800 whitespace-nowrap">{student.name}</td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-gray-800">{student.email || 'N/A'}</div>
                      <div className="text-blue-600 font-medium text-xs mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded-md">📞 {student.phone || 'N/A'}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-gray-800 font-medium">{student.parentName || 'Not Linked'}</div>
                      {student.parentPhone && <div className="text-purple-600 font-medium text-xs mt-1 bg-purple-50 inline-block px-2 py-0.5 rounded-md">📞 {student.parentPhone}</div>}
                    </td>
                    <td className="p-4 text-gray-600">
                      <p className="line-clamp-2" title={student.address}>{student.address || 'N/A'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No students joined yet.</p>
        )}
      </div>

      <TimetableView classId={classId} />
    </div>
    </Layout>
  );
};

export default PrincipalClassStudents;
