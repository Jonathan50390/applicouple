import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  level: number;
}

interface ProposalEntry {
  id: string;
  title: string;
  category: string;
  status: string;
  upvotes: number;
  proposed_by: string;
  profiles: {
    username: string;
  };
}

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [proposals, setProposals] = useState<ProposalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCommunityData = async () => {
    const { data: leaderboardData } = await supabase
      .from('profiles')
      .select('id, username, points, level')
      .order('points', { ascending: false })
      .limit(10);

    if (leaderboardData) setLeaderboard(leaderboardData);

    const { data: proposalsData } = await supabase
      .from('challenge_proposals')
      .select(`
        *,
        profiles(username)
      `)
      .order('upvotes', { ascending: false })
      .limit(10);

    if (proposalsData) setProposals(proposalsData as any);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      loadCommunityData();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          {leaderboard.map((entry, index) => (
            <View key={entry.id} style={styles.leaderboardCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.leaderboardContent}>
                <Text style={styles.username}>{entry.username}</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.stat}>{entry.points} pts</Text>
                  <Text style={styles.stat}>Level {entry.level}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Proposals</Text>
          {proposals.map((proposal) => (
            <View key={proposal.id} style={styles.proposalCard}>
              <View style={styles.proposalHeader}>
                <Text style={styles.proposalTitle}>{proposal.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(proposal.status) }]}>
                  <Text style={styles.statusText}>{proposal.status}</Text>
                </View>
              </View>
              <Text style={styles.proposedBy}>
                Proposed by {proposal.profiles.username}
              </Text>
              <View style={styles.proposalFooter}>
                <Text style={styles.category}>{proposal.category}</Text>
                <Text style={styles.upvotes}>�� {proposal.upvotes}</Text>
              </View>
            </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  leaderboardContent: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    fontSize: 14,
    color: '#6b7280',
  },
  proposalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  proposedBy: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: '#4b5563',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upvotes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
});
