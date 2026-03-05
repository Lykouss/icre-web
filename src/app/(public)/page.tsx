import React from 'react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4 sm:px-6 lg:px-8">
      
      {/* Badge de "Em Desenvolvimento" */}
      <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-sm font-medium shadow-sm">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        Site em Desenvolvimento
      </div>

      {/* Título Principal */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
        Igreja de Cristo <br className="hidden sm:block" />
        <span className="text-blue-600">Rocha Eterna</span>
      </h1>

      {/* Subtítulo */}
      <p className="mt-4 max-w-2xl text-lg sm:text-xl text-slate-600 mb-10">
        Bem-vindo ao nosso novo portal digital. Estamos construindo um espaço para conectar nossa comunidade, facilitar doações e organizar nossos eventos.
      </p>

    </div>
  );
}