"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/auseAuth';
import { useRouter } from 'next/navigation';
import { firestore } from '../../lib/firebaseConfig'; 
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import LogOut from '../../components/logout';
import { UserIcon, XCircleIcon, PencilIcon } from '@heroicons/react/24/solid';

interface Aluno {
  id: string;
  nome: string;
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

      alunosData.sort((a, b) => a.nome.localeCompare(b.nome));

      setAlunos(alunosData);
      const frequenciasData = await fetchFrequencias(turmaId);
      setFrequencias(frequenciasData);

      const updatedAlunos = alunosData.map(aluno => {
        const alunoFrequencias = frequenciasData.reduce((acc, frequencia) => {
          const chaveAluno = `${aluno.nome}`;
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
      const presencas = data.alunos.reduce((acc: { [key: string]: boolean }, aluno: { nome: string; presenca: string }) => {
        const chaveAluno = `${aluno.nome}`;
        acc[chaveAluno] = aluno.presenca === 'V';
        return acc;
      }, {});
      return {
        id: doc.id,
        data: data.data,
        presencas,
      } as Frequencia;
    });

    // Ordenar frequências pela data
    frequenciasData.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

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
        const updatedAlunos = { ...frequencia.presencas };

        // Atualiza apenas a presença do aluno que está sendo editado
        updatedAlunos[alunoEditando.nome] = alunoPresenca === 'V';

        // Atualiza a frequência no Firestore
        await updateDoc(frequenciaRef, { 
          alunos: Object.entries(updatedAlunos).map(([nomeCompleto, presenca]) => ({
            nome: nomeCompleto,
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
          acc[frequencia.data] = frequencia.presencas[aluno.nome] || false;
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
    <div className="min-h-screen bg-gray-100 mb-8 md:pb-0 md:mb-0">
      <LogOut />
      <hr />
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 mt-2">
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
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className='border-2 border-y-black'>
              <tr className="bg-gray-200 text-sm md:text-2lg">
                <th className="px-2 md:px-4 py-2 text-left text-center text-black">Nome Completo</th>
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
                      {frequencias.map(f => (
                        <td key={f.data} className="px-2 md:px-4 py-2 text-center text-black">
                          <div className="flex justify-center items-end h-full">
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
                          className="bg-purple-500 text-white rounded hover:bg-purple-700 p-1"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <br />
        <br />
        <br />
      </div>
      {/* Modal para edição pode ser adicionado aqui */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white p-4 rounded shadow-lg">
              <h3 className="text-lg font-bold">Editar Frequência de {alunoEditando?.nome}</h3>
              <div className="mt-4">
                {frequencias.map(f => (
                  <div key={f.data} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={edicoes[f.data] || false}
                      onChange={() => setEdicoes(prev => ({ ...prev, [f.data]: !prev[f.data] }))}
                      className="mr-2"
                    />
                    <label>{f.data}</label>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={handleUpdate} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Salvar</button>
                <button onClick={() => setIsModalOpen(false)} className="bg-gray-300 text-black px-4 py-2 rounded">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {notification && (
        <div className={`absolute top-0 right-0 m-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <p className="text-white">{notification.message}</p>
        </div>
      )}
    </div>
  );
}
