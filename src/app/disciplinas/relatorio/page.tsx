"use client";

import { useState, useEffect } from 'react';
import { firestore } from '../../lib/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import LogOut from '@/app/components/logout';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';
import jsPDF from 'jspdf';

interface Disciplina {
  id: string;
  nomeDisciplina: string;
  nomeProfessor: string;
}

export default function RelatorioDisciplinas() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [disciplinaFields, setDisciplinaFields] = useState<{ nomeDisciplina: string; nomeProfessor: string }>({ nomeDisciplina: '', nomeProfessor: '' });
  const [isModalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchDisciplinas = async () => {
      const disciplinaCollectionRef = collection(firestore, 'disciplinas');
      const disciplinaDocs = await getDocs(disciplinaCollectionRef);
      const disciplinasData = disciplinaDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Disciplina[];
      setDisciplinas(disciplinasData);
    };

    fetchDisciplinas();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteDisciplina = async (disciplinaId: string) => {
    if (confirm("Você tem certeza que deseja excluir esta disciplina? Esta ação não pode ser desfeita.")) {
      const disciplinaDocRef = doc(firestore, 'disciplinas', disciplinaId);
      await deleteDoc(disciplinaDocRef);
      setDisciplinas(disciplinas.filter(disciplina => disciplina.id !== disciplinaId));
      showNotification('Disciplina excluída com sucesso!', 'success');
    }
  };

  const handleEditDisciplina = (disciplina: Disciplina) => {
    setEditingDisciplina(disciplina);
    setDisciplinaFields({ nomeDisciplina: disciplina.nomeDisciplina, nomeProfessor: disciplina.nomeProfessor });
    setModalOpen(true);
  };

  const handleUpdateDisciplina = async () => {
    if (!disciplinaFields.nomeDisciplina || !disciplinaFields.nomeProfessor) {
      showNotification('Todos os campos são obrigatórios!', 'error');
      return;
    }

    if (editingDisciplina) {
      const disciplinaDocRef = doc(firestore, 'disciplinas', editingDisciplina.id);
      await updateDoc(disciplinaDocRef, disciplinaFields);
      setDisciplinas(disciplinas.map(disciplina => disciplina.id === editingDisciplina.id ? { ...disciplina, ...disciplinaFields } : disciplina));
      setEditingDisciplina(null);
      setDisciplinaFields({ nomeDisciplina: '', nomeProfessor: '' });
      setModalOpen(false);
      showNotification('Disciplina atualizada com sucesso!', 'success');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let yOffset = margin;

    // Helper function to create table
    const createTable = (headers: string[], data: (string | number)[][], startY: number) => {
      const cellWidth = (pageWidth - 2 * margin) / headers.length;
      const cellHeight = 10;
      let currentY = startY;

      // Draw header
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, currentY, pageWidth - 2 * margin, cellHeight, 'F');
      doc.setTextColor(0);
      doc.setFontSize(10);
      headers.forEach((header, index) => {
        doc.text(header, margin + cellWidth * index + 2, currentY + 7);
      });
      currentY += cellHeight;

      // Draw rows
      data.forEach((row) => {
        if (currentY + cellHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, currentY, pageWidth - 2 * margin, cellHeight, 'F');
        row.forEach((cell, cellIndex) => {
          doc.text(cell.toString(), margin + cellWidth * cellIndex + 2, currentY + 7);
        });
        currentY += cellHeight;
      });

      return currentY;
    };

    // Add title
    doc.setFontSize(16);
    doc.text('Relatório de Disciplinas e Professores', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;

    // Add date
    doc.setFontSize(12);
    const currentDate = new Date().toLocaleDateString('pt-BR');
    doc.text(currentDate, pageWidth - margin, margin, { align: 'right' });
    yOffset += 10;

    const headers = ['Disciplina', 'Professor'];
    const tableData = disciplinas.map(disciplina => [
      disciplina.nomeDisciplina,
      disciplina.nomeProfessor,
    ]);

    createTable(headers, tableData, yOffset);

    doc.save('relatorio_disciplinas_professores.pdf');
  };

  if (loading) return <p>Loading...</p>;

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-2">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 mt-2">Relatório de Disciplinas e Professores</h1>

      {notification && (
        <div className={`fixed top-5 right-5 p-3 rounded text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white border-8 p-4 md:p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl md:text-3xl font-semibold text-gray-700 mb-4">Lista de Disciplinas e Professores</h2>
        <table className="w-full border-t border-b">
          <thead>
            <tr className='text-sm md:text-1xl bg-gray-200 border-2 border-y-black'>
              <th className="text-left text-black py-1 md:py-2">Disciplina</th>
              <th className="text-left text-black py-1 md:py-2">Professor</th>
              <th className="text-left text-black py-1 md:py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {disciplinas.map((disciplina) => (
              <tr key={disciplina.id} className='text-sm md:text-1xl border-b border-gray-200 text-gray-800'>
                <td className="py-1 md:py-1">{disciplina.nomeDisciplina}</td>
                <td className="py-1 md:py-1">{disciplina.nomeProfessor}</td>
                <td className="py-1 md:py-1 flex items-center">
                  <button onClick={() => handleEditDisciplina(disciplina)} className="bg-purple-600 text-white p-2 rounded hover:bg-purple-900 flex items-center">
                    <PencilIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  </button>
                  <button onClick={() => handleDeleteDisciplina(disciplina.id)} className="bg-red-600 text-white p-2 rounded hover:bg-red-900 ml-2 flex items-center">
                    <TrashIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={generatePDF}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:bg-green-600 transition duration-150"
        >
          Gerar PDF
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-4 w-11/12 md:w-1/3">
            <h2 className="text-xl font-semibold text-black mb-4">Editar Disciplina e Professor</h2>
            <input
              type="text"
              placeholder="Nome da Disciplina"
              value={disciplinaFields.nomeDisciplina}
              onChange={(e) => setDisciplinaFields({ ...disciplinaFields, nomeDisciplina: e.target.value })}
              className="border p-2 mb-2 w-full text-black"
            />
            <input
              type="text"
              placeholder="Nome do Professor"
              value={disciplinaFields.nomeProfessor}
              onChange={(e) => setDisciplinaFields({ ...disciplinaFields, nomeProfessor: e.target.value })}
              className="border p-2 mb-2 w-full text-black"
            />
            <div className="flex justify-end mt-4">
              <button onClick={() => setModalOpen(false)} className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-600 mr-2">Cancelar</button>
              <button onClick={handleUpdateDisciplina} className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-900">
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

