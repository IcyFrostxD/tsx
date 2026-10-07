import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';

const API_BASE_URL = 'http://119.59.102.161:3095/api';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const totalPrice = Number(params.total) || 0;
  
  // ข้อมูลที่ส่งมาจาก Cart เพื่อรอนำไปหักสต๊อกและสรุปออเดอร์
  const username = params.username as string || 'User'; 
  const coupon_id = params.coupon_id as string;
  const fullName = params.fullName as string;
  const phone = params.phone as string;
  const address = params.address as string;
  const paymentMethod = params.paymentMethod as string;

  const [refNo, setRefNo] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [slipImage, setSlipImage] = useState<string | null>(null);

  useEffect(() => {
    const randomRef = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    setRefNo(randomRef);
    setQrPayload(`PROMPTPAY|0812345678|REF:${randomRef}|AMT:${totalPrice}`);
  }, []);

  const handleWebFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setSlipImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyPayment = () => {
    if (!slipImage) {
      return Toast.show({ type: 'error', text1: 'Upload Required', text2: 'Please attach payment slip' });
    }

    setIsVerifying(true);

    // จำลองการตรวจสอบ 3 วินาที แล้วจึงยิง API ยืนยันการซื้อและตัดสต๊อกของจริง
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username, coupon_id, fullName, phone, address, paymentMethod
          })
        });
        const data = await res.json();

        if (res.ok) {
          setIsVerifying(false);
          setIsPaid(true);
          const spinMsg = data.earnedSpins > 0 ? `You earned ${data.earnedSpins} spins!` : 'Transfer successful';
          Toast.show({ type: 'success', text1: 'Payment Verified', text2: spinMsg });
          
          setTimeout(() => {
            router.replace({ 
              pathname: '/', 
              params: { logged_in: 'true', username } 
            });
          }, 2000);
        } else {
          setIsVerifying(false);
          Toast.show({ type: 'error', text1: 'Checkout Failed', text2: data.error });
        }
      } catch (e) {
        setIsVerifying(false);
        Toast.show({ type: 'error', text1: 'Network Error', text2: 'Failed to complete transaction' });
      }
    }, 3000);
  };

  const handleCancel = () => {
    router.replace({ 
      pathname: '/', 
      params: { logged_in: 'true', username } 
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.qrCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.headerTitle}>THAI QR PAYMENT</Text>
          <View style={styles.promptPayBadge}>
            <Text style={styles.promptPayText}>PromptPay</Text>
          </View>
        </View>

        <View style={styles.qrWrapper}>
          <QRCode value={qrPayload || 'PROMPTPAY|0812345678'} size={200} color="#000" backgroundColor="#FFF" />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.instructionText}>Scan QR code to pay</Text>
          <Text style={styles.ownerName}>Name: Mr. Kongkiat Boss</Text>
          <Text style={styles.accountNo}>Account: xxx-x-x9999-x</Text>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabelTotal}>Total Amount:</Text>
            <Text style={styles.metaValueTotal}>THB {totalPrice.toLocaleString()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Reference No:</Text>
            <Text style={styles.metaValueRef}>{refNo}</Text>
          </View>

          <View style={styles.divider} />
          
          {/* ส่วนแนบสลิป */}
          <View style={styles.slipSection}>
            <Text style={styles.slipTitle}>Attach Payment Slip</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.webFileInputContainer}>
                {React.createElement('input', { type: 'file', accept: 'image/*', onChange: handleWebFileChange, style: { color: '#0F172A', fontSize: 13 } })}
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBtn} onPress={() => setSlipImage('https://via.placeholder.com/150')}>
                <Text style={styles.uploadBtnText}>Select Image</Text>
              </TouchableOpacity>
            )}
            {slipImage && <Image source={{ uri: slipImage }} style={styles.previewImage} resizeMode="contain" />}
          </View>

        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>K+ | Accepts all banks</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.confirmBtn, (isVerifying || !slipImage) && styles.verifyingBtn, isPaid && styles.successBtn]} 
          onPress={handleVerifyPayment}
          disabled={isVerifying || isPaid || !slipImage}
        >
          {isVerifying ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmBtnText}>
              {isPaid ? 'Payment Successful' : 'Verify Payment'}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel} disabled={isVerifying || isPaid}>
          <Text style={styles.backBtnText}>Cancel & Return to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 16 },
  qrCard: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, marginBottom: 20 },
  cardHeader: { backgroundColor: '#0A3B75', paddingVertical: 16, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  promptPayBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  promptPayText: { color: '#0A3B75', fontSize: 11, fontWeight: '700' },
  qrWrapper: { padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', minHeight: 220 },
  infoSection: { paddingHorizontal: 20, paddingBottom: 20 },
  instructionText: { fontSize: 14, color: '#059669', fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  ownerName: { fontSize: 15, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 2 },
  accountNo: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 8 },
  divider: { width: '100%', height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  metaRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metaLabel: { fontSize: 12, color: '#64748B' },
  metaLabelTotal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  metaValueTotal: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  metaValueRef: { fontSize: 11, fontWeight: '600', color: '#334155' },
  
  slipSection: { marginTop: 10 },
  slipTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  webFileInputContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 8 },
  uploadBtn: { backgroundColor: '#E2E8F0', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  uploadBtnText: { color: '#334155', fontSize: 12, fontWeight: '600' },
  previewImage: { width: '100%', height: 100, marginTop: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },

  cardFooter: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 10, alignItems: 'center', backgroundColor: '#F8FAFC' },
  footerText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  buttonContainer: { width: '100%', maxWidth: 360, gap: 10 },
  confirmBtn: { backgroundColor: '#0284C7', paddingVertical: 14, borderRadius: 10, alignItems: 'center', height: 48, justifyContent: 'center' },
  verifyingBtn: { backgroundColor: '#94A3B8' },
  successBtn: { backgroundColor: '#10B981' },
  confirmBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  backBtn: { backgroundColor: '#334155', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  backBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});