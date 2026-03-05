'use client'

import React, { useState, useTransition } from 'react';
import { createMember } from '@/features/members/actions/create-member';

interface Cell {
  id: string;
  name: string;
}

interface NewMemberModalProps {
  cells: Cell[];
}

export function NewMemberModal({ cells }: NewMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Estado para controlar o que a pessoa digita no telefone
  const [phoneValue, setPhoneValue] = useState('');

  // A Mágica da Máscara de Telefone: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove tudo que não for número
    value = value.replace(/\D/g, '');
    
    // Aplica a formatação à medida que a pessoa digita
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    
    // Limita o tamanho máximo para 15 caracteres (o tamanho final da máscara: (99) 99999-9999)
    if (value.length > 15) {
      value = value.substring(0, 15);
    }
    
    setPhoneValue(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Se o telefone estiver preenchido, mas não estiver completo (menos de 14 caracteres: (XX) XXXX-XXXX)
    if (phoneValue && phoneValue.length < 14) {
      alert('Por favor, digite um número de WhatsApp válido com DDD.');
      return;
    }
    
    startTransition(async () => {
      const result = await createMember(formData);
      if (result.error) {
        alert(result.error);
      } else {
        setIsOpen(false);
        setPhoneValue(''); // Limpa o telefone para o próximo cadastro
      }
    });
  };

  return (
    <>
      {/* Botão que abre o Modal */}
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Novo Registro
      </button>

      {/* O Modal Escuro em cima da tela */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Adicionar Pessoa</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input type="text" name="fullName" required placeholder="Ex: João da Silva" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contato (WhatsApp)</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  placeholder="(61) 99999-9999" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select name="status" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Visitante">Visitante</option>
                    <option value="Congregante">Congregante</option>
                    <option value="Membro">Membro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Célula</label>
                  <select name="cellId" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Nenhuma</option>
                    {cells.map(cell => (
                      <option key={cell.id} value={cell.id}>{cell.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-2 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center">
                  {isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}