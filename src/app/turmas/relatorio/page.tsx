'use client'

import { useState, useEffect } from 'react';
import { firestore } from '../../lib/firebaseConfig';
import { collection, getDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore'; 
import { useAuth } from '../../hooks/auseAuth'; 
import { useRouter } from 'next/navigation'; 
import LogOut from '@/app/components/logout';

// Defina a interface para Aluno
interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  anoCursando: number;
  turmaId: string; 
}

// Defina a interface para Turma
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

  // Estado para edição
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [turmaFields, setTurmaFields] = useState<{ nomeEscola: string, anoTurma: string }>({ nomeEscola: '', anoTurma: '' });
  const [alunoFields, setAlunoFields] = useState<{ nome: string, sobrenome: string, anoCursando: number }>({ nome: '', sobrenome: '', anoCursando: 0 });

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
        turma.alunosCount = alunosSnapshot.docs.length; // Define a contagem de alunos
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
      setAlunos([]); // Limpa a lista se nenhuma turma for selecionada
    }
  };

  const handleDeleteTurma = async (turmaId: string) => {
    if (confirm("Você tem certeza que deseja excluir esta turma?")) {
      const turmaDocRef = doc(firestore, 'turmas', turmaId);
      await deleteDoc(turmaDocRef);
      setTurmas(turmas.filter(turma => turma.id !== turmaId));
      setTurmaSelecionada(''); // Limpa a seleção
    }
  };

  const handleDeleteAluno = async (alunoId: string) => {
    const alunoDocRef = doc(firestore, 'alunos', alunoId);
    const alunoDoc = await getDoc(alunoDocRef);

    if (alunoDoc.exists()) {
      const turmaId = alunoDoc.data().turmaId;

      // Exclui o aluno
      await deleteDoc(alunoDocRef);

      // Atualiza a lista de alunos no estado
      const updatedAlunos = alunos.filter(aluno => aluno.id !== alunoId);
      setAlunos(updatedAlunos);

      // Atualiza a contagem de alunos na turma
      const turmaDocRef = doc(firestore, 'turmas', turmaId);
      await updateDoc(turmaDocRef, {
        alunosCount: updatedAlunos.length, // Atualiza a contagem de alunos
      });

      // Atualiza o estado das turmas para refletir a nova contagem
      setTurmas(prevTurmas => 
        prevTurmas.map(turma => 
          turma.id === turmaId ? { ...turma, alunosCount: updatedAlunos.length } : turma
        )
      );
    }
  };

  const handleEditTurma = (turma: Turma) => {
    setEditingTurma(turma);
    setTurmaFields({ nomeEscola: turma.nomeEscola, anoTurma: turma.anoTurma });
  };

  const handleEditAluno = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setAlunoFields({ nome: aluno.nome, sobrenome: aluno.sobrenome, anoCursando: aluno.anoCursando });
  };

  const handleUpdateTurma = async () => {
    if (editingTurma) {
      const turmaDocRef = doc(firestore, 'turmas', editingTurma.id);
      await updateDoc(turmaDocRef, turmaFields);
      setTurmas(turmas.map(turma => turma.id === editingTurma.id ? { ...turma, ...turmaFields } : turma));
      setEditingTurma(null);
      setTurmaFields({ nomeEscola: '', anoTurma: '' });
    }
  };

  const handleUpdateAluno = async () => {
    if (editingAluno) {
      const alunoDocRef = doc(firestore, 'alunos', editingAluno.id);
      await updateDoc(alunoDocRef, alunoFields);
      setAlunos(alunos.map(aluno => aluno.id === editingAluno.id ? { ...aluno, ...alunoFields } : aluno));
      setEditingAluno(null);
      setAlunoFields({ nome: '', sobrenome: '', anoCursando: 0 });
    }
  };



  useEffect(() => {
    if (loading) return; 
    if (!user) {
      router.push('/login'); 
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-black mb-8">Relatório de Turmas e Alunos</h1>

      {/* Tabela de Turmas Cadastradas */}
      <div className="bg-white border-8 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-black mb-4">Turmas Cadastradas:</h2>
        <table className="w-full border-t border-b">
          <thead>
            <tr>
              <th className="text-left text-black py-2">Nome da Escola</th>
              <th className="text-left text-black py-2">Ano da Turma</th>
              <th className="text-left text-black py-2">Código da Turma</th>
              <th className="text-left text-black py-2">Número de Alunos</th>
              <th className="text-left text-black py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((turma, index) => (
              <tr key={turma.id} className={index % 2 === 0 ? "bg-gray-200" : "bg-white"}>
                <td className="py-2 text-black">{turma.nomeEscola}</td>
                <td className="py-2 text-black">{turma.anoTurma}</td>
                <td className="py-2 text-black">{turma.codigoTurma}</td>
                <td className="py-2 text-black">{turma.alunosCount || 0}</td>
                <td className="py-2">
                  <button
                    className="text-purple-700 hover:text-purple-900 mr-4"
                    onClick={() => handleEditTurma(turma)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteTurma(turma.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingTurma && (
         
          <div className="border-8 p-4 mt-4">
            <hr></hr>
            <h3 className="mt-2 mb-2 text-2xl text-purple-700 font-semibold">Editar Turma</h3>
            <input
              type="text"
              placeholder="Nome da Escola"
              value={turmaFields.nomeEscola}
              onChange={(e) => setTurmaFields({ ...turmaFields, nomeEscola: e.target.value })}
              className="border p-2 mb-2 w-full text-black"
            />
            <input
              type="text"
              placeholder="Ano da Turma"
              value={turmaFields.anoTurma}
              onChange={(e) => setTurmaFields({ ...turmaFields, anoTurma: e.target.value })}
              className="border p-2 mb-2 w-full text-black"
            />
            <button onClick={handleUpdateTurma} className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-900">
              Atualizar
            </button>
          </div>
        )}
      </div>

      {/* Seção de Listagem de Alunos */}
      <div className="bg-white border-8 p-6 rounded-lg shadow-lg">
        <h1 className="text-xl font-semibold text-black mb-4">Alunos Cadastrados:</h1>
        <div className="mb-8">
          <label className="block text-gray-600 mb-2" htmlFor="turma">Selecione a Turma:</label>
          <select
            id="turma"
            value={turmaSelecionada}
            onChange={handleTurmaChange}
            className="w-full p-3 border border-gray-300 rounded text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione uma turma</option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id} className="text-black">
                {turma.nomeEscola} - {turma.anoTurma} - {turma.codigoTurma} 
              </option>
            ))}
          </select>
        </div>
        <h2 className="text-xl font-semibold text-black mb-4">Lista de Alunos Cadastrados:</h2>
        <table className="w-full border-t border-b">
          <thead>
            <tr>
              <th className="text-left text-black py-2">Nome do Aluno</th>
              <th className="text-left text-black py-2">Ano que está cursando</th>
              <th className="text-left text-black py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno, index) => (
              <tr key={aluno.id} className={index % 2 === 0 ? "bg-gray-200" : "bg-white"}>
                <td className="py-2 text-black">{aluno.nome} {aluno.sobrenome}</td>
                <td className="py-2 text-black">{aluno.anoCursando}</td>
                <td className="py-2">
                  <button
                    className="text-purple-700 hover:text-purple-900 mr-4"
                    onClick={() => handleEditAluno(aluno)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteAluno(aluno.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingAluno && (
          <div className="mt-4 border-8 p-4 ">
            <h3 className="text-lg font-semibold text-purple-700">Editar Aluno</h3>
            <input
              type="text"
              placeholder="Nome"
              value={alunoFields.nome}
              onChange={(e) => setAlunoFields({ ...alunoFields, nome: e.target.value })}
              className="border p-2 mb-2 w-full text-black"
            />
            <input
              type="text"
              placeholder="Sobrenome"
              value={alunoFields.sobrenome}
              onChange={(e) => setAlunoFields({ ...alunoFields, sobrenome: e.target.value })}
              className="border p-2 mb-2 w-full text-black"
            />
            <input
              type="number"
              placeholder="Ano Cursando"
              value={alunoFields.anoCursando}
              onChange={(e) => setAlunoFields({ ...alunoFields, anoCursando: Number(e.target.value) })}
              className="border p-2 mb-2 w-full text-black"
            />
            <button onClick={handleUpdateAluno} className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-900">
              Atualizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
