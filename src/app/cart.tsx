import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const API_BASE_URL = 'http://119.59.102.161:3095/api';

const COLORS = {
  primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#212529', textLight: '#6C757D',
  btnConfirm: '#198754', btnCancel: '#DC3545', border: '#DEE2E6', btnPrimary: '#0D6EFD',
  couponBg: '#e2e3e5', couponActive: '#198754'
};

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUsername = params.username as string;

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [wallet, setWallet] = useState(0);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Wallet'); 

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchCart();
      fetchCoupons();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${currentUsername}`);
      const data = await res.json();
      if (res.ok) {
        setWallet(Number(data.wallet) || 0);
        if (data.name) setFullName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.address) setAddress(data.address);
      }
    } catch (e) { }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/${currentUsername}`);
      const data = await res.json();
      if (Array.isArray(data)) setCartItems(data);
    } catch (e) { }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/${currentUsername}`);
      const data = await res.json();
      if (Array.isArray(data)) setCoupons(data);
    } catch (e) { }
  };

  const removeItem = async (cartId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/${cartId}`, { method: 'DELETE' });
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Item Removed' });
        fetchCart();
      }
    } catch (e) { Toast.show({ type: 'error', text1: 'Failed to remove item' }); }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.cart_qty), 0);
  const discountPercent = selectedCoupon ? selectedCoupon.discount_percent : 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = subtotal - discountAmount;

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) return Toast.show({ type: 'error', text1: 'Cart is empty' });
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      return Toast.show({ type: 'error', text1: 'Missing Information', text2: 'Please fill in delivery details.' });
    }

    if (paymentMethod === 'Wallet' && currentUsername !== 'nueng' && wallet < grandTotal) {
      return Toast.show({ type: 'error', text1: 'Insufficient balance', text2: 'Please top up your wallet.' });
    }

    if (paymentMethod === 'QR') {
      setIsCheckoutModalOpen(false);
      router.replace({ 
        pathname: '/payment', 
        params: { 
          total: grandTotal, 
          username: currentUsername,
          coupon_id: selectedCoupon ? String(selectedCoupon.id) : '',
          fullName,
          phone,
          address,
          paymentMethod
        } 
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUsername, 
          coupon_id: selectedCoupon?.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          paymentMethod: paymentMethod
        })
      });
      const data = await res.json();

      if (res.ok) {
        setIsCheckoutModalOpen(false);
        setCartItems([]);
        setSelectedCoupon(null);
        
        const spinMsg = data.earnedSpins > 0 ? `You earned ${data.earnedSpins} spins!` : '';
        Toast.show({ type: 'success', text1: 'Payment Successful!', text2: spinMsg });
        setTimeout(() => router.back(), 2000);
      } else {
        Toast.show({ type: 'error', text1: 'Checkout Failed', text2: data.error });
      }
    } catch (e) { Toast.show({ type: 'error', text1: 'Network Error' }); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Pressable onPress={() => {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } });
            }
        }}>
          <Text style={styles.backText}>Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cartItems.length === 0 ? (
          <Text style={{textAlign: 'center', marginTop: 50, color: COLORS.textLight}}>Your cart is empty.</Text>
        ) : (
          cartItems.map((item) => (
            <View key={item.cart_id} style={styles.cartItem}>
              {item.image_filename ? (
                <Image source={{ uri: item.image_filename }} style={styles.itemImg} resizeMode="cover" />
              ) : <View style={styles.noImg} />}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                <Text style={styles.itemDetail}>Price: THB {item.price} | Qty: {item.cart_qty}</Text>
              </View>
              <Pressable onPress={() => removeItem(item.cart_id)} style={styles.btnRemove}>
                <Text style={styles.btnRemoveText}>X</Text>
              </Pressable>
            </View>
          ))
        )}

        {coupons.length > 0 && cartItems.length > 0 && (
          <View style={styles.couponSection}>
            <Text style={styles.couponTitle}>Select a Coupon:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.couponScroll}>
              <Pressable style={[styles.couponBox, !selectedCoupon && styles.couponBoxActive]} onPress={() => setSelectedCoupon(null)}>
                <Text style={[styles.couponText, !selectedCoupon && styles.couponTextActive]}>No Coupon</Text>
              </Pressable>
              {coupons.map((c) => (
                <Pressable key={c.id} style={[styles.couponBox, selectedCoupon?.id === c.id && styles.couponBoxActive]} onPress={() => setSelectedCoupon(c)}>
                  <Text style={[styles.couponText, selectedCoupon?.id === c.id && styles.couponTextActive]}>{c.discount_percent}% OFF</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal:</Text><Text style={styles.summaryValue}>THB {subtotal}</Text></View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount ({discountPercent}%):</Text>
          <Text style={{color: COLORS.btnConfirm, fontWeight: '700'}}>- THB {discountAmount}</Text>
        </View>
        <View style={styles.summaryRow}><Text style={[styles.summaryLabel, {fontSize: 18, color: COLORS.textDark}]}>Total:</Text><Text style={styles.grandTotal}>THB {grandTotal}</Text></View>
        
        <Pressable style={[styles.btnCheckout, cartItems.length === 0 && {backgroundColor: COLORS.textLight}]} onPress={handleOpenCheckout} disabled={cartItems.length === 0}>
          <Text style={styles.btnCheckoutText}>Checkout</Text>
        </Pressable>
      </View>

      <Modal visible={isCheckoutModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delivery & Payment</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#94A3B8" value={fullName} onChangeText={setFullName} />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="08xxxxxxxx" placeholderTextColor="#94A3B8" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="House No, Street, City" placeholderTextColor="#94A3B8" multiline value={address} onChangeText={setAddress} />

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentContainer}>
              <Pressable style={[styles.paymentOption, paymentMethod === 'Wallet' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('Wallet')}>
                <Text style={[styles.paymentText, paymentMethod === 'Wallet' && styles.paymentTextActive]}>Wallet</Text>
              </Pressable>
              {/* ตัด COD ออกเหลือแค่ Wallet และ QR Pay */}
              <Pressable style={[styles.paymentOption, paymentMethod === 'QR' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('QR')}>
                <Text style={[styles.paymentText, paymentMethod === 'QR' && styles.paymentTextActive]}>QR Pay</Text>
              </Pressable>
            </View>

            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>Net Total:</Text>
              <Text style={styles.modalTotalValue}>THB {grandTotal}</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setIsCheckoutModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmOrder} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Confirm Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { backgroundColor: COLORS.white, padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  backText: { fontSize: 16, color: COLORS.btnCancel, fontWeight: '700' },
  scrollContent: { padding: 16 },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  itemImg: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  noImg: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#E9ECEF' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  itemDetail: { fontSize: 13, color: COLORS.textLight },
  btnRemove: { padding: 10 },
  btnRemoveText: { color: COLORS.btnCancel, fontWeight: '900', fontSize: 16 },
  couponSection: { marginTop: 10, marginBottom: 20 },
  couponTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 10 },
  couponScroll: { flexDirection: 'row' },
  couponBox: { backgroundColor: COLORS.couponBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: COLORS.border },
  couponBoxActive: { backgroundColor: COLORS.couponActive, borderColor: COLORS.couponActive },
  couponText: { color: COLORS.textDark, fontWeight: '700', fontSize: 14 },
  couponTextActive: { color: COLORS.white },
  footer: { backgroundColor: COLORS.white, padding: 20, borderTopWidth: 1, borderColor: COLORS.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 15, color: COLORS.textLight, fontWeight: '600' },
  summaryValue: { fontSize: 15, color: COLORS.textDark, fontWeight: '700' },
  grandTotal: { fontSize: 22, fontWeight: '800', color: COLORS.btnPrimary },
  btnCheckout: { backgroundColor: COLORS.btnConfirm, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  btnCheckoutText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#0F172A', width: '100%' },
  paymentContainer: { flexDirection: 'row', gap: 6, marginTop: 4 },
  paymentOption: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  paymentOptionActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  paymentText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  paymentTextActive: { color: '#FFFFFF' },
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
  modalTotalLabel: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  modalTotalValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  saveBtn: { backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});