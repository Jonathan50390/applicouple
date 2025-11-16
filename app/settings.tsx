import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [partnerCode, setPartnerCode] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [challengeVisibility, setChallengeVisibility] = useState('public');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setNotificationsEnabled(data.notifications_enabled ?? true);
      setChallengeVisibility(data.challenge_visibility ?? 'public');
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      loadPreferences();
    }
  }, [user]);

  const handleConnectPartner = async () => {
    if (!partnerCode.trim()) {
      Alert.alert('Error', 'Please enter a partner code');
      return;
    }

    setConnecting(true);

    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('partner_code', partnerCode.trim().toUpperCase())
      .maybeSingle();

    if (!partnerProfile) {
      Alert.alert('Error', 'Invalid partner code');
      setConnecting(false);
      return;
    }

    if (partnerProfile.id === user!.id) {
      Alert.alert('Error', 'You cannot connect with yourself');
      setConnecting(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ partner_id: partnerProfile.id })
      .eq('id', user!.id);

    setConnecting(false);

    if (error) {
      Alert.alert('Error', 'Failed to connect: ' + error.message);
    } else {
      Alert.alert('Success', `Connected with ${partnerProfile.username}!`);
      setPartnerCode('');
      await refreshProfile();
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('preferences')
      .upsert({
        user_id: user.id,
        notifications_enabled: notificationsEnabled,
        challenge_visibility: challengeVisibility,
      });

    if (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } else {
      Alert.alert('Success', 'Preferences saved');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
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
          <Text style={styles.sectionTitle}>Your Partner Code</Text>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Share this code with your partner:</Text>
            <Text style={styles.code}>{profile?.partner_code}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect with Partner</Text>
          {profile?.partner_id ? (
            <Text style={styles.connectedText}>✓ Partner connected</Text>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter partner's code"
                value={partnerCode}
                onChangeText={setPartnerCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.button, connecting && styles.buttonDisabled]}
                onPress={handleConnectPartner}
                disabled={connecting}
              >
                <Text style={styles.buttonText}>
                  {connecting ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
            />
          </View>

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Challenge Visibility</Text>
          </View>
          <View style={styles.visibilityButtons}>
            <TouchableOpacity
              style={[
                styles.visibilityButton,
                challengeVisibility === 'public' && styles.visibilityButtonActive,
              ]}
              onPress={() => setChallengeVisibility('public')}
            >
              <Text
                style={[
                  styles.visibilityButtonText,
                  challengeVisibility === 'public' && styles.visibilityButtonTextActive,
                ]}
              >
                Public
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.visibilityButton,
                challengeVisibility === 'private' && styles.visibilityButtonActive,
              ]}
              onPress={() => setChallengeVisibility('private')}
            >
              <Text
                style={[
                  styles.visibilityButtonText,
                  challengeVisibility === 'private' && styles.visibilityButtonTextActive,
                ]}
              >
                Private
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSavePreferences}
          >
            <Text style={styles.buttonText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  codeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8b5cf6',
    letterSpacing: 4,
  },
  connectedText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  visibilityButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  visibilityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  visibilityButtonActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#8b5cf6',
  },
  visibilityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  visibilityButtonTextActive: {
    color: '#ffffff',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
