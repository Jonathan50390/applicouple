import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ReceivedChallenge {
  id: string;
  challenge_id: string;
  sender_id: string;
  status: string;
  created_at: string;
  challenge: {
    title: string;
    description: string;
    difficulty: string;
    category: string;
    points: number;
  };
  sender: {
    username: string;
  };
}

export default function ReceivedChallengesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ReceivedChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReceivedChallenges = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('sent_challenges')
      .select(`
        *,
        challenge:challenges(*),
        sender:profiles!sent_challenges_sender_id_fkey(username)
      `)
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setChallenges(data as any);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      loadReceivedChallenges();
    }
  }, [user]);

  const handleAccept = async (challengeId: string) => {
    const { error } = await supabase
      .from('sent_challenges')
      .update({ status: 'accepted' })
      .eq('id', challengeId);

    if (error) {
      Alert.alert('Error', 'Failed to accept challenge');
    } else {
      Alert.alert('Success', 'Challenge accepted!');
      loadReceivedChallenges();
    }
  };

  const handleReject = async (challengeId: string) => {
    const { error } = await supabase
      .from('sent_challenges')
      .update({ status: 'rejected' })
      .eq('id', challengeId);

    if (error) {
      Alert.alert('Error', 'Failed to reject challenge');
    } else {
      Alert.alert('Success', 'Challenge rejected');
      loadReceivedChallenges();
    }
  };

  const handleComplete = async (challengeId: string, points: number) => {
    const { error: updateError } = await supabase
      .from('sent_challenges')
      .update({ status: 'completed' })
      .eq('id', challengeId);

    if (!updateError) {
      const { error: pointsError } = await supabase.rpc('increment_points', {
        user_id: user!.id,
        points_to_add: points,
      });

      if (pointsError) {
        Alert.alert('Success', 'Challenge completed!');
      } else {
        Alert.alert('Success', `Challenge completed! +${points} points`);
      }
      loadReceivedChallenges();
    } else {
      Alert.alert('Error', 'Failed to complete challenge');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#3b82f6';
      case 'completed': return '#10b981';
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
        <Text style={styles.title}>Received Challenges</Text>

        {challenges.length === 0 ? (
          <Text style={styles.emptyText}>No challenges received yet</Text>
        ) : (
          challenges.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.challenge.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.sender}>From: {item.sender.username}</Text>
              <Text style={styles.description}>{item.challenge.description}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.category}>{item.challenge.category}</Text>
                <Text style={styles.points}>+{item.challenge.points} pts</Text>
              </View>

              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAccept(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'accepted' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => handleComplete(item.id, item.challenge.points)}
                >
                  <Text style={styles.actionButtonText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 48,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
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
  sender: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 8,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  category: {
    fontSize: 12,
    color: '#4b5563',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
