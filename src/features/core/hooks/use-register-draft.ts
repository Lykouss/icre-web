'use client'

import { useState } from 'react';

const STORAGE_KEY = 'icre_register_draft';

interface RegisterDraft {
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  currentStep?: number;
}

function readDraft(): RegisterDraft {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as RegisterDraft) : {};
  } catch {
    return {};
  }
}

function writeDraft(data: RegisterDraft): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage indisponível
  }
}

function removeDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage indisponível
  }
}

export function useRegisterDraft() {
  // useState com initializer function — lê sessionStorage apenas uma vez, sem useEffect
  const [draft, setDraftState] = useState<RegisterDraft>(() => readDraft());

  const setDraft = (updates: Partial<RegisterDraft>) => {
    setDraftState(prev => {
      const next = { ...prev, ...updates };
      writeDraft(next);
      return next;
    });
  };

  const clearDraft = () => {
    removeDraft();
    setDraftState({});
  };

  return { draft, setDraft, clearDraft };
}