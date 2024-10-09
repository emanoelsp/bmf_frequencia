"use client";

import { useState, useEffect, useRef } from 'react';
import { firestore } from '../../lib/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import LogOut from '@/app/components/logout';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';


interface Aluno {
  id: string;
  nome: string;
  anoCursando: number;
  turmaId: string;
}

interface Turma {
  id: string;
  nomeEscola: string;
  anoTurma: string;
  codigoTurma: string;
  alunosCount?: number;
}

export default function RelatorioTurmas() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [turmaFields, setTurmaFields] = useState<{ nomeEscola: string; anoTurma: string }>({ nomeEscola: '', anoTurma: '' });
  const [alunoFields, setAlunoFields] = useState<{ nome: string; anoCursando: number }>({ nome: '', anoCursando: 0 });

  const [isTurmaModalOpen, setTurmaModalOpen] = useState(false);
  const [isAlunoModalOpen, setAlunoModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [autoFocusInput, setAutoFocusInput] = useState<string | null>(null); // New state for autofocus

  // Refs for inputs
  const nomeEscolaRef = useRef<HTMLInputElement>(null);
  const anoTurmaRef = useRef<HTMLInputElement>(null);
  const alunoNomeRef = useRef<HTMLInputElement>(null);
  const alunoAnoCursandoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTurmas = async () => {
      const turmaCollectionRef = collection(firestore, 'turmas');
      const turmaDocs = await getDocs(turmaCollectionRef);
      const turmasData = turmaDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Turma[];

      for (const turma of turmasData) {
        const alunosQuery = query(collection(firestore, 'alunos'), where('turmaId', '==', turma.id));
        const alunosSnapshot = await getDocs(alunosQuery);
        turma.alunosCount = alunosSnapshot.docs.length;
      }

      setTurmas(turmasData);
    };

    fetchTurmas();
  }, []);

  const handleTurmaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const turmaId = e.target.value;
    setTurmaSelecionada(turmaId);

    if (turmaId) {
      const alunosQuery = query(collection(firestore, 'alunos'), where('turmaId', '==', turmaId));
      const alunosSnapshot = await getDocs(alunosQuery);
      const alunosData = alunosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Aluno[];

      // Ordenar os alunos por nome
      const alunosOrdenados = alunosData.sort((a, b) => a.nome.localeCompare(b.nome));
      setAlunos(alunosOrdenados);
    } else {
      setAlunos([]);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteTurma = async (turmaId: string) => {
    const turmaDocRef = doc(firestore, 'turmas', turmaId);
    const turmaDoc = await getDoc(turmaDocRef);

    if (!turmaDoc.exists()) {
      showNotification('Turma não encontrada!', 'error');
      return;
    }

    const turmaData = turmaDoc.data() as Turma;

    if (turmaData.alunosCount && turmaData.alunosCount > 0) {
      showNotification('Esta turma não pode ser excluída porque possui alunos!', 'error');
      return;
    }

    if (confirm("Você tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.")) {
      await deleteDoc(turmaDocRef);
      setTurmas(turmas.filter(turma => turma.id !== turmaId));
      setTurmaSelecionada('');
      showNotification('Turma excluída com sucesso!', 'success');
    }
  };

  const handleDeleteAluno = async (alunoId: string) => {
    const alunoDocRef = doc(firestore, 'alunos', alunoId);
    const alunoDoc = await getDoc(alunoDocRef);

    if (alunoDoc.exists()) {
      const turmaId = alunoDoc.data().turmaId;
      await deleteDoc(alunoDocRef);

      const updatedAlunos = alunos.filter(aluno => aluno.id !== alunoId);
      setAlunos(updatedAlunos);

      const turmaDocRef = doc(firestore, 'turmas', turmaId);
      await updateDoc(turmaDocRef, {
        alunosCount: updatedAlunos.length,
      });

      setTurmas(prevTurmas =>
        prevTurmas.map(turma =>
          turma.id === turmaId ? { ...turma, alunosCount: updatedAlunos.length } : turma
        )
      );

      showNotification('Aluno excluído com sucesso!', 'success');
    }
  };

  const handleEditTurma = (turma: Turma) => {
    setEditingTurma(turma);
    setTurmaFields({ nomeEscola: turma.nomeEscola, anoTurma: turma.anoTurma });
    setTurmaModalOpen(true);
    setAutoFocusInput('nomeEscola'); // Set focus to nomeEscola
  };

  const handleEditAluno = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setAlunoFields({ nome: aluno.nome, anoCursando: aluno.anoCursando });
    setAlunoModalOpen(true);
    setAutoFocusInput('nome'); // Set focus to aluno name
  };

  const handleUpdateTurma = async () => {
    if (!turmaFields.nomeEscola || !turmaFields.anoTurma) {
      showNotification('Todos os campos são obrigatórios!', 'error');
      return;
    }

    if (editingTurma) {
      const turmaDocRef = doc(firestore, 'turmas', editingTurma.id);
      await updateDoc(turmaDocRef, turmaFields);
      setTurmas(turmas.map(turma => turma.id === editingTurma.id ? { ...turma, ...turmaFields } : turma));
      setEditingTurma(null);
      setTurmaFields({ nomeEscola: '', anoTurma: '' });
      setTurmaModalOpen(false);
      showNotification('Turma atualizada com sucesso!', 'success');
    }
  };

  const handleUpdateAluno = async () => {
    if (!alunoFields.nome || alunoFields.anoCursando <= 0) {
      showNotification('Todos os campos são obrigatórios!', 'error');
      return;
    }

    if (editingAluno) {
      const alunoDocRef = doc(firestore, 'alunos', editingAluno.id);
      await updateDoc(alunoDocRef, alunoFields);
      setAlunos(alunos.map(aluno => aluno.id === editingAluno.id ? { ...aluno, ...alunoFields } : aluno));
      setEditingAluno(null);
      setAlunoFields({ nome: '', anoCursando: 0 });
      setAlunoModalOpen(false);
      showNotification('Aluno atualizado com sucesso!', 'success');
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded p-4 w-11/12 md:w-1/3">
          <h2 className="text-xl font-semibold text-black mb-4">{title}</h2>
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500">✖️</button>
          {children}
          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-600 mr-2">Cancelar</button>
            <button onClick={title === "Editar Turma" ? handleUpdateTurma : handleUpdateAluno} className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-900">
              Atualizar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Notification = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
    <div className={`fixed top-5 right-5 p-3 rounded text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      {message}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-2 pb-8 md:pb-0">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 mt-2"> Relatório de Turmas e Alunos</h1>

      {notification && <Notification message={notification.message} type={notification.type} />}

      <div className="bg-white border-8 p-4 md:p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl md:text-3xl font-semibold text-gray-700 mb-4">Relatório de turmas cadastradas</h2>
        <hr className='border-4' />

        <h2 className="text-xl md:text-1xl font-semibold text-gray-700 mb-4">Lista de turmas:</h2>

        <table className="w-full border-t border-b">
          <thead>
            <tr className='text-sm md:text-1xl bg-gray-200 border-2 border-y-black'>
              <th className="text-left text-black py-1 md:py-2">Nome da Escola</th>
              <th className="text-left text-black py-1 md:py-2">Ano da Turma</th>
              <th className="text-left text-black py-1 md:py-2">Código da Turma</th>
              <th className="text-left text-black py-1 md:py-2">Número de Alunos</th>
              <th className="text-left text-black py-1 md:py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((turma) => (
              <tr key={turma.id} className='text-sm md:text-1xl border-b border-gray-200 text-gray-800'>
                <td className="py-1 md:py-1">{turma.nomeEscola}</td>
                <td className="py-1 md:py-1">{turma.anoTurma}</td>
                <td className="py-1 md:py-1">{turma.codigoTurma}</td>
                <td className="py-1 md:py-1">{turma.alunosCount || 0}</td>
                <td className="py-1 md:py-1 flex items-center">
                  <button onClick={() => handleEditTurma(turma)} className="bg-purple-600 text-white p-2 rounded hover:bg-purple-900 flex items-center">
                    <PencilIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  </button>
                  <button onClick={() => handleDeleteTurma(turma.id)} className="bg-red-600 text-white p-2 rounded hover:bg-red-900 ml-2 flex items-center">
                    <TrashIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border-8 p-4 md:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl md:text-3xl font-semibold text-gray-700 mb-4">Relatório de alunos por turma</h2>
        <hr className='border-4 mb-2' />
        <h2 className="text-xl md:text-1xl font-semibold text-gray-700 mb-4">Selecione a turma:</h2>
        <select value={turmaSelecionada} onChange={handleTurmaChange} className="text-gray-700 border border-gray-300 rounded p-2 mb-4 w-full">
          <option value="">Selecione uma turma</option>
          {turmas.map((turma) => (
            <option key={turma.id} value={turma.id}>{turma.nomeEscola} - {turma.anoTurma}</option>
          ))}
        </select>
        {turmaSelecionada && (
          <div className="mb-4 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700">
            <h3 className="font-bold">Detalhes da Turma: </h3>
            <h1 className='text-lg md:text-2xl text-blue-600'>
              Escola: {turmas.find(t => t.id === turmaSelecionada)?.nomeEscola}
            </h1>
            <h2 className='text-md md:text-lg text-blue-600'>
              Turma: {turmas.find(t => t.id === turmaSelecionada)?.anoTurma} - {turmas.find(t => t.id === turmaSelecionada)?.codigoTurma}
            </h2>
          </div>
        )}

        <h2 className="text-xl md:text-1xl font-semibold text-gray-700 mb-4">Lista de alunos:</h2>

        <table className="w-full border-t border-b">
          <thead>
            <tr className='text-sm md:text-1xl bg-gray-200 border-2 border-y-black'>
              <th className="text-left text-black py-1 md:py-2">Nome Completo</th>
              <th className="text-left text-black py-1 md:py-2">Ano Cursando</th>
              <th className="text-left text-black py-1 md:py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id} className='text-sm md:text-1xl border-b border-gray-200 text-gray-800'>
                <td>{aluno.nome}</td>
                <td>{aluno.anoCursando}</td>
                <td className="flex items-center">
                  <button onClick={() => handleEditAluno(aluno)} className="bg-purple-600 text-white p-2 rounded hover:bg-purple-900 flex items-center">
                    <PencilIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  </button>
                  <button onClick={() => handleDeleteAluno(aluno.id)} className="bg-red-600 text-white p-2 rounded hover:bg-red-900 ml-2 flex items-center">
                    <TrashIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* Modais de Edição */}
      <Modal isOpen={isTurmaModalOpen} onClose={() => setTurmaModalOpen(false)} title="Editar Turma">
        <label className='text-gray-500 text-lg'> Nome da Escola: </label>
        <input
          type="text"
          placeholder="Nome da Escola"
          value={turmaFields.nomeEscola}
          ref={nomeEscolaRef}
          onFocus={() => setAutoFocusInput('nomeEscola')}
          onChange={(e) => setTurmaFields({ ...turmaFields, nomeEscola: e.target.value })}
          className="border p-2 mb-2 w-full text-black"
          autoFocus={autoFocusInput === 'nomeEscola'}
        />
        <label className='text-gray-500 text-lg'> Ano da Turma: </label>
        <input
          type="text"
          placeholder="Ano da Turma"
          value={turmaFields.anoTurma}
          ref={anoTurmaRef}
          onFocus={() => setAutoFocusInput('anoTurma')}
          onChange={(e) => setTurmaFields({ ...turmaFields, anoTurma: e.target.value })}
          className="border p-2 mb-2 w-full text-black"
          autoFocus={autoFocusInput === 'anoTurma'}
        />
      </Modal>

      <Modal isOpen={isAlunoModalOpen} onClose={() => setAlunoModalOpen(false)} title="Editar Aluno">
        <label className='text-gray-500 text-lg'> Nome Aluno: </label>
        <input
          type="text"
          placeholder="Nome"
          value={alunoFields.nome}
          ref={alunoNomeRef}
          onFocus={() => setAutoFocusInput('nome')}
          onChange={(e) => setAlunoFields({ ...alunoFields, nome: e.target.value })}
          className="border p-2 mb-2 w-full text-black"
          autoFocus={autoFocusInput === 'nome'}
        />

        <label className='text-gray-500 text-lg'> Série que está cursando: </label>
        <input
          type="text"
          placeholder="Ano Cursando"
          value={alunoFields.anoCursando}
          ref={alunoAnoCursandoRef}
          onFocus={() => setAutoFocusInput('anoCursando')}
          onChange={(e) => setAlunoFields({ ...alunoFields, anoCursando: parseInt(e.target.value) })}
          className="border p-2 mb-2 w-full text-black"
          autoFocus={autoFocusInput === 'anoCursando'}
        />
      </Modal>

    </div>
  );
}
