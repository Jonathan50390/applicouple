import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function PartnerStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    partnerName: 'Not connected',
    totalChallenges: 0,
    completedChallenges: 0,
  });

  const loadStats = async () => {
    if (!profile?.partner_id) return;

    const { data: partner } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', profile.partner_id)
      .maybeSingle();

    const { count: total } = await supabase
      .from('sent_challenges')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

    const { count: completed } = await supabase
      .from('sent_challenges')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .eq('status', 'completed');

    setStats({
      partnerName: partner?.username || 'Unknown',
      totalChallenges: total || 0,
      completedChallenges: completed || 0,
    });
  };

  useEffect(() => {
    loadStats();
  }, [profile?.partner_id]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partnership Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Partner</Text>
          <Text style={styles.statValue}>{stats.partnerName}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{stats.totalChallenges}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>{stats.completedChallenges}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
});
