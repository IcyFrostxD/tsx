import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  
  const [orderSuccessData, setOrderSuccessData] = useState<any>(null);

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

  const handleUpdateQty = async (cartId: number, currentQty: number, maxStock: number, action: 'increase' | 'decrease') => {
    let newQty = currentQty;
    if (action === 'increase') {
      if (currentQty >= maxStock) {
        Toast.show({ type: 'error', text1: 'Out of Stock', text2: 'Cannot exceed available stock' });
        return;
      }
      newQty += 1;
    } else {
      if (currentQty <= 1) return; 
      newQty -= 1;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) fetchCart();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error' });
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.cart_qty), 0);
  const discountPercent = selectedCoupon ? selectedCoupon.discount_percent : 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = subtotal - discountAmount;

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) return Toast.show({ type: 'error', text1: 'Cart is empty' });
    setIsCheckoutModalOpen(true);
    setOrderSuccessData(null);
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
          fullName, phone, address, paymentMethod
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
        setOrderSuccessData({
          order_id: data.orderId || `ORD-${Math.floor(Math.random() * 10000)}`,
          items: [...cartItems],
          subtotal: subtotal,
          discountPercent: discountPercent,
          discountAmount: discountAmount,
          total: grandTotal,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        });
        setCartItems([]);
        setSelectedCoupon(null);
        
        const spinMsg = data.earnedSpins > 0 ? `You earned ${data.earnedSpins} spins!` : '';
        Toast.show({ type: 'success', text1: 'Payment Successful', text2: spinMsg });
      } else {
        Toast.show({ type: 'error', text1: 'Checkout Failed', text2: data.error });
      }
    } catch (e) { Toast.show({ type: 'error', text1: 'Network Error' }); }
  };

  // ----------------------------------------------------
  // วิธีใหม่: พิมพ์/ดาวน์โหลดผ่านระบบบราวเซอร์ (Window Print)
  // ----------------------------------------------------
  const printInvoice = () => {
    if (Platform.OS === 'web' && orderSuccessData) {
      Toast.show({ type: 'info', text1: 'Preparing Invoice', text2: 'Please select "Save as PDF" in the print menu.' });

      const content = `
        <html>
        <head>
          <title>Invoice - ${orderSuccessData.order_id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; background: #FFFFFF; padding: 20px; }
            .container { width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; }
            .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 26px; color: #0F172A; text-transform: uppercase; }
            .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748B; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-col { width: 48%; }
            .info-col p { margin: 4px 0; font-size: 14px; line-height: 1.5; }
            .section-title { border-top: 2px solid #0F172A; padding-top: 15px; margin-bottom: 15px; font-size: 16px; color: #0F172A; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
            th { background-color: #F8FAFC; color: #475569; font-weight: bold; }
            .total-section { width: 100%; max-width: 350px; margin-left: auto; border-top: 2px solid #E2E8F0; padding-top: 20px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .grand-total { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #0F172A; font-size: 18px; font-weight: bold; color: #0F172A; }
            .footer { margin-top: 50px; text-align: center; color: #94A3B8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>INVOICE</h1>
              <p>1IT Store</p>
            </div>

            <div class="info-row">
              <div class="info-col">
                <p><strong>Billed To:</strong><br/>${orderSuccessData.fullName}</p>
                <p><strong>Phone:</strong> ${orderSuccessData.phone}</p>
                <p><strong>Address:</strong><br/>${orderSuccessData.address}</p>
              </div>
              <div class="info-col" style="text-align: right;">
                <p><strong>Order ID:</strong> ${orderSuccessData.order_id}</p>
                <p><strong>Date:</strong> ${orderSuccessData.date}</p>
              </div>
            </div>

            <div class="section-title">Order Items</div>

            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Item Name</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price (THB)</th>
                  <th style="text-align: right;">Amount (THB)</th>
                </tr>
              </thead>
              <tbody>
                ${orderSuccessData.items.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.product_name}</td>
                    <td style="text-align: center;">${item.cart_qty || item.quantity || 1}</td>
                    <td style="text-align: right;">${item.price.toLocaleString()}</td>
                    <td style="text-align: right;">${(item.price * (item.cart_qty || item.quantity || 1)).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${orderSuccessData.subtotal.toLocaleString()}</span>
              </div>
              ${orderSuccessData.discountAmount > 0 ? `
              <div class="total-row" style="color: #10B981;">
                <span>Discount (${orderSuccessData.discountPercent}%):</span>
                <span>-${orderSuccessData.discountAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="grand-total">
                <span>Total Price:</span>
                <span>THB ${orderSuccessData.total.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your purchase.</p>
              <p>1IT Store</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); } };
          </script>
        </body>
        </html>
      `;

      // เปิดหน้าต่างใหม่แล้วสั่ง Print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
      } else {
         Toast.show({ type: 'error', text1: 'Popup Blocked', text2: 'Please allow popups for this site.' });
      }

    } else {
      Toast.show({ type: 'info', text1: 'Not Supported', text2: 'Printing is only available on web browser.' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Pressable onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } });
        }}>
          <Text style={styles.backText}>Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cartItems.length === 0 ? (
          <Text style={{textAlign: 'center', marginTop: 50, color: COLORS.textLight}}>Your cart is empty.</Text>
        ) : (
          cartItems.map((item) => {
            const isMaxStock = item.cart_qty >= item.stock_qty;
            const isMinStock = item.cart_qty <= 1;

            return (
              <View key={item.cart_id} style={styles.cartItem}>
                {item.image_filename ? (
                  <Image source={{ uri: item.image_filename }} style={styles.itemImg} resizeMode="cover" />
                ) : <View style={styles.noImg} />}
                
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                    <Pressable onPress={() => removeItem(item.cart_id)} style={styles.btnRemove}>
                      <Text style={styles.btnRemoveText}>X</Text>
                    </Pressable>
                  </View>

                  <View style={styles.itemBottomRow}>
                    <Text style={styles.itemDetail}>THB {item.price}</Text>
                    <View style={styles.qtyRow}>
                      <Pressable style={[styles.qtyBtn, isMinStock && styles.qtyBtnDisabled]} onPress={() => handleUpdateQty(item.cart_id, item.cart_qty, item.stock_qty, 'decrease')} disabled={isMinStock}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.qtyValue}>{item.cart_qty}</Text>
                      <Pressable style={[styles.qtyBtn, isMaxStock && styles.qtyBtnDisabled]} onPress={() => handleUpdateQty(item.cart_id, item.cart_qty, item.stock_qty, 'increase')} disabled={isMaxStock}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
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
                  <Text style={[styles.couponText, selectedCoupon?.id === c.id && styles.couponTextActive]}>
                    {c.discount_percent}% OFF {c.expire_month ? '(Rank)' : '(Spin)'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal:</Text><Text style={styles.summaryValue}>THB {subtotal.toLocaleString()}</Text></View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount ({discountPercent}%):</Text>
          <Text style={{color: COLORS.btnConfirm, fontWeight: '700'}}>- THB {discountAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}><Text style={[styles.summaryLabel, {fontSize: 18, color: COLORS.textDark}]}>Total:</Text><Text style={styles.grandTotal}>THB {grandTotal.toLocaleString()}</Text></View>
        
        <Pressable style={[styles.btnCheckout, cartItems.length === 0 && {backgroundColor: COLORS.textLight}]} onPress={handleOpenCheckout} disabled={cartItems.length === 0}>
          <Text style={styles.btnCheckoutText}>Checkout</Text>
        </Pressable>
      </View>

      <Modal visible={isCheckoutModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            {orderSuccessData ? (
              <View style={styles.successView}>
                <Text style={styles.successTitle}>Payment Successful</Text>
                <Text style={styles.successSubtitle}>Thank you for your order.</Text>
                
                <Pressable style={styles.btnPrintPrimary} onPress={printInvoice}>
                  <Text style={styles.btnPrintText}>Download Invoice</Text>
                </Pressable>

                <Pressable style={styles.btnBackToShop} onPress={() => { setIsCheckoutModalOpen(false); router.back(); }}>
                  <Text style={styles.btnBackToShopText}>Back to Shop</Text>
                </Pressable>
              </View>
            ) : (
              <>
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
                  <Pressable style={[styles.paymentOption, paymentMethod === 'QR' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('QR')}>
                    <Text style={[styles.paymentText, paymentMethod === 'QR' && styles.paymentTextActive]}>QR Pay</Text>
                  </Pressable>
                </View>
                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>Net Total:</Text>
                  <Text style={styles.modalTotalValue}>THB {grandTotal.toLocaleString()}</Text>
                </View>
                <View style={styles.modalActions}>
                  <Pressable onPress={() => setIsCheckoutModalOpen(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleConfirmOrder} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Confirm Order</Text>
                  </Pressable>
                </View>
              </>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { backgroundColor: COLORS.white, padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  backText: { fontSize: 16, color: COLORS.btnCancel, fontWeight: '700' },
  scrollContent: { padding: 16 },
  
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 12, borderRadius: 12, marginBottom: 12, height: 100, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemImg: { width: 76, height: 76, borderRadius: 8, marginRight: 12 },
  noImg: { width: 76, height: 76, borderRadius: 8, marginRight: 12, backgroundColor: '#E9ECEF' },
  
  itemInfo: { flex: 1, height: '100%', justifyContent: 'space-between', paddingVertical: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex: 1, marginRight: 8 },
  btnRemove: { padding: 4, marginTop: -4, marginRight: -4 },
  btnRemoveText: { color: COLORS.btnCancel, fontWeight: '900', fontSize: 16 },
  
  itemBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDetail: { fontSize: 14, color: COLORS.btnConfirm, fontWeight: '800' },
  
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  qtyBtnDisabled: { backgroundColor: '#F8FAFC', opacity: 0.4 },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#475569' },
  qtyValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', minWidth: 24, textAlign: 'center' },

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
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#FFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A', width: '100%' },
  
  paymentContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  paymentOption: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  paymentOptionActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  paymentText: { fontSize: 13, fontWeight: '800', color: '#475569' },
  paymentTextActive: { color: '#FFFFFF' },
  
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 14 },
  modalTotalLabel: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  modalTotalValue: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  saveBtn: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  successView: { alignItems: 'center', paddingVertical: 10 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#10B981', marginBottom: 6 },
  successSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 24, textAlign: 'center' },
  
  btnPrintPrimary: { width: '100%', backgroundColor: '#0D6EFD', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12, shadowColor: '#0D6EFD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  btnPrintText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  
  btnBackToShop: { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' },
  btnBackToShopText: { color: '#64748B', fontSize: 14, fontWeight: '800' }
});