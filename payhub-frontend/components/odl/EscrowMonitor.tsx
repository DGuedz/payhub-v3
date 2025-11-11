'use client';

import React, { useState, useEffect } from 'react';

interface EscrowTransaction {
  id: string;
  owner: string;
  offerSequence: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  xrplTxHash?: string;
}

interface EscrowMonitorProps {
  merchantId: string;
  refreshInterval?: number;
}

export const EscrowMonitor: React.FC<EscrowMonitorProps> = ({
  merchantId,
  refreshInterval = 30000 // 30 segundos
}) => {
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrows = async () => {
    try {
      const response = await fetch(`/api/escrow/list?merchantId=${merchantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar escrows');
      }

      const data = await response.json();
      setEscrows(data.escrows || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishEscrow = async (owner: string, offerSequence: string) => {
    try {
      const response = await fetch('/api/escrow/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ owner, offerSequence, merchantId })
      });

      if (!response.ok) {
        throw new Error('Falha ao finalizar escrow');
      }

      // Recarregar lista após sucesso
      await fetchEscrows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  useEffect(() => {
    fetchEscrows();

    // Configurar polling automático
    const interval = setInterval(fetchEscrows, refreshInterval);
    return () => clearInterval(interval);
  }, [merchantId, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="escrow-monitor bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="escrow-monitor bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Monitor de Escrow Inteligente
        </h2>
        <button
          onClick={fetchEscrows}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {escrows.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum escrow ativo encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {escrows.map((escrow) => (
            <div key={escrow.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Escrow #{escrow.offerSequence}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {escrow.amount} {escrow.currency}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                  {escrow.status === 'pending' ? 'Pendente' : 
                   escrow.status === 'completed' ? 'Concluído' : 'Cancelado'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Criado:</span>
                  <p>{formatDate(escrow.createdAt)}</p>
                </div>
                {escrow.completedAt && (
                  <div>
                    <span className="font-medium text-gray-700">Concluído:</span>
                    <p>{formatDate(escrow.completedAt)}</p>
                  </div>
                )}
                {escrow.xrplTxHash && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Hash XRPL:</span>
                    <p className="truncate text-blue-600">{escrow.xrplTxHash}</p>
                  </div>
                )}
              </div>

              {escrow.status === 'pending' && (
                <div className="mt-4">
                  <button
                    onClick={() => handleFinishEscrow(escrow.owner, escrow.offerSequence)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Finalizar Escrow
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold text-blue-800 mb-2">Sobre Escrow Inteligente:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Garantia de liquidação D+0 na XRPL</li>
          <li>• Custódia segura com Metaco HSM/MPC</li>
          <li>• Compliance Trust Charter Standard</li>
          <li>• Integração com Prime Broker Hidden Road</li>
        </ul>
      </div>
    </div>
  );
};