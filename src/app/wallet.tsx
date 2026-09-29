import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const COLORS = {
  primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#212529', textLight: '#6C757D',
  btnConfirm: '#198754', btnCancel: '#DC3545', border: '#DEE2E6', walletCard: '#6f42c1'
};

const API_BASE_URL = 'http://119.59.102.161:3095/api';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUsername = params.username as string;

  const [wallet, setWallet] = useState<number>(0);
  const [topupAmount, setTopupAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [])
  );

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${currentUsername}`);
      const data = await res.json();
      if (res.ok) setWallet(Number(data.wallet) || 0);
    } catch (e) { }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      return Toast.show({ type: 'error', text1: 'Invalid Data', text2: 'Please enter a valid amount' });
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/user/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, amount })
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Top-up Successful!' });
        setTopupAmount('');
        fetchWallet();
      } else {
        Toast.show({ type: 'error', text1: 'Top-up Failed' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Connection Error' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
        <View style={styles.box}>
          <Text style={styles.title}>Wallet System</Text>
          <Text style={styles.userText}>Account: {currentUsername}</Text>

          <View style={styles.walletCard}>
            <Text style={styles.walletLabel}>Available Balance</Text>
            <Text style={styles.walletAmount}>THB {wallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>

          <Text style={styles.label}>Enter Top-up Amount</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            placeholder="0.00" 
            placeholderTextColor={COLORS.textLight} 
            value={topupAmount} 
            onChangeText={setTopupAmount} 
          />

          <View style={styles.actionRow}>
            <Pressable style={[styles.btnForm, { backgroundColor: COLORS.btnConfirm }]} onPress={handleTopup}>
              <Text style={styles.btnFormText}>Confirm</Text>
            </Pressable>
            <Pressable style={[styles.btnForm, { backgroundColor: COLORS.btnCancel }]} onPress={() => router.back()}>
              <Text style={styles.btnFormText}>Back</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg, padding: 20 },
  box: { backgroundColor: COLORS.white, padding: 30, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, width: '100%', maxWidth: 500, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, textAlign: 'center', marginBottom: 5 },
  userText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  walletCard: { backgroundColor: COLORS.walletCard, padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  walletAmount: { color: COLORS.white, fontSize: 36, fontWeight: '800' },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  input: { height: 50, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: COLORS.textDark },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  btnForm: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnFormText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});