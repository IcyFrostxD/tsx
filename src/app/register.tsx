import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const COLORS = { primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#212529', textLight: '#6C757D', btn: '#198754', border: '#DEE2E6' };
const API_URL = 'http://119.59.102.161:3095/api/register';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!username || !password) return Platform.OS === 'web' ? alert('Please fill in all fields') : null;
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (Platform.OS === 'web') alert('Registration successful! Please login.');
        router.back();
      } else {
        if (Platform.OS === 'web') alert(data.error);
      }
    } catch {
      if (Platform.OS === 'web') alert('Network connection failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Register User</Text>
        
        <Text style={styles.label}>New Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Choose username" placeholderTextColor={COLORS.textLight} />
        
        <Text style={styles.label}>New Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Choose password" placeholderTextColor={COLORS.textLight} />
        
        <Pressable style={styles.btn} onPress={handleRegister}>
          <Text style={styles.btnText}>Create Account</Text>
        </Pressable>
        
        <Pressable style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: '#6C757D', textAlign: 'center', fontSize: 14, fontWeight: '700' }}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { backgroundColor: COLORS.white, padding: 30, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, marginTop: 14 },
  input: { height: 50, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: COLORS.textDark },
  btn: { backgroundColor: COLORS.btn, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});