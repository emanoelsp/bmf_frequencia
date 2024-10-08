import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Seção Inicial */}
  

      <section
        className="h-screen flex flex-col justify-center items-center"
      >
        

        <h1 className="text-4xl font-bold mb-7 text-white text-center">Controle de frequência</h1>
        <Link href="/login">
          <p className="border-2 border-blue-900 text-2xl p-6 text-white cursor-pointer">
            Acessar
          </p>
        </Link>
      </section>
    </div>
  );
}
