'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadPendingCount();

      const subscription = supabase
        .channel('sent_challenges_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sent_challenges',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            loadPendingCount();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadPendingCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from('sent_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    setPendingCount(count || 0);
  };

  const links = [
    { href: '/', label: 'Défis', icon: '🎯' },
    { href: '/propose', label: 'Proposer', icon: '✨' },
    { href: '/community', label: 'Communauté', icon: '👥' },
    { href: '/dashboard', label: 'Profil', icon: '👤' },
  ];

  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-pink-600'
                }`}
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="text-xs font-semibold">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {pendingCount > 0 && (
          <Link
            href="/received-challenges"
            className="fixed bottom-20 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex flex-col items-center">
              <span className="text-xl">📥</span>
              <span className="text-xs font-bold bg-red-500 rounded-full w-5 h-5 flex items-center justify-center absolute -top-1 -right-1">
                {pendingCount}
              </span>
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}
