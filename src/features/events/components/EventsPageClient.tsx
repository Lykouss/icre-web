"use client";

import { useState } from "react";
import { ChurchEvent } from "../types";
import { PlusIcon, SearchIcon, FilterIcon, CalendarDaysIcon } from "lucide-react";
import { EventForm } from "./EventForm";
import { EventCard } from "./EventCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface EventsPageClientProps {
  initialEvents: ChurchEvent[];
}

export function EventsPageClient({ initialEvents }: EventsPageClientProps) {
  const [events, setEvents] = useState<ChurchEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);

  const filteredEvents = events.filter((evt) =>
    evt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenNew = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleSaved = (savedEvent: ChurchEvent) => {
    setEvents((prev) => {
      const exists = prev.find((e) => e.id === savedEvent.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEvent.id ? savedEvent : e));
      }
      return [savedEvent, ...prev];
    });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* ── Cabeçalho da Página ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        
        <button 
          onClick={handleOpenNew} 
          className="flex items-center shrink-0 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-sm shadow-blue-600/20"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Novo Evento
        </button>
      </div>

      {/* ── Barra de Ações (Filtro e Busca) ── */}
      <div className="flex items-center gap-3 mb-6 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar evento pelo título..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 placeholder-slate-400 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shrink-0"
          title="Filtros avançados (Em breve)"
        >
          <FilterIcon className="h-4 w-4" />
        </button>
      </div>

      {/* ── Grade de Eventos ou Estado Vazio ── */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onClick={handleOpenEdit} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <CalendarDaysIcon className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-base font-semibold text-slate-700">Nenhum evento encontrado</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
            {searchQuery ? "Tente buscar com outras palavras ou limpe a pesquisa." : "Você ainda não cadastrou nenhum evento. Clique no botão acima para começar."}
          </p>
          {!searchQuery && (
            <button 
              onClick={handleOpenNew} 
              className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
            >
              Criar primeiro evento
            </button>
          )}
        </div>
      )}

      {/* ── Painel Lateral do Formulário (Sheet) ── */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-white border-l border-slate-100 p-6 sm:p-8">
          <SheetHeader className="mb-8 border-b border-slate-100 pb-4">
            <SheetTitle className="text-xl font-bold text-slate-900 tracking-tight">
              {selectedEvent ? 'Editar Evento' : 'Novo Evento'}
            </SheetTitle>
            <p className="text-sm text-slate-500 mt-1">
              Preencha os dados abaixo para configurar o seu evento.
            </p>
          </SheetHeader>
          
          {isFormOpen && (
            <EventForm
              initialData={selectedEvent}
              onSaved={handleSaved}
              onCancel={() => setIsFormOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}