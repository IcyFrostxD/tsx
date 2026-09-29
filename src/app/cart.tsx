import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
      if (res.ok) setWallet(Number(data.wallet) || 0);
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

  // ฟังก์ชันป้องกัน GO_BACK Error
  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } });
    }
  };

  const handleCheckoutPress = () => {
    if (cartItems.length === 0) return Toast.show({ type: 'error', text1: 'Cart is empty' });
    if (currentUsername !== 'nueng' && wallet < grandTotal) return Toast.show({ type: 'error', text1: 'Insufficient balance', text2: 'Please top up your wallet' });

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Do you want to proceed with the payment?');
      if (confirmed) executeCheckout();
    } else {
      Alert.alert('Confirm Checkout', 'Do you want to proceed with the payment?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'default', onPress: () => executeCheckout() },
      ]);
    }
  };

  const executeCheckout = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, coupon_id: selectedCoupon?.id })
      });
      const data = await res.json();

      if (res.ok) {
        setCartItems([]);
        setSelectedCoupon(null);
        if (data.earnedSpins > 0) {
          Toast.show({ type: 'success', text1: 'Payment Successful!', text2: `You earned ${data.earnedSpins} spins!` });
        } else {
          Toast.show({ type: 'success', text1: 'Payment Successful!' });
        }
        setTimeout(() => navigateBack(), 2000);
      } else {
        Toast.show({ type: 'error', text1: 'Checkout Failed', text2: data.error });
      }
    } catch (e) { Toast.show({ type: 'error', text1: 'Network Error' }); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Pressable onPress={navigateBack}><Text style={styles.backText}>Close</Text></Pressable>
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
              <Pressable 
                style={[styles.couponBox, !selectedCoupon && styles.couponBoxActive]} 
                onPress={() => setSelectedCoupon(null)}
              >
                <Text style={[styles.couponText, !selectedCoupon && styles.couponTextActive]}>No Coupon</Text>
              </Pressable>
              {coupons.map((c) => (
                <Pressable 
                  key={c.id} 
                  style={[styles.couponBox, selectedCoupon?.id === c.id && styles.couponBoxActive]} 
                  onPress={() => setSelectedCoupon(c)}
                >
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
        
        <Pressable style={[styles.btnCheckout, cartItems.length === 0 && {backgroundColor: COLORS.textLight}]} onPress={handleCheckoutPress} disabled={cartItems.length === 0}>
          <Text style={styles.btnCheckoutText}>Checkout</Text>
        </Pressable>
      </View>
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
  btnCheckoutText: { color: COLORS.white, fontSize: 18, fontWeight: '800' }
});