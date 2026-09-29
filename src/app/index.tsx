import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const COLORS = {
  primaryBg: '#F8F9FA', headerBg: '#FFFFFF', white: '#FFFFFF',
  textDark: '#212529', textLight: '#6C757D',
  btnEdit: '#FD7E14', btnDelete: '#DC3545', btnAdd: '#0D6EFD', btnBuy: '#198754',
  border: '#DEE2E6', rouletteBg: '#ffc107', activeCat: '#0D6EFD', walletBg: '#6f42c1'
};

const CATEGORIES = ['All', 'Mouse', 'Monitor', 'Keyboard', 'Mousepad', 'Headphone', 'Gamepad'];
const API_BASE_URL = 'http://119.59.102.161:3095/api';

export default function AppIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const isLoggedIn = params.logged_in === 'true';
  const currentUsername = params.username as string;
  const isAdmin = currentUsername === 'nueng'; 

  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wallet, setWallet] = useState(0);
  const [spins, setSpins] = useState(0);

  // Roulette Wheel States
  const [showRoulette, setShowRoulette] = useState(false);
  const [prizeText, setPrizeText] = useState('Press to Spin!');
  const [isSpinning, setIsSpinning] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const prizes = ["5% Discount", "10% Discount", "15% Discount", "No Prize", "iPhone 18 Pro Max"];

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) router.replace('/login');
      else { fetchProducts(); fetchUserData(); }
    }, [isLoggedIn])
  );

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${currentUsername}`);
      const data = await res.json();
      if (res.ok) {
        setWallet(Number(data.wallet) || 0);
        setSpins(Number(data.spins) || 0);
      }
    } catch { }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch { }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Do you want to log out of your account?');
      if (confirmLogout) router.replace('/login');
    } else {
      Alert.alert('Confirm Logout', 'Do you want to log out of your account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => router.replace('/login') },
      ]);
    }
  };

  const openForm = (product: any | null = null) => {
    if (product) router.push({ pathname: '/save', params: { id: String(product.id), logged_in: 'true', username: currentUsername } });
    else router.push({ pathname: '/save', params: { logged_in: 'true', username: currentUsername } });
  };

  const handleDelete = async (id: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Delete this product?');
      if (confirmed) executeDelete(id);
    } else {
      Alert.alert('Confirm Deletion', 'Delete this product?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => executeDelete(id) },
      ]);
    }
  };

  const executeDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
        Toast.show({ type: 'success', text1: 'Deleted successfully' });
      }
    } catch { Toast.show({ type: 'error', text1: 'Failed to delete' }); }
  };

  const handleAddToCart = async (id: number, productName: string, currentStock: number) => {
    if (currentStock <= 0) return Toast.show({ type: 'error', text1: 'Out of Stock' });
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, product_id: id })
      });
      if (res.ok) Toast.show({ type: 'success', text1: 'Added to Cart', text2: productName });
    } catch { Toast.show({ type: 'error', text1: 'Network Error' }); }
  };

  // Animated Wheel Function
  const playRoulette = () => {
    if (spins <= 0 || isSpinning) return;
    setIsSpinning(true);
    setSpins(prev => prev - 1);
    setPrizeText('Spinning...');

    const sliceAngle = 360 / prizes.length;
    const randomStopAngle = Math.floor(Math.random() * 360);
    const totalRotation = (360 * 5) + randomStopAngle; // หมุน 5 รอบ + องศาที่สุ่มได้

    Animated.timing(spinAnim, {
      toValue: totalRotation,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      setIsSpinning(false);
      
      const actualRotation = totalRotation % 360;
      const pointerAngle = (360 - actualRotation) % 360;
      const normalizedAngle = (pointerAngle + (sliceAngle / 2)) % 360;
      const winningIndex = Math.floor(normalizedAngle / sliceAngle);
      
      const finalPrize = prizes[winningIndex];
      setPrizeText(finalPrize);

      spinAnim.setValue(actualRotation);

      let discountVal = 0;
      if(finalPrize === "5% Discount") discountVal = 5;
      if(finalPrize === "10% Discount") discountVal = 10;
      if(finalPrize === "15% Discount") discountVal = 15;

      await fetch(`${API_BASE_URL}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, discount: discountVal })
      });
    });
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  if (!isLoggedIn) return <View style={styles.container} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>IT Store</Text>
          <Text style={styles.userRoleText} numberOfLines={1}>{isAdmin ? 'Admin' : 'User'}: {currentUsername}</Text>
        </View>
        <View style={styles.headerActions}>
          {!isAdmin && (
            <>
              <Pressable onPress={() => router.push({ pathname: '/cart', params: { username: currentUsername } })} style={[styles.btnNav, {backgroundColor: COLORS.btnAdd}]}>
                <Text style={styles.btnNavText}>Cart</Text>
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: '/wallet', params: { username: currentUsername } })} style={styles.btnNav}>
                <Text style={styles.btnNavText}>THB {wallet.toLocaleString()}</Text>
              </Pressable>
            </>
          )}
          {isAdmin && (
            <Pressable onPress={() => router.push({ pathname: '/dashboard', params: { logged_in: 'true', username: currentUsername } })} style={[styles.btnNav, {backgroundColor: COLORS.walletBg}]}>
              <Text style={styles.btnNavText}>Dashboard</Text>
            </Pressable>
          )}
          <Pressable onPress={handleLogout} style={styles.btnLogout}>
            <Text style={styles.logoutText}>Exit</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TextInput style={styles.searchInput} placeholder="Search products..." placeholderTextColor={COLORS.textLight} value={searchQuery} onChangeText={setSearchQuery} />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat} style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]} onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
          {isAdmin && (
            <Pressable style={styles.btnAddNew} onPress={() => openForm(null)}>
              <Text style={styles.btnAddNewText}>+ Add</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.grid}>
          {filteredProducts.map((item) => {
            const isOutOfStock = Number(item.quantity) <= 0;
            return (
              <View key={item.id} style={styles.card}>
                {item.image_filename ? <Image source={{ uri: item.image_filename }} style={styles.productImage} /> : <View style={styles.noImageView} />}
                <View style={styles.cardBody}>
                  <View style={styles.tagWrap}><Text style={styles.tagText}>{item.category || 'Mouse'}</Text></View>
                  <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
                  <Text style={styles.productPrice}>THB {item.price}</Text>
                  <Text style={[styles.productStock, isOutOfStock && { color: COLORS.btnDelete }]}>Stock: {item.quantity}</Text>

                  {isAdmin ? (
                    <View style={styles.actionRow}>
                      <Pressable style={[styles.btnAction, { backgroundColor: COLORS.btnEdit }]} onPress={() => openForm(item)}>
                        <Text style={styles.btnActionText}>Edit</Text>
                      </Pressable>
                      <Pressable style={[styles.btnAction, { backgroundColor: COLORS.btnDelete }]} onPress={() => handleDelete(item.id)}>
                        <Text style={styles.btnActionText}>Del</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={[styles.btnAction, { backgroundColor: isOutOfStock ? COLORS.textLight : COLORS.btnBuy, marginTop: 8 }]} onPress={() => handleAddToCart(item.id, item.product_name, Number(item.quantity))}>
                      <Text style={styles.btnActionText}>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {!isAdmin && (
        <Pressable style={[styles.fabSpin, { bottom: Math.max(insets.bottom + 20, 30) }]} onPress={() => setShowRoulette(true)}>
          <Text style={styles.fabSpinText}>Spin ({spins})</Text>
        </Pressable>
      )}

      <Modal visible={showRoulette} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: COLORS.rouletteBg, borderColor: '#e0a800', borderWidth: 3 }]}>
            <Text style={[styles.modalTitle, {color: '#000'}]}>Lucky Spin!</Text>
            <Text style={{marginBottom: 20, textAlign:'center', color: '#000', fontWeight: 'bold'}}>Spins Left: {spins}</Text>
            
            {/* กงล้อ Animated */}
            <View style={styles.wheelWrapper}>
              <View style={styles.pointerDown} />
              <Animated.View style={[styles.wheelContainer, { transform: [{ rotate: spinInterpolation }] }]}>
                {prizes.map((prize, idx) => {
                  const sliceAngle = 360 / prizes.length;
                  const textAngle = sliceAngle * idx;
                  const lineAngle = textAngle + (sliceAngle / 2);
                  return (
                    <React.Fragment key={idx}>
                      <View style={[styles.wheelSlice, { transform: [{ rotate: `${lineAngle}deg` }] }]}>
                        <View style={styles.sliceLine} />
                      </View>
                      <View style={[styles.wheelSlice, { transform: [{ rotate: `${textAngle}deg` }] }]}>
                        <Text style={styles.sliceText}>{prize}</Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </Animated.View>
            </View>

            <View style={styles.rouletteResultBox}>
              <Text style={styles.rouletteResultText}>{prizeText}</Text>
            </View>

            <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
              <Pressable style={[styles.btnSpin, {backgroundColor: isSpinning || spins <= 0 ? '#6c757d' : '#28a745', flex: 1}]} onPress={playRoulette} disabled={isSpinning || spins <= 0}>
                <Text style={styles.btnSpinText}>{isSpinning ? 'Spinning...' : 'Spin!'}</Text>
              </Pressable>
              <Pressable style={[styles.btnSpin, {backgroundColor: COLORS.btnDelete, flex: 1}]} onPress={() => { setShowRoulette(false); setPrizeText('Press to Spin!'); }} disabled={isSpinning}>
                <Text style={styles.btnSpinText}>Close</Text>
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
  header: { backgroundColor: COLORS.headerBg, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitleWrap: { flex: 1, paddingRight: 8 },
  headerTitle: { color: COLORS.textDark, fontSize: isSmallScreen ? 16 : 18, fontWeight: '800' },
  userRoleText: { color: COLORS.textLight, fontSize: isSmallScreen ? 11 : 12, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnNav: { backgroundColor: COLORS.walletBg, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, minWidth: 40, alignItems: 'center' },
  btnNavText: { color: COLORS.white, fontWeight: '700', fontSize: isSmallScreen ? 11 : 13 },
  btnLogout: { paddingHorizontal: 8, paddingVertical: 8 },
  logoutText: { color: COLORS.btnDelete, fontSize: isSmallScreen ? 13 : 14, fontWeight: '800' },
  scrollContent: { padding: 12, paddingBottom: 120 },
  searchInput: { height: 44, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 14 },
  catScroll: { flexDirection: 'row', marginBottom: 20, maxHeight: 40 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.white, justifyContent: 'center' },
  catBtnActive: { backgroundColor: COLORS.activeCat, borderColor: COLORS.activeCat },
  catText: { color: COLORS.textLight, fontWeight: '600', fontSize: isSmallScreen ? 11 : 13 },
  catTextActive: { color: COLORS.white, fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: isSmallScreen ? 18 : 20, fontWeight: '800', color: COLORS.textDark },
  btnAddNew: { backgroundColor: COLORS.btnAdd, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  btnAddNewText: { color: COLORS.white, fontWeight: '700', fontSize: isSmallScreen ? 11 : 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  productImage: { width: '100%', aspectRatio: 1 },
  noImageView: { width: '100%', aspectRatio: 1, backgroundColor: '#E9ECEF' },
  cardBody: { padding: 10 },
  tagWrap: { backgroundColor: '#E9ECEF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight },
  productName: { fontSize: isSmallScreen ? 13 : 14, fontWeight: '800', marginBottom: 2, color: COLORS.textDark },
  productPrice: { fontSize: isSmallScreen ? 12 : 13, color: COLORS.btnConfirm, fontWeight: '800', marginBottom: 2 },
  productStock: { fontSize: isSmallScreen ? 11 : 12, color: COLORS.textLight, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 4 },
  btnAction: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnActionText: { color: COLORS.white, fontWeight: '700', fontSize: isSmallScreen ? 11 : 12 },
  fabSpin: { position: 'absolute', right: 16, backgroundColor: COLORS.rouletteBg, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, borderWidth: 2, borderColor: '#e0a800', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6, zIndex: 999 },
  fabSpinText: { color: '#000', fontWeight: '900', fontSize: isSmallScreen ? 13 : 15 },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', width: '100%', maxWidth: 360, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  
  // Wheel Styles
  wheelWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 10, position: 'relative' },
  pointerDown: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#DC3545', position: 'absolute', top: -10, zIndex: 10 },
  wheelContainer: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFF', borderWidth: 4, borderColor: '#DEE2E6', overflow: 'hidden', position: 'relative' },
  wheelSlice: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-start' },
  sliceLine: { width: 2, height: '50%', backgroundColor: '#DEE2E6' },
  sliceText: { marginTop: 15, fontSize: 12, fontWeight: '800', color: '#212529', textAlign: 'center', paddingHorizontal: 10 },

  rouletteResultBox: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: '#DEE2E6' },
  rouletteResultText: { fontSize: 16, fontWeight: 'bold', color: COLORS.btnDelete, textAlign: 'center' },
  btnSpin: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnSpinText: { color: COLORS.white, fontWeight: '800', fontSize: 14 }
});