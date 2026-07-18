'use client'

import React from 'react';
import type { FormField, CustomFormResponses } from '@/features/events/types';

interface DynamicFormRendererProps {
  fields: FormField[];
  responses: CustomFormResponses;
  onChange: (fieldId: string, value: string | string[]) => void;
  inputCls?: string;
}

export function DynamicFormRenderer({ fields, responses, onChange, inputCls }: DynamicFormRendererProps) {
  const cls = inputCls || 'w-full px-4 py-3 bg-slate-800/60 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5';

  if (!fields || fields.length === 0) return null;

  return (
    <>
      {fields.map(field => {
        const value = responses[field.id];
        const stringValue = Array.isArray(value) ? '' : (value ?? '');
        const arrayValue: string[] = Array.isArray(value) ? value : [];

        return (
          <div key={field.id}>
            <label className={labelCls}>
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>

            {field.type === 'short_text' && (
              <input
                type="text"
                className={cls}
                value={stringValue}
                onChange={e => onChange(field.id, e.target.value)}
                required={field.required}
                placeholder={field.label}
              />
            )}

            {field.type === 'long_text' && (
              <textarea
                className={`${cls} min-h-[100px] resize-y`}
                value={stringValue}
                onChange={e => onChange(field.id, e.target.value)}
                required={field.required}
                placeholder={field.label}
              />
            )}

            {field.type === 'dropdown' && (
              <select
                className={cls}
                value={stringValue}
                onChange={e => onChange(field.id, e.target.value)}
                required={field.required}
              >
                <option value="">Selecione...</option>
                {(field.options || []).map((opt, idx) => (
                  <option key={`${idx}-${opt}`} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'multiple_choice' && (
              <div className="space-y-2">
                {(field.options || []).map((opt, idx) => {
                  const uniqueId = `${field.id}-${idx}`;
                  return (
                    <label key={uniqueId} htmlFor={uniqueId} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        id={uniqueId}
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={stringValue === opt}
                        onChange={() => onChange(field.id, opt)}
                        required={field.required}
                        className="w-4 h-4 text-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:hover:text-white transition-colors">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {field.type === 'checkboxes' && (
              <div className="space-y-2">
                {(field.options || []).map((opt, idx) => {
                  const uniqueId = `${field.id}-${idx}`;
                  return (
                    <label key={uniqueId} htmlFor={uniqueId} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        id={uniqueId}
                        type="checkbox"
                        value={opt}
                        checked={arrayValue.includes(opt)}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...arrayValue, opt]
                            : arrayValue.filter(v => v !== opt);
                          onChange(field.id, next);
                        }}
                        className="w-4 h-4 text-blue-500 rounded border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:hover:text-white transition-colors">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
