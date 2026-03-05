import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/features/core/api/get-current-user';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O servidor descobre quem está acessando o site antes de renderizar
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* MENU SUPERIOR (NAVBAR) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo da Igreja */}
          <Link href="/" className="flex items-center gap-2">
            {/* O Next.js vai procurar essa imagem na pasta /public/logo.png */}
            <div className="relative w-10 h-10 overflow-hidden">
              <Image 
                src="/logo.svg" 
                alt="Logo ICRE" 
                fill
                className="object-contain"
                // Se ainda não tiver a logo, comente a linha acima e descomente a abaixo para testar:
                // unoptimized={true} 
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">
              ICRE
            </span>
          </Link>

          {/* Área de Botões (Lógica Inteligente) */}
          <nav className="flex items-center gap-4">
            {/* Se o usuário for Administrador, mostra o atalho para o sistema */}
            {user?.isAdmin && (
              <Link 
                href="/dashboard" 
                className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Ir para o Sistema
              </Link>
            )}

            {/* Se não estiver logado de forma alguma, mostra a opção de login */}
            {!user && (
              <Link 
                href="/login" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Entrar
              </Link>
            )}

            {/* Se for apenas um membro logado, podemos colocar um botão de "Meu Perfil" no futuro */}
            {user && !user.isAdmin && (
               <span className="text-sm font-medium text-slate-600">
                 Olá, {user.fullName.split(' ')[0]}
               </span>
            )}
          </nav>
        </div>
      </header>

      {/* CONTEÚDO DA PÁGINA (A Home entra aqui) */}
      <main className="flex-grow">
        {children}
      </main>

      {/* RODAPÉ BÁSICO */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Igreja de Cristo Rocha Eterna. Todos os direitos reservados.
        </div>
      </footer>

    </div>
  );
}