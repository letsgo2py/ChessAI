import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { useFonts, InriaSans_400Regular, InriaSans_700Bold } from '@expo-google-fonts/inria-sans';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";;
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as AuthSession from 'expo-auth-session';

const snowflakeImage = require('../assets/snowflake.png');

// Rotating Snowflake Component
const RotatingSnowflake = ({ style, duration = 10000 }: { style: any; duration?: number }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotation.start();

    return () => rotation.stop();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Image
      source={snowflakeImage}
      style={[style, { transform: [{ rotate }] }]}
    />
  );
};

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {

  // const redirectUri = AuthSession.makeRedirectUri();
  // const redirectUri = "https://auth.expo.io/@dorei1234/chess-app";
  // const redirectUri = AuthSession.makeRedirectUri({
  //   scheme: 'chessapp',
  // });
  // console.log("**redirectUri", redirectUri);
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  //   androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  //   redirectUri,
  //   usePKCE: true,
  // });
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    // redirectUri: "https://auth.expo.io/@dorei1234/chess-app",
  });

  console.log("Redirect:", request?.redirectUri);

  const router = useRouter();

  useEffect(() => {
    console.log("RESPONSE:", response);

    if (response?.type === "success") {
      console.log("AUTH:", response.authentication);
      const id_token = response?.authentication?.idToken;

      if (!id_token) {
        console.log("No ID token received");
        return;
      }

      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCred) => {
          await AsyncStorage.setItem("user", JSON.stringify(userCred.user));
          router.replace('/(tabs)');
        })
        .catch((err) => console.log("Firebase error:", err));
    }

    if (response?.type === "error") {
      console.log("Google Auth Error:", response.error);
    }
  }, [response]);

  const [fontsLoaded] = useFonts({
    InriaSans_400Regular,
    InriaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F68412" />
      </View>
    );
  }

  async function playAsGuestHandler(){
    await AsyncStorage.setItem('isGuest', 'true');
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      {/* Rotating snowflakes with different speeds */}
      <RotatingSnowflake style={styles.snowflake1} duration={8000} />
      <RotatingSnowflake style={styles.snowflake2} duration={12000} />
      <RotatingSnowflake style={styles.snowflake3} duration={15000} />
      <RotatingSnowflake style={styles.snowflake4} duration={10000} />
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHESS</Text>
        <Text style={styles.title}>TIME</Text>
      </View>
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Welcome</Text>
        <Text style={styles.subtitle}>to the</Text>
        <Text style={styles.subtitle}>CHESSY</Text>
        <Text style={styles.subtitle}>WORLD.</Text>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login-form')}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.googleButton, !request && { opacity: 0.5 }]}
        onPress={() => promptAsync()} 
        disabled={!request}
      >
        <Text style={styles.loginButtonText}>Signup with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={playAsGuestHandler}>
        <Text style={styles.guestText}>Play as a guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#93ABC5',
    padding: 50,
  },
  snowflake1: {
    position: 'absolute',
    top: 80,
    right: -10,
    width: 80,
    height: 80,
    opacity: 0.9,
  },
  snowflake2: {
    position: 'absolute',
    top: 200,
    left: -10,
    width: 100,
    height: 100,
    opacity: 0.8,
  },
  snowflake3: {
    position: 'absolute',
    top: 350,
    right: -10,
    width: 150,
    height: 150,
    opacity: 0.6,
  },
  snowflake4: {
    position: 'absolute',
    top: 650,
    left: -10,
    width: 120,
    height: 120,
    opacity: 0.5,
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
  subtitleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  subtitle: {
    fontSize: 64,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 64,
    fontWeight: "900",
  },
  loginButton: {
    marginTop: 50,
    backgroundColor: '#F68412',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    marginTop: 20,
    backgroundColor: '#6a87e5',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  guestText: {
    color: '#332F2F',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.5,
  },
});
