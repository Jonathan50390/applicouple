'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';

export default function PartnerStats() {
  const { user, profile } = useAuth();
  const [partner, setPartner] = useState<Profile | null>(null);
  const [myActiveChallenges, setMyActiveChallenges] = useState(0);
  const [partnerActiveChallenges, setPartnerActiveChallenges] = useState(0);

  useEffect(() => {
    if (user && profile?.partner_id) {
      loadStats();
    }
  }, [user, profile]);

  const loadStats = async () => {
    if (!profile?.partner_id) return;

    const { data: partnerData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.partner_id)
      .single();

    if (partnerData) setPartner(partnerData);

    const { count: myCount } = await supabase
      .from('sent_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user!.id)
      .eq('status', 'accepted');

    const { count: partnerCount } = await supabase
      .from('sent_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', profile.partner_id)
      .eq('status', 'accepted');

    setMyActiveChallenges(myCount || 0);
    setPartnerActiveChallenges(partnerCount || 0);
  };

  if (!partner) return null;

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
          <p className="text-xs text-gray-600 mb-1">Vous</p>
          <p className="text-2xl font-bold text-gray-800">{profile?.points || 0}</p>
          <p className="text-xs text-gray-500">points</p>
          <p className="text-lg font-semibold text-pink-600 mt-1">{myActiveChallenges}</p>
          <p className="text-xs text-gray-500">défis actifs</p>
        </div>

        <div className="px-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-2xl">❤️</span>
          </div>
        </div>

        <div className="flex-1 text-center">
          <p className="text-xs text-gray-600 mb-1">{partner.username}</p>
          <p className="text-2xl font-bold text-gray-800">{partner.points}</p>
          <p className="text-xs text-gray-500">points</p>
          <p className="text-lg font-semibold text-purple-600 mt-1">{partnerActiveChallenges}</p>
          <p className="text-xs text-gray-500">défis actifs</p>
        </div>
      </div>
    </div>
  );
}
