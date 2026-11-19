import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';

export function SubscriptionModal() {
  const { user, updateUserPlan } = useAuth();
  const { showSubscriptionModal, setShowSubscriptionModal } = usePlayer();

  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (showSubscriptionModal) {
      api.getSubscriptionPlans().then(setPlans).catch(() => {});
    }
  }, [showSubscriptionModal]);

  if (!showSubscriptionModal) return null;

  const handleSelectPlan = async (planId) => {
    setLoadingPlan(planId);
    try {
      const res = await api.updateSubscription(planId);
      updateUserPlan(planId);
      setSuccessMsg(res.message);
      setTimeout(() => {
        setSuccessMsg('');
        setShowSubscriptionModal(false);
      }, 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0" onClick={() => setShowSubscriptionModal(false)} />

      <div className="relative z-10 w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 text-white">
        <button
          onClick={() => setShowSubscriptionModal(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Offres CineStream VOD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Choisissez l'expérience qui vous correspond
          </h2>
          <p className="text-sm text-zinc-400">
            Changez ou résiliez votre formule à tout moment en un clic.
          </p>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-center font-bold text-sm animate-scale-up">
            {successMsg}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = user?.plan === p.id;
            const isPremium = p.id === 'premium';

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  isPremium
                    ? 'bg-gradient-to-b from-zinc-850 to-zinc-900 border-2 border-red-500/80 shadow-2xl shadow-red-600/20'
                    : 'bg-zinc-950/70 border border-zinc-800'
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow">
                    Le Plus Populaire
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <div className="text-2xl font-black text-white mt-1">{p.price}</div>
                    <div className="text-xs text-red-400 font-bold mt-0.5">{p.maxQuality}</div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                    {p.features?.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-center text-xs font-bold uppercase tracking-wider">
                      Formule Actuelle
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(p.id)}
                      disabled={loadingPlan === p.id}
                      className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                        isPremium
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {loadingPlan === p.id ? 'Mise à niveau...' : 'Choisir cette offre'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
