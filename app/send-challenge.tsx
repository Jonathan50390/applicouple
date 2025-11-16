import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Challenge } from '@/lib/types';
import ChallengeCard from '@/components/ChallengeCard';

export default function SendChallengePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    const loadChallenges = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setChallenges(data);
      setLoading(false);
    };

    loadChallenges();
  }, [user]);

  const handleSendChallenge = async (challenge: Challenge) => {
    if (!profile?.partner_id) {
      Alert.alert('No Partner', 'You need to connect with a partner first in Settings.');
      return;
    }

    const { error } = await supabase.from('sent_challenges').insert({
      challenge_id: challenge.id,
      sender_id: user!.id,
      receiver_id: profile.partner_id,
      status: 'pending',
    });

    if (error) {
      Alert.alert('Error', 'Failed to send challenge: ' + error.message);
    } else {
      Alert.alert('Success', 'Challenge sent to your partner!');
      router.back();
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
        <Text style={styles.title}>Select a Challenge to Send</Text>

        {challenges.map((challenge) => (
          <View key={challenge.id}>
            <ChallengeCard
              challenge={challenge}
              onPress={() => handleSendChallenge(challenge)}
            />
          </View>
        ))}
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
});
