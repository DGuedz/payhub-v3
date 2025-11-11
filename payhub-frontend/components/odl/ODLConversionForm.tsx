'use client';

import React, { useState } from 'react';

interface ODLConversionFormProps {
  merchantId: string;
  onConversionSuccess?: (transactionData: any) => void;
}

interface ConversionFormData {
  amount: string;
  currency: 'BRL' | 'USD' | 'RLUSD';
  paymentMethod: 'pix' | 'card';
  settlementType: 'instant' | 'escrow';
}

export const ODLConversionForm: React.FC<ODLConversionFormProps> = ({
  merchantId,
  onConversionSuccess
}) => {
  const [formData, setFormData] = useState<ConversionFormData>({
    amount: '',
    currency: 'BRL',
    paymentMethod: 'pix',
    settlementType: 'instant'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Integração com API de conversão ODL
      const response = await fetch('/api/odl/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          ...formData,
          merchantId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Falha na conversão ODL');
      }

      const result = await response.json();
      
      if (onConversionSuccess) {
        onConversionSuccess(result);
      }

      // Reset do formulário após sucesso
      setFormData({
        amount: '',
        currency: 'BRL',
        paymentMethod: 'pix',
        settlementType: 'instant'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="odl-conversion-form bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Conversão ODL - Liquidação D+0
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor a Converter
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Moeda
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BRL">BRL (Real)</option>
            <option value="USD">USD (Dólar)</option>
            <option value="RLUSD">RLUSD (Stablecoin)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de Pagamento
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pix">PIX</option>
            <option value="card">Cartão</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Liquidação
          </label>
          <select
            name="settlementType"
            value={formData.settlementType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="instant">Instantâneo (D+0)</option>
            <option value="escrow">Escrow Inteligente</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processando...' : 'Converter para RLUSD'}
        </button>
      </form>

      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-gray-800 mb-2">Benefícios ODL:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Liquidação instantânea D+0</li>
          <li>• Conversão automática para RLUSD</li>
          <li>• Yield sobre saldos excedentes</li>
          <li>• Segurança Metaco HSM/MPC</li>
        </ul>
      </div>
    </div>
  );
};