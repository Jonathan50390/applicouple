'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserReward, CompletedChallenge, Profile } from '@/lib/types';
import Navigation from '@/components/Navigation';
import PointsDisplay from '@/components/PointsDisplay';
import RewardBadge from '@/components/RewardBadge';

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [partnerCodeCopied, setPartnerCodeCopied] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [associating, setAssociating] = useState(false);
  const [partner, setPartner] = useState<Profile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadUserData();
    }
  }, [user, authLoading]);

  const loadUserData = async () => {
    const { data: rewardsData } = await supabase
      .from('user_rewards')
      .select('*, reward:rewards(*)')
      .eq('user_id', user!.id);

    const { count } = await supabase
      .from('completed_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id);

    if (profile?.partner_id) {
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.partner_id)
        .single();

      if (partnerData) setPartner(partnerData);
    }

    if (rewardsData) setRewards(rewardsData);
    if (count) setCompletedCount(count);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPartnerCode = () => {
    if (profile?.partner_code) {
      navigator.clipboard.writeText(profile.partner_code);
      setPartnerCodeCopied(true);
      setTimeout(() => setPartnerCodeCopied(false), 2000);
    }
  };

  const handleAssociatePartner = async () => {
    if (!partnerCode.trim()) {
      alert('Veuillez entrer un code partenaire');
      return;
    }

    setAssociating(true);

    const { data, error } = await supabase.rpc('associate_partner', {
      partner_code_input: partnerCode.toUpperCase()
    });

    if (error) {
      alert('Erreur lors de l\'association: ' + error.message);
      setAssociating(false);
      return;
    }

    if (data && data.success) {
      setPartnerCode('');
      setPartner(data.partner);
      await refreshProfile();
      alert('❤️ Association réussie ! Votre partenaire a également été associé.');
    } else {
      alert(data?.error || 'Erreur lors de l\'association');
    }

    setAssociating(false);
  };

  const handleDisassociatePartner = async () => {
    if (!confirm('Voulez-vous vraiment dissocier votre partenaire ?')) {
      return;
    }

    if (partner) {
      await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', partner.id);
    }

    const { error } = await supabase
      .from('profiles')
      .update({ partner_id: null })
      .eq('id', user!.id);

    if (!error) {
      setPartner(null);
      await refreshProfile();
      alert('Partenaire dissocié');
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="text-2xl font-bold text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mon Profil</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold"
          >
            Déconnexion
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-4xl">
              👤
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{profile.username}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>

          <PointsDisplay points={profile.points} level={profile.level} className="mb-4" />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{completedCount}</p>
              <p className="text-sm text-gray-600">Défis complétés</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{rewards.length}</p>
              <p className="text-sm text-gray-600">Récompenses</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Code de parrainage
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-4 py-2 rounded font-mono text-lg font-bold text-pink-600">
                {profile.referral_code}
              </code>
              <button
                onClick={copyReferralCode}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all font-semibold"
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Partagez ce code pour gagner des points bonus !
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ❤️ Mon Partenaire
          </h2>

          {partner ? (
            <div>
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{partner.username}</p>
                    <p className="text-sm text-gray-600">Niveau {partner.level} - {partner.points} points</p>
                  </div>
                </div>
                <button
                  onClick={handleDisassociatePartner}
                  className="w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-all"
                >
                  Dissocier le partenaire
                </button>
              </div>

              <button
                onClick={() => router.push('/send-challenge')}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                📤 Envoyer un défi
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Votre code d'association :</strong>
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 bg-white px-4 py-2 rounded font-mono text-xl font-bold text-purple-600">
                    {profile.partner_code}
                  </code>
                  <button
                    onClick={copyPartnerCode}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all font-semibold"
                  >
                    {partnerCodeCopied ? '✓' : '📋'}
                  </button>
                </div>
                <p className="text-xs text-blue-700">
                  Partagez ce code avec votre partenaire pour vous associer
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Entrez le code de votre partenaire :
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXX"
                    maxLength={6}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 font-mono text-lg"
                  />
                  <button
                    onClick={handleAssociatePartner}
                    disabled={associating || !partnerCode.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {associating ? 'Envoi...' : 'Associer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              ⚙️ Préférences
            </h2>
            <button
              onClick={() => router.push('/settings')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
            >
              Configurer
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Définissez vos préférences pour recevoir des défis de votre partenaire
          </p>
        </div>

        {rewards.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Mes Récompenses
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rewards.map((userReward) => (
                <RewardBadge
                  key={userReward.id}
                  reward={userReward.reward!}
                  unlocked={true}
                  unlockedAt={userReward.unlocked_at}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
