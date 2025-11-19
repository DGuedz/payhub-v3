'use client';

import React, { useState, useEffect } from 'react';
import { ODLConversionForm } from './ODLConversionForm';
import { EscrowMonitor } from './EscrowMonitor';
import { XRPLTestPanel } from './XRPLTestPanel';

interface MerchantInfo {
  id: string;
  name: string;
  balanceRLUSD: string;
  balanceXRP: string;
  yieldRate: string;
  totalConversions: number;
  totalVolume: string;
}

interface ODLDashboardProps {
  merchantId: string;
}

export const ODLDashboard: React.FC<ODLDashboardProps> = ({ merchantId }) => {
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversion' | 'monitor' | 'analytics' | 'tests'>('conversion');

  const fetchMerchantInfo = async () => {
    try {
      const response = await fetch(`/api/merchant/info?id=${merchantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMerchantInfo(data);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do merchant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantInfo();
  }, [merchantId]);

  const handleConversionSuccess = (transactionData: any) => {
    // Atualizar informações após conversão bem-sucedida
    fetchMerchantInfo();
    // Mudar para aba de monitoramento
    setActiveTab('monitor');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header com informações do merchant */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              PAYHUB ODL Gateway
            </h1>
            <p className="text-gray-600">
              Liquidez Sob Demanda para Varejo - D+0 Settlement
            </p>
          </div>
          
          {merchantInfo && (
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-800">{merchantInfo.name}</h2>
              <div className="text-sm text-gray-600 space-y-1 mt-2">
                <p>RLUSD: {merchantInfo.balanceRLUSD}</p>
                <p>XRP: {merchantInfo.balanceXRP}</p>
                <p className="text-green-600 font-medium">Yield: {merchantInfo.yieldRate} APY</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Conversões Totais</h3>
            <p className="text-2xl font-bold text-blue-900">{merchantInfo?.totalConversions}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Volume Total</h3>
            <p className="text-2xl font-bold text-green-900">{merchantInfo?.totalVolume} RLUSD</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Liquidação D+0</h3>
            <p className="text-2xl font-bold text-purple-900">100%</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('conversion')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conversion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Conversão ODL
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'monitor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Monitor Escrow
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Testes XRPL
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'conversion' && (
          <>
            <ODLConversionForm 
              merchantId={merchantId}
              onConversionSuccess={handleConversionSuccess}
            />
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Infraestrutura Institucional
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">Custódia: Metaco HSM/MPC</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-sm font-medium">Compliance: Trust Charter Standard</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-sm font-medium">Liquidez: Hidden Road Prime Broker</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span className="text-sm font-medium">Yield: XRPL EVM Sidechain</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'monitor' && (
          <EscrowMonitor merchantId={merchantId} />
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Analytics & Performance
            </h3>
            <div className="text-center py-12 text-gray-500">
              <p>Dashboard analítico em desenvolvimento</p>
              <p className="text-sm mt-2">Integração com GTreasury e métricas de yield</p>
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <XRPLTestPanel />
        )}
      </div>

      {/* Footer com informações de segurança */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>🔒 Segurança Nível Bancário</span>
            <span>⚡ Liquidação D+0</span>
            <span>📈 Yield 5-8% APY</span>
          </div>
          <span>v3.0.0 | XRPL Vega House Hackathon</span>
        </div>
      </div>
    </div>
  );
};
