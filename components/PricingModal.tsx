import React, { useState } from 'react';
import { Spinner } from './Spinner';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess: (credits: number) => void;
}

interface Plan {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Básico',
    credits: 10,
    price: 19.90,
  },
  {
    id: 'pro',
    name: 'Profissional',
    credits: 50,
    price: 49.90,
    popular: true,
  },
  {
    id: 'business',
    name: 'Empresarial',
    credits: 200,
    price: 149.90,
  },
];

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuy = async (plan: Plan) => {
    setIsProcessing(plan.id);
    
    // SIMULAÇÃO DE INTEGRAÇÃO COM MERCADO PAGO
    // Em um app real, você faria:
    // 1. Call para seu backend -> Backend cria Preference no Mercado Pago -> Retorna preferenceId
    // 2. Inicializa o checkout brick ou redireciona.
    
    // Simulando delay de rede e processamento
    setTimeout(() => {
        setIsProcessing(null);
        onPurchaseSuccess(plan.credits);
        alert(`Pagamento confirmado! ${plan.credits} créditos adicionados.`);
        onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative animate-fade-in">
        
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div className="w-full md:w-1/3 bg-pink-600 p-8 text-white flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Recarregue seus Créditos</h2>
            <p className="mb-6 opacity-90">Gere imagens de alta qualidade para sua loja. Escolha o pacote ideal para o seu volume de vendas.</p>
            <div className="space-y-4 text-sm opacity-90">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Alta resolução</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Uso comercial liberado</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Suporte prioritário</span>
                </div>
            </div>
            <div className="mt-auto pt-8 text-xs opacity-75">
                Pagamento seguro via Mercado Pago
            </div>
        </div>

        <div className="w-full md:w-2/3 p-8 bg-gray-50 overflow-y-auto max-h-[80vh]">
            <div className="grid gap-4">
                {plans.map((plan) => (
                    <div 
                        key={plan.id}
                        className={`relative border-2 rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-md ${plan.popular ? 'border-pink-500 bg-white' : 'border-gray-200 bg-white hover:border-pink-300'}`}
                    >
                        {plan.popular && (
                            <span className="absolute -top-3 left-4 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                Mais Popular
                            </span>
                        )}
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{plan.name}</h3>
                            <p className="text-gray-500 font-medium">{plan.credits} Gerações</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                            <button 
                                onClick={() => handleBuy(plan)}
                                disabled={!!isProcessing}
                                className="mt-2 bg-blue-500 text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center min-w-[100px]"
                            >
                                {isProcessing === plan.id ? <Spinner className="h-4 w-4 text-white" /> : 'Comprar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-gray-400 text-xs mt-6">
                Este é um ambiente de demonstração. O pagamento é simulado.
            </p>
        </div>
      </div>
    </div>
  );
};