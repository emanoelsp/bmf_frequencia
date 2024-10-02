"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import { firestore } from '../../lib/firebaseConfig'; 
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import LogOut from '../../components/logout';
import { UserIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  anoCursando: number;
  frequencias: { [key: string]: boolean }; 
}

interface Turma {
  id: string;
  nomeEscola: string;
  anoTurma: string;
  codigoTurma: string;
}

interface Frequencia {
  id: string; 
  data: string;
  presencas: { [key: string]: boolean }; 
}

export default function Relatorios() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  const [frequencias, setFrequencias] = useState<Frequencia[]>([]);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);
  const [edicoes, setEdicoes] = useState<{ [key: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (loading) return; 
    if (!user) {
      router.push('/login'); 
    } else {
      fetchTurmas();
    }
  }, [loading, user, router]);

  const fetchTurmas = async () => {
    const turmaCollectionRef = collection(firestore, 'turmas');
    const turmaDocs = await getDocs(turmaCollectionRef);
    const turmasData = turmaDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Turma[];
    setTurmas(turmasData);
  };

  const handleTurmaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const turmaId = e.target.value;
    setTurmaSelecionada(turmaId);
    setAlunos([]);
    setFrequencias([]);
    setEdicoes({});

    if (turmaId) {
      const alunosQuery = query(collection(firestore, 'alunos'), where('turmaId', '==', turmaId));
      const alunosSnapshot = await getDocs(alunosQuery);
      const alunosData = alunosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        frequencias: {},
      })) as Aluno[];

      setAlunos(alunosData);
      const frequenciasData = await fetchFrequencias(turmaId);
      setFrequencias(frequenciasData);
      
      const updatedAlunos = alunosData.map(aluno => {
        const alunoFrequencias = frequenciasData.reduce((acc, frequencia) => {
          const chaveAluno = `${aluno.nome} ${aluno.sobrenome}`;
          acc[frequencia.data] = frequencia.presencas[chaveAluno] || false;
          return acc;
        }, {} as { [key: string]: boolean });

        return { ...aluno, frequencias: alunoFrequencias };
      });

      setAlunos(updatedAlunos);
    }
  };

  const fetchFrequencias = async (turmaId: string) => {
    const frequenciaCollectionRef = collection(firestore, 'frequencia_diaria');
    const frequenciaQuery = query(frequenciaCollectionRef, where('turmaId', '==', turmaId));
    const frequenciaDocs = await getDocs(frequenciaQuery);
    
    const frequenciasData = frequenciaDocs.docs.map(doc => {
      const data = doc.data();
      const presencas = data.alunos.reduce((acc: { [key: string]: boolean }, aluno: { nome: string; sobrenome: string; presenca: string }) => {
        const chaveAluno = `${aluno.nome} ${aluno.sobrenome}`;
        acc[chaveAluno] = aluno.presenca === 'V';
        return acc;
      }, {});
      return {
        id: doc.id,
        data: data.data,
        presencas,
      } as Frequencia;
    });

    return frequenciasData;
  };

  const handleEdit = (aluno: Aluno) => {
    setAlunoEditando(aluno);
    setEdicoes(aluno.frequencias);
    setIsModalOpen(true);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); 
  };

  const handleUpdate = async () => {
    if (!alunoEditando) return;

    try {
      for (const frequencia of frequencias) {
        const frequenciaRef = doc(firestore, 'frequencia_diaria', frequencia.id);
        const alunoPresenca = edicoes[frequencia.data] ? 'V' : 'F';
        const updatedAlunos = frequencia.presencas;
        updatedAlunos[`${alunoEditando.nome} ${alunoEditando.sobrenome}`] = alunoPresenca === 'V';

        await updateDoc(frequenciaRef, { 
          alunos: Object.entries(updatedAlunos).map(([nomeCompleto, presenca]) => ({
            nome: nomeCompleto.split(' ')[0],
            sobrenome: nomeCompleto.split(' ').slice(1).join(' '),
            presenca: presenca ? 'V' : 'F',
          }))
        });
      }

      setAlunoEditando(null);
      setEdicoes({});
      setIsModalOpen(false);

      const frequenciasData = await fetchFrequencias(turmaSelecionada);
      setFrequencias(frequenciasData);

      const updatedAlunos = alunos.map(aluno => {
        const alunoFrequencias = frequenciasData.reduce((acc, frequencia) => {
          const chaveAluno = `${aluno.nome} ${aluno.sobrenome}`;
          acc[frequencia.data] = frequencia.presencas[chaveAluno] || false;
          return acc;
        }, {} as { [key: string]: boolean });

        return { ...aluno, frequencias: alunoFrequencias };
      });
      setAlunos(updatedAlunos);

      showNotification('Frequência atualizada com sucesso!', 'success');
    } catch (error) {
      console.error("Erro ao atualizar frequências:", error);
      showNotification('Erro ao atualizar frequência.', 'error');
    }
  };

  if (loading) return <p>Loading...</p>; 

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-2">
      <LogOut />
      <hr />
      <h1 className="text-lg md:text-2xl font-bold text-center text-black mb-4 md:mb-8">
        Relatório de Frequência
      </h1>
      <div className="bg-white border-8 p-4 md:p-6 rounded-lg shadow-lg max-w-4xl mx-auto mb-4 md:mb-8">
        <h2 className="text-lg md:text-2xl font-semibold text-gray-700 mb-4">Selecionar Turma</h2>
        <hr className='border-4'></hr>
        <form>
          <div className="mb-4">
            <label htmlFor="turma" className="block text-black mb-2">Turma:</label>
            <select
              id="turma"
              value={turmaSelecionada}
              onChange={handleTurmaChange}
              className="w-full p-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Escolha a turma</option>
              {turmas.map(turma => (
                <option key={turma.id} value={turma.id}>
                  {turma.nomeEscola} - {turma.anoTurma} - {turma.codigoTurma}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg mx-auto border-8 overflow-x-auto">
        <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">Relatório de Frequência</h2>
        <hr className='border-4 mb-3'></hr>
        <table className="min-w-full table-auto">
          <thead className='border-2 border-y-black'>
            <tr className="bg-gray-200 text-sm md:text-2lg">
              <th className="px-2 md:px-4 py-2 text-left text-center text-black">Nome</th>
              <th className="px-2 md:px-4 py-2 text-left text-center text-black">Sobrenome</th>
              {frequencias.map(f => (
                <th key={f.data} className="text-1sm md:text-sm px-2 md:px-4 py-2 text-center text-black">{f.data}</th>
              ))}
              <th className="px-2 md:px-4 py-2 text-center text-black">Percentual de Presença</th>
              <th className="px-2 md:px-4 py-2 text-center text-black">Ação</th>
            </tr>
          </thead>
          <tbody>
            {alunos.length === 0 ? (
              <tr>
                <td colSpan={frequencias.length + 3} className="text-center text-black">Nenhum aluno encontrado.</td>
              </tr>
            ) : (
              alunos.map((aluno: Aluno) => {
                const totalAulas = frequencias.length;
                const aulasPresentes = frequencias.filter(f => aluno.frequencias[f.data]).length;
                const percentualPresenca = totalAulas > 0 ? (aulasPresentes / totalAulas) * 100 : 0;

                return (
                  <tr key={aluno.id} className="border-t text-sm md:text-2lg">
                  <td className="px-2 md:px-4 py-2 text-black text-center">{aluno.nome}</td>
                  <td className="px-2 md:px-4 py-2 text-black text-center">{aluno.sobrenome}</td>
                  {frequencias.map(f => (
                    <td key={f.data} className="px-2 md:px-4 py-2 text-center text-black">
                      <div className="flex justify-center items-end h-full"> {/* Alinha os ícones no centro da célula */}
                        {aluno.frequencias[f.data] ? (
                          <UserIcon className="text-green-500 w-5 h-5" />
                        ) : (
                          <XCircleIcon className="text-red-500 w-5 h-5" />
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="px-2 md:px-4 py-2 text-center text-black">{percentualPresenca.toFixed(2)}%</td>
                  <td className="px-2 md:px-4 py-2 text-center text-black">
                    <button
                      onClick={() => handleEdit(aluno)}
                      className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-700"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
                
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal para edição de frequência */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Editar Frequência de {alunoEditando?.nome}</h2>
            <hr className='border-2' />
            {frequencias.map(f => (
              <div key={f.data} className="flex items-center mb-2 text-black">
                <input
                  type="checkbox"
                  checked={edicoes[f.data] || false}
                  onChange={() => setEdicoes(prev => ({ ...prev, [f.data]: !prev[f.data] }))}
                  className="mr-2"
                />
                <label>{f.data}</label>
              </div>
            ))}
            <button
              onClick={handleUpdate}
              className="bg-purple-500 hover:bg-purple-700 text-white px-4 py-2 rounded mt-2"
            >
              Atualizar Frequência
            </button>
            <button
              onClick={() => { setIsModalOpen(false); setAlunoEditando(null); setEdicoes({}); }}
              className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded ml-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
