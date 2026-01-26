'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

export default function UnsubscribePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const phone = params.phone as string;
  const companyId = searchParams.get('c') || '1'; // Default company ID
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (phone) {
      handleUnsubscribe();
    }
  }, [phone]);

  const handleUnsubscribe = async () => {
    try {
      const cleanPhone = decodeURIComponent(phone).replace(/\D/g, '');
      
      // Get current unsubscribed list from localStorage
      const storageKey = `unsubscribed_${companyId}`;
      const storedUnsubscribed = localStorage.getItem(storageKey);
      let unsubscribedList: string[] = storedUnsubscribed ? JSON.parse(storedUnsubscribed) : [];
      
      // Check if already unsubscribed
      if (unsubscribedList.includes(cleanPhone)) {
        setStatus('already');
        setMessage('Você já está descadastrado da nossa lista de envios.');
        return;
      }
      
      // Add to unsubscribed list
      unsubscribedList.push(cleanPhone);
      localStorage.setItem(storageKey, JSON.stringify(unsubscribedList));
      
      // Also save to a global unsubscribed list (for all companies)
      const globalKey = 'unsubscribed_global';
      const globalStored = localStorage.getItem(globalKey);
      let globalList: string[] = globalStored ? JSON.parse(globalStored) : [];
      if (!globalList.includes(cleanPhone)) {
        globalList.push(cleanPhone);
        localStorage.setItem(globalKey, JSON.stringify(globalList));
      }
      
      setStatus('success');
      setMessage('Você foi descadastrado com sucesso! Não receberá mais mensagens promocionais.');
    } catch (error) {
      setStatus('error');
      setMessage('Ocorreu um erro ao processar sua solicitação. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-800">Processando...</h1>
            <p className="text-gray-600 mt-2">Aguarde enquanto processamos sua solicitação.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800">Descadastro Realizado!</h1>
            <p className="text-gray-600 mt-2">{message}</p>
          </>
        )}
        
        {status === 'already' && (
          <>
            <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800">Já Descadastrado</h1>
            <p className="text-gray-600 mt-2">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800">Erro</h1>
            <p className="text-gray-600 mt-2">{message}</p>
          </>
        )}
        
        <p className="text-xs text-gray-400 mt-6">
          MultLeads AI - Sistema de Gestão de Mensagens
        </p>
      </div>
    </div>
  );
}
