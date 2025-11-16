import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Challenge, Reward } from '@/lib/types';
import PointsDisplay from '@/components/PointsDisplay';
import PartnerStats from '@/components/PartnerStats';
import ChallengeCard from '@/components/ChallengeCard';
import RewardBadge from '@/components/RewardBadge';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [recentChallenges, setRecentChallenges] = useState<Challenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    if (!user || !profile) return;

    const { data: challengesData } = await supabase
      .from('sent_challenges')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (challengesData) {
      const challenges = challengesData
        .map((sc: any) => sc.challenge)
        .filter((c: any) => c !== null);
      setRecentChallenges(challenges);
    }

    const { data: rewardsData } = await supabase
      .from('rewards')
      .select('*')
      .order('points_required', { ascending: true });

    if (rewardsData) {
      const rewardsWithStatus = rewardsData.map((reward: any) => ({
        ...reward,
        unlocked: (profile.points || 0) >= reward.points_required,
      }));
      setRewards(rewardsWithStatus);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      loadUserData();
    }
  }, [user, profile]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Dashboard</Text>

        {profile && (
          <PointsDisplay points={profile.points || 0} level={profile.level || 1} />
        )}

        <PartnerStats />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Challenges</Text>
          {recentChallenges.length === 0 ? (
            <Text style={styles.emptyText}>No challenges yet</Text>
          ) : (
            recentChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={() => router.push(`/challenge/${challenge.id}`)}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          {rewards.map((reward) => (
            <RewardBadge key={reward.id} reward={reward} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
