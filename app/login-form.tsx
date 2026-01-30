import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useFonts, InriaSans_400Regular, InriaSans_700Bold } from '@expo-google-fonts/inria-sans';
import { useRouter } from 'expo-router';

export default function LoginFormScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    InriaSans_400Regular,
    InriaSans_700Bold,
  });

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Please enter email and password');
      return;
    }

    if (isSignUp) {
      if (!displayName.trim()) {
        alert('Please enter your name');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
      } else {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      let message = e.message;
      if (e.code === 'auth/email-already-in-use') {
        message = 'This email is already registered';
      } else if (e.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (e.code === 'auth/weak-password') {
        message = 'Password is too weak';
      } else if (e.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Clear fields when switching
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F68412" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>CHESS</Text>
          <Text style={styles.title}>TIME</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{isSignUp ? 'Create Account:' : 'Login as:'}</Text>
          
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{isSignUp ? 'Create Password' : 'Password'}</Text>
            <TextInput
              style={styles.input}
              placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.newUserText}>
              {isSignUp ? 'Already have an account? Sign In' : 'New User? Create an Account'}
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
    backgroundColor: '#93ABC5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 50,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    fontSize: 74,
    fontFamily: 'InriaSans_700Bold',
    color: 'black',
    textAlign: 'center',
    lineHeight: 74,
    fontWeight: "900",
    textShadowColor: '#F68412',
    textShadowOffset: { width: 1, height: 0 },
    textShadowRadius: 1,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 50,
    width: '100%',
    borderRadius: 15,
  },
  inputContainer: {
    marginBottom: 10,
    backgroundColor: '#D9D9D9',
    padding: 10,
    borderRadius: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#000',
    borderColor: '#0096FF',
    borderWidth: 2,
  },
  loginButton: {
    marginTop: 30,
    backgroundColor: '#F68412',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  newUserText: {
    color: '#0096FF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});
