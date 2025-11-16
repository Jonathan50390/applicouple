import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ProposePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [points, setPoints] = useState('50');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!title || !description || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('challenge_proposals').insert({
      title,
      description,
      category,
      difficulty,
      points: parseInt(points),
      proposed_by: user.id,
      status: 'pending',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to submit proposal: ' + error.message);
    } else {
      Alert.alert('Success', 'Challenge proposal submitted!');
      setTitle('');
      setDescription('');
      setCategory('');
      setDifficulty('medium');
      setPoints('50');
      router.back();
    }
  };

  const difficulties = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Propose a New Challenge</Text>
          <Text style={styles.subtitle}>
            Share your challenge idea with the community
          </Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter challenge title"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the challenge"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Adventure, Romance, Fun"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.difficultyContainer}>
            {difficulties.map((diff) => (
              <TouchableOpacity
                key={diff.value}
                style={[
                  styles.difficultyButton,
                  difficulty === diff.value && styles.difficultyButtonActive,
                ]}
                onPress={() => setDifficulty(diff.value)}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    difficulty === diff.value && styles.difficultyButtonTextActive,
                  ]}
                >
                  {diff.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Points</Text>
          <TextInput
            style={styles.input}
            placeholder="Points value"
            value={points}
            onChangeText={setPoints}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Proposal'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#8b5cf6',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  difficultyButtonTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
