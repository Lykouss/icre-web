"use client";

import { ChurchEvent } from "../types";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MapPinIcon, ClockIcon, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface EventCardProps {
  event: ChurchEvent;
  onClick: (event: ChurchEvent) => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const isExpired = event.expires_at ? isPast(new Date(event.expires_at)) : false;
  
  // Design limpo para as etiquetas (Pills)
  const getStatusStyle = () => {
    if (event.status === 'rascunho') return "bg-slate-100 text-slate-600 border-slate-200";
    if (event.status === 'cancelado') return "bg-red-50 text-red-600 border-red-100";
    if (event.status === 'encerrado' || isExpired) return "bg-slate-50 text-slate-400 border-slate-200";
    
    // Publicado / Agendado
    if (event.status === 'publicado' && event.publish_at && !isPast(new Date(event.publish_at))) {
      return "bg-amber-50 text-amber-600 border-amber-200"; // Agendado
    }
    
    return "bg-emerald-50 text-emerald-600 border-emerald-200"; // Publicado
  };

  const getStatusLabel = () => {
    if (event.status === 'rascunho') return "Rascunho";
    if (event.status === 'cancelado') return "Cancelado";
    if (event.status === 'encerrado' || isExpired) return "Encerrado";
    if (event.status === 'publicado' && event.publish_at && !isPast(new Date(event.publish_at))) return "Agendado";
    return "Publicado";
  };

  return (
    <div 
      onClick={() => onClick(event)}
      className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
    >
      {/* Área da Imagem */}
      <div className="relative h-48 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-300 transition-colors group-hover:text-blue-300">
            <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sem Banner</span>
          </div>
        )}
        
        {/* Badges Flutuantes */}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm backdrop-blur-sm ${getStatusStyle()}`}>
            {getStatusLabel()}
          </span>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-5 flex flex-col flex-1">
        
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600">
            {event.type === 'culto' ? 'Culto' : 'Especial'}
          </span>
          {event.ticket_price && event.ticket_price > 0 ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
              R$ {event.ticket_price.toFixed(2)}
            </span>
          ) : (
             <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
               Gratuito
             </span>
          )}
        </div>

        <h3 className="font-bold text-lg text-slate-900 leading-tight line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h3>

        <div className="mt-auto space-y-2.5">
          {event.date && (
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium">{format(new Date(event.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
            </div>
          )}
          {event.time && (
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <ClockIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium">{event.time.substring(0, 5)}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <MapPinIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{event.location}</span>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}