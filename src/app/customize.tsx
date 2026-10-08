import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const API_BASE_URL = 'http://119.59.102.161:3095/api';

const COLORS = {
  primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#0F172A', textLight: '#64748B',
  border: '#E2E8F0', btnSave: '#0F172A', btnCancel: '#64748B'
};

export default function CustomizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUsername = params.username as string;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [rank, setRank] = useState('BRONZE');
  const [totalSpent, setTotalSpent] = useState(0);

  const [showRankInfo, setShowRankInfo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${currentUsername}`);
      const data = await res.json();
      if (res.ok) {
        setFullName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setRank(data.rank || 'BRONZE');
        setTotalSpent(Number(data.total_spent) || 0);
      }
    } catch (e) { }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${currentUsername}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: email,
          phone: phone,
          address: address
        })
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Profile Updated' });
        setTimeout(() => {
          if (router.canGoBack()) router.back();
          else router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } });
        }, 1000);
      } else {
        Toast.show({ type: 'error', text1: 'Update Failed' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error' });
    }
  };

  const getRankColor = (r: string) => {
    switch(r) {
      case 'PLATINUM': return '#0EA5E9';
      case 'GOLD': return '#F59E0B';
      case 'SILVER': return '#94A3B8';
      default: return '#D97706'; // BRONZE
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Profile</Text>
        <Text style={styles.headerSubtitle}>Username: {currentUsername}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.rankCard}>
          <Text style={styles.rankLabel}>Current Rank</Text>
          <View style={styles.rankTitleRow}>
            <Text style={[styles.rankValue, { color: getRankColor(rank) }]}>{rank}</Text>
            <Pressable onPress={() => setShowRankInfo(true)} style={styles.infoBtn}>
              <Text style={styles.infoBtnText}>i</Text>
            </Pressable>
          </View>
          <Text style={styles.spentValue}>Total Spent: THB {totalSpent.toLocaleString()}</Text>
          
          {/* ปุ่มเข้าไปดูหน้าประวัติการซื้อ */}
          <Pressable onPress={() => router.push({ pathname: '/history', params: { username: currentUsername } })} style={styles.btnHistory}>
            <Text style={styles.btnHistoryText}>📜 View Purchase History</Text>
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your full name" placeholderTextColor="#94A3B8" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="08xxxxxxxx" placeholderTextColor="#94A3B8" keyboardType="phone-pad" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Delivery Address</Text>
          <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="House No, Street, City, Postal Code" placeholderTextColor="#94A3B8" multiline />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.btnCancel} onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } });
        }}>
          <Text style={styles.btnCancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.btnSave} onPress={handleSave}>
          <Text style={styles.btnSaveText}>Save Changes</Text>
        </Pressable>
      </View>

      <Modal visible={showRankInfo} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.rankInfoCard}>
            <Text style={styles.rankInfoTitle}>RANK SYSTEM</Text>
            <Text style={styles.rankInfoDesc}>ระบบ Rank System ใช้ยอดซื้อสะสมของลูกค้าในการกำหนดระดับสมาชิก ยิ่งมียอดซื้อสะสมสูงก็จะได้รับ Rank ที่สูงขึ้น</Text>
            
            <View style={styles.rankTable}>
              <View style={styles.rankTableRow}>
                <Text style={[styles.rankTableCell, {fontWeight: 'bold'}]}>Rank</Text>
                <Text style={[styles.rankTableCell, {fontWeight: 'bold', textAlign: 'right'}]}>ยอดซื้อสะสม</Text>
              </View>
              <View style={styles.rankTableRow}>
                <Text style={[styles.rankTableCell, {color: '#D97706', fontWeight: '800'}]}>🥉 BRONZE</Text>
                <Text style={[styles.rankTableCell, {textAlign: 'right'}]}>0 - 9,999 บาท</Text>
              </View>
              <View style={styles.rankTableRow}>
                <Text style={[styles.rankTableCell, {color: '#94A3B8', fontWeight: '800'}]}>🥈 SILVER</Text>
                <Text style={[styles.rankTableCell, {textAlign: 'right'}]}>10,000 - 49,999 บาท</Text>
              </View>
              <View style={styles.rankTableRow}>
                <Text style={[styles.rankTableCell, {color: '#F59E0B', fontWeight: '800'}]}>🥇 GOLD</Text>
                <Text style={[styles.rankTableCell, {textAlign: 'right'}]}>50,000 - 99,999 บาท</Text>
              </View>
              <View style={styles.rankTableRow}>
                <Text style={[styles.rankTableCell, {color: '#0EA5E9', fontWeight: '800'}]}>💎 PLATINUM</Text>
                <Text style={[styles.rankTableCell, {textAlign: 'right'}]}>100,000 บาทขึ้นไป</Text>
              </View>
            </View>

            <Text style={styles.rankInfoFeatureTitle}>รายละเอียด</Text>
            <View style={styles.rankFeatureList}>
              <Text style={styles.rankFeatureItem}>• Rank Bronze ไม่ลด%</Text>
              <Text style={styles.rankFeatureItem}>• Rank Silver ลด 10%</Text>
              <Text style={styles.rankFeatureItem}>• Rank Gold ลด 15%</Text>
              <Text style={styles.rankFeatureItem}>• Rank Platinum ลด 20%</Text>
              <Text style={[styles.rankFeatureItem, { color: '#EF4444', fontWeight: 'bold' }]}>
                * สามารถเลือกใช้ส่วนลดได้ 1 ครั้งใน Rank ตัวเอง และจะทำการรีส่วนลดคืนเมื่อครบ 1 เดือน
              </Text>
            </View>

            <Pressable style={styles.btnCloseModal} onPress={() => setShowRankInfo(false)}>
              <Text style={styles.btnCloseModalText}>เข้าใจแล้ว</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingVertical: 24, alignItems: 'center', backgroundColor: COLORS.white },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textDark },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4, fontWeight: '500' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  rankCard: { backgroundColor: '#F1F5F9', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: COLORS.border },
  rankLabel: { fontSize: 13, color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  rankTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rankValue: { fontSize: 28, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  infoBtn: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  infoBtnText: { fontSize: 12, fontWeight: 'bold', color: '#0F172A' },
  spentValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '800', marginTop: 8 },
  
  btnHistory: { backgroundColor: '#0F172A', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnHistoryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, color: COLORS.textDark },
  textArea: { height: 100, paddingTop: 14, textAlignVertical: 'top' },
  
  footer: { flexDirection: 'row', padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderColor: COLORS.border, gap: 12 },
  btnCancel: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  btnCancelText: { color: COLORS.btnCancel, fontSize: 15, fontWeight: '800' },
  btnSave: { flex: 2, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.btnSave },
  btnSaveText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },

  modalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  rankInfoCard: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  rankInfoTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 10 },
  rankInfoDesc: { fontSize: 13, color: '#475569', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  rankTable: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', marginBottom: 20 },
  rankTableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 12 },
  rankTableCell: { flex: 1, fontSize: 13, color: '#0F172A' },
  rankInfoFeatureTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  rankFeatureList: { marginBottom: 24 },
  rankFeatureItem: { fontSize: 13, color: '#475569', marginBottom: 6, lineHeight: 20 },
  btnCloseModal: { backgroundColor: '#0F172A', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnCloseModalText: { color: '#FFF', fontSize: 15, fontWeight: '800' }
});