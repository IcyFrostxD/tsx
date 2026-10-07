import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const COLORS = {
  primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#212529', textLight: '#6C757D',
  btnConfirm: '#0D6EFD', btnCancel: '#DC3545', border: '#DEE2E6', rankBg: '#FFD700'
};

const API_BASE_URL = 'http://119.59.102.161:3095/api';

export default function CustomizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUsername = params.username as string;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);
  const [rank, setRank] = useState('BRONZE');

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${currentUsername}`);
      const data = await res.json();
      if (res.ok) {
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setTotalSpent(Number(data.total_spent) || 0);
        setRank(data.rank || 'BRONZE');
      }
    } catch (e) {
      console.log('Error fetching profile');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, name, email, phone, address })
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Profile Updated' });
      } else {
        Toast.show({ type: 'error', text1: 'Update Failed' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Connection Error' });
    }
  };

  const getRankColor = () => {
    if (rank === 'PLATINUM') return '#E5E4E2';
    if (rank === 'GOLD') return '#FFD700';
    if (rank === 'SILVER') return '#C0C0C0';
    return '#CD7F32'; 
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.box}>
            <Text style={styles.title}>Account Profile</Text>
            <Text style={styles.userText}>Username: {currentUsername}</Text>

            <View style={[styles.rankCard, { backgroundColor: getRankColor() }]}>
              <Text style={styles.rankLabel}>Current Rank</Text>
              <Text style={styles.rankValue}>{rank}</Text>
              <Text style={styles.spentValue}>Total Spent: THB {totalSpent.toLocaleString()}</Text>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Your Name" placeholderTextColor={COLORS.textLight} value={name} onChangeText={setName} />

            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor={COLORS.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="08xxxxxxxx" placeholderTextColor={COLORS.textLight} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.label}>Delivery Address</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="House No, Street, City" placeholderTextColor={COLORS.textLight} value={address} onChangeText={setAddress} multiline />

            <View style={styles.actionRow}>
              <Pressable style={[styles.btnForm, { backgroundColor: COLORS.btnConfirm }]} onPress={handleSaveProfile}>
                <Text style={styles.btnFormText}>Save Profile</Text>
              </Pressable>
              <Pressable style={[styles.btnForm, { backgroundColor: COLORS.btnCancel }]} onPress={() => {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } });
    }
}}>
    <Text style={styles.btnFormText}>Back</Text>
</Pressable>
              
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg, padding: 20 },
  scrollContent: { justifyContent: 'center', flexGrow: 1 },
  box: { backgroundColor: COLORS.white, padding: 30, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, width: '100%', maxWidth: 500, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, textAlign: 'center', marginBottom: 5 },
  userText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  rankCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  rankLabel: { color: 'rgba(0,0,0,0.6)', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  rankValue: { color: '#000', fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  spentValue: { color: '#000', fontSize: 14, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  input: { height: 50, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: COLORS.textDark, marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 12 },
  btnForm: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnFormText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});