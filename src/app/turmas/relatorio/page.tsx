"use client";

import { useState, useEffect } from 'react';
import { firestore } from '../../lib/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import LogOut from '@/app/components/logout';

// Definindo as interfaces para Aluno e Turma
interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
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
  const [alunoFields, setAlunoFields] = useState<{ nome: string; sobrenome: string; anoCursando: number }>({ nome: '', sobrenome: '', anoCursando: 0 });

  // Estado para modais e notificações
  const [isTurmaModalOpen, setTurmaModalOpen] = useState(false);
  const [isAlunoModalOpen, setAlunoModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchTurmas = async () => {
      const turmaCollectionRef = collection(firestore, 'turmas');
      const turmaDocs = await getDocs(turmaCollectionRef);
      const turmasData = turmaDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Turma[];

      // Atualiza a contagem de alunos
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
      setAlunos(alunosData);
    } else {
      setAlunos([]);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteTurma = async (turmaId: string) => {
    if (confirm("Você tem certeza que deseja excluir esta turma?")) {
      const turmaDocRef = doc(firestore, 'turmas', turmaId);
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
  };

  const handleEditAluno = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setAlunoFields({ nome: aluno.nome, sobrenome: aluno.sobrenome, anoCursando: aluno.anoCursando });
    setAlunoModalOpen(true);
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
    if (!alunoFields.nome || !alunoFields.sobrenome || alunoFields.anoCursando <= 0) {
      showNotification('Todos os campos são obrigatórios!', 'error');
      return;
    }

    if (editingAluno) {
      const alunoDocRef = doc(firestore, 'alunos', editingAluno.id);
      await updateDoc(alunoDocRef, alunoFields);
      setAlunos(alunos.map(aluno => aluno.id === editingAluno.id ? { ...aluno, ...alunoFields } : aluno));
      setEditingAluno(null);
      setAlunoFields({ nome: '', sobrenome: '', anoCursando: 0 });
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

  // Componente Modal
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

  // Componente de Notificação
  const Notification = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
    <div className={`fixed top-5 right-5 p-3 rounded text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      {message}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-2">
      <LogOut />
      <h1 className="text-2xl font-bold mb-4">Relatório de Turmas</h1>
      <select onChange={handleTurmaChange} className="border p-2 mb-4">
        <option value="">Selecione uma turma</option>
        {turmas.map(turma => (
          <option key={turma.id} value={turma.id}>{turma.nomeEscola} - {turma.anoTurma}</option>
        ))}
      </select>

      {turmaSelecionada && (
        <div>
          <h2 className="text-xl mb-4">Alunos na Turma:</h2>
          {alunos.map(aluno => (
            <div key={aluno.id} className="flex justify-between items-center mb-2">
              <span>{aluno.nome} {aluno.sobrenome} - {aluno.anoCursando}</span>
              <div>
                <button onClick={() => handleEditAluno(aluno)} className="text-blue-500 hover:underline mr-2">Editar</button>
                <button onClick={() => handleDeleteAluno(aluno.id)} className="text-red-500 hover:underline">Excluir</button>
              </div>
            </div>
          ))}
          <button onClick={() => setAlunoModalOpen(true)} className="bg-green-500 text-white px-4 py-2 rounded">Adicionar Aluno</button>
        </div>
      )}

      <h2 className="text-xl mb-4">Turmas:</h2>
      {turmas.map(turma => (
        <div key={turma.id} className="flex justify-between items-center mb-2">
          <span>{turma.nomeEscola} - {turma.anoTurma}</span>
          <div>
            <button onClick={() => handleEditTurma(turma)} className="text-blue-500 hover:underline mr-2">Editar</button>
            <button onClick={() => handleDeleteTurma(turma.id)} className="text-red-500 hover:underline">Excluir</button>
          </div>
        </div>
      ))}

      <Modal isOpen={isTurmaModalOpen} onClose={() => setTurmaModalOpen(false)} title="Editar Turma">
        <div>
          <input type="text" value={turmaFields.nomeEscola} onChange={e => setTurmaFields({ ...turmaFields, nomeEscola: e.target.value })} placeholder="Nome da Escola" className="border p-2 mb-2 w-full" />
          <input type="text" value={turmaFields.anoTurma} onChange={e => setTurmaFields({ ...turmaFields, anoTurma: e.target.value })} placeholder="Ano da Turma" className="border p-2 mb-2 w-full" />
        </div>
      </Modal>

      <Modal isOpen={isAlunoModalOpen} onClose={() => setAlunoModalOpen(false)} title="Editar Aluno">
        <div>
          <input type="text" value={alunoFields.nome} onChange={e => setAlunoFields({ ...alunoFields, nome: e.target.value })} placeholder="Nome" className="border p-2 mb-2 w-full" />
          <input type="text" value={alunoFields.sobrenome} onChange={e => setAlunoFields({ ...alunoFields, sobrenome: e.target.value })} placeholder="Sobrenome" className="border p-2 mb-2 w-full" />
          <input type="number" value={alunoFields.anoCursando} onChange={e => setAlunoFields({ ...alunoFields, anoCursando: Number(e.target.value) })} placeholder="Ano Cursando" className="border p-2 mb-2 w-full" />
        </div>
      </Modal>

      {notification && <Notification {...notification} />}
    </div>
  );
}
