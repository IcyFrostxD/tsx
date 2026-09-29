import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

const COLORS = { primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#212529', textLight: '#6C757D', btn: '#0D6EFD', border: '#DEE2E6' };
const API_URL = 'http://119.59.102.161:3095/api/login';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      return Toast.show({ type: 'error', text1: 'Missing Information', text2: 'Please enter Username and Password' });
    }
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Login Successful' });
        router.replace({ pathname: '/', params: { logged_in: 'true', username: data.username } });
      } else {
        Toast.show({ type: 'error', text1: 'Login Failed', text2: data.error });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Cannot connect to server' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Enter username" placeholderTextColor={COLORS.textLight} />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Enter password" placeholderTextColor={COLORS.textLight} />
        <Pressable style={styles.btn} onPress={handleLogin}><Text style={styles.btnText}>Login</Text></Pressable>
        <Pressable style={{ marginTop: 20 }} onPress={() => router.push('/register')}>
          <Text style={{ color: COLORS.btn, textAlign: 'center', fontSize: 14, fontWeight: '700' }}>Don't have an account? Register</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center', padding: 16 },
  box: { backgroundColor: COLORS.white, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, marginTop: 12 },
  input: { height: 48, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: COLORS.textDark },
  btn: { backgroundColor: COLORS.btn, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});