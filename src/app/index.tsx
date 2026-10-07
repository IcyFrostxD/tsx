import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const COLORS = {
  primaryBg: '#F8F9FA', headerBg: '#FFFFFF', white: '#FFFFFF',
  textDark: '#0F172A', textLight: '#64748B',
  btnEdit: '#F59E0B', btnDelete: '#EF4444', btnAdd: '#0F172A', btnBuy: '#10B981',
  border: '#E2E8F0', rouletteBg: '#ffc107', activeCat: '#0F172A'
};

const CATEGORIES = ['All', 'Mouse', 'Monitor', 'Keyboard', 'Mousepad', 'Headphone', 'Gamepad'];
const API_BASE_URL = 'http://119.59.102.161:3095/api';

const calculateGlobalAIMatch = (productCategory: string, globalStats: Record<string, number>) => {
  const scores = Object.values(globalStats);
  if (scores.length === 0) return 30; 
  
  const maxScore = Math.max(...scores);
  if (maxScore === 0) return 30;

  const catScore = globalStats[productCategory] || 0;
  let percentage = Math.round((catScore / maxScore) * 100);
  return Math.max(percentage, 15);
};

const PRIZES_DATA = [
  { name: "5% Discount", angle: 190 },       
  { name: "No Prize", angle: 130 },          
  { name: "10% Discount", angle: 20 },       
  { name: "15% Discount", angle: 15 },       
  { name: "iPhone 18 Pro Max", angle: 5 }   
];

let currentA = 0;
const wheelSlices = PRIZES_DATA.map(p => {
  const start = currentA;
  const end = currentA + p.angle;
  const textAngle = currentA + (p.angle / 2);
  const lineAngle = end;
  currentA = end;
  return { ...p, start, end, textAngle, lineAngle };
});

export default function AppIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const isLoggedIn = params.logged_in === 'true';
  const currentUsername = params.username as string;
  const isAdmin = currentUsername === 'nueng'; 

  const [products, setProducts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [wallet, setWallet] = useState(0);
  const [spins, setSpins] = useState(0);
  const [userRank, setUserRank] = useState('BRONZE');
  const [globalAIStats, setGlobalAIStats] = useState<Record<string, number>>({});

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [prizeText, setPrizeText] = useState('Press to Spin!');
  const [isSpinning, setIsSpinning] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) router.replace('/login');
      else { 
        fetchProducts(); 
        fetchUserData(); 
        fetchRecommendations();
        fetchGlobalAIStats();
      }
    }, [isLoggedIn])
  );

  const fetchGlobalAIStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/global-ai-stats`);
      const data = await res.json();
      setGlobalAIStats(data);
    } catch { }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${currentUsername}`);
      const data = await res.json();
      if (res.ok) {
        setWallet(Number(data.wallet) || 0);
        setSpins(Number(data.spins) || 0);
        setUserRank(data.rank || 'BRONZE');
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

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/${currentUsername}`);
      const data = await res.json();
      if (data.recommendations) setRecommendations(data.recommendations);
    } catch { }
  };

  const logInteraction = async (productId: number, actionType: string) => {
    try {
      await fetch(`${API_BASE_URL}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, product_id: productId, action_type: actionType })
      });
      fetchGlobalAIStats(); 
    } catch { }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Do you want to log out?');
      if (confirmLogout) router.replace('/login');
    } else {
      Alert.alert('Confirm Logout', 'Do you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => router.replace('/login') },
      ]);
    }
  };

  const openForm = (product: any | null = null) => {
    if (product) {
      router.push({ 
        pathname: '/save', 
        params: { 
          id: String(product.id), 
          product_name: product.product_name || '',
          price: String(product.price || 0),
          quantity: String(product.quantity || 1),
          snnumber: product.snnumber || '',
          detail: product.detail || '',
          image_filename: product.image_filename || '',
          category: product.category || 'Mouse',
          logged_in: 'true', username: currentUsername 
        } 
      });
    } else {
      router.push({ pathname: '/save', params: { logged_in: 'true', username: currentUsername } });
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

  const handleAddToCart = async (id: number, productName: string, currentStock: number, category: string) => {
    if (currentStock <= 0) return Toast.show({ type: 'error', text1: 'Out of Stock' });
    logInteraction(id, 'cart'); 
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, product_id: id })
      });
      if (res.ok) Toast.show({ type: 'success', text1: 'Added to Cart', text2: productName });
    } catch { Toast.show({ type: 'error', text1: 'Network Error' }); }
  };

  const playRoulette = () => {
    if (spins <= 0 || isSpinning) return;
    setIsSpinning(true);
    setSpins(prev => prev - 1);
    setPrizeText('Spinning...');

    let r = Math.random() * 360;
    let winningSlice = wheelSlices[0];
    
    for (let i = 0; i < wheelSlices.length; i++) {
      if (r >= wheelSlices[i].start && r < wheelSlices[i].end) {
        winningSlice = wheelSlices[i];
        break;
      }
    }

    const PADDING = 1.5; 
    let safeStart = winningSlice.start + PADDING;
    let safeEnd = winningSlice.end - PADDING;
    if (safeEnd <= safeStart) {
      safeStart = winningSlice.start + 0.2;
      safeEnd = winningSlice.end - 0.2;
    }
    if (r < safeStart) r = safeStart;
    if (r > safeEnd) r = safeEnd;

    const actualRotation = (360 - r) % 360;
    const totalRotation = (360 * 5) + actualRotation;

    Animated.timing(spinAnim, {
      toValue: totalRotation,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      setIsSpinning(false);
      setPrizeText(winningSlice.name);
      spinAnim.setValue(actualRotation);

      let discountVal = 0;
      if(winningSlice.name === "5% Discount") discountVal = 5;
      if(winningSlice.name === "10% Discount") discountVal = 10;
      if(winningSlice.name === "15% Discount") discountVal = 15;

      await fetch(`${API_BASE_URL}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, discount: discountVal })
      });
    });
  };

  const baseFilteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedFilteredProducts = baseFilteredProducts
    .map(product => {
      const aiScore = calculateGlobalAIMatch(product.category || 'Mouse', globalAIStats);
      return { ...product, aiScore };
    })
    .sort((a, b) => b.aiScore - a.aiScore);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  if (!isLoggedIn) return <View style={styles.container} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      {/* Header จัดวางเลย์เอาต์ใหม่ ให้โลโก้อยู่ซ้าย และกลุ่ม Profile/Wallet/Exit ชิดขวาอย่างลงตัว */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>IT Store</Text>
          <Text style={styles.userRoleText} numberOfLines={1}>{isAdmin ? 'Admin' : 'User'}: {currentUsername}</Text>
        </View>
        
        <View style={styles.headerRightGroup}>
          {!isAdmin && (
            <>
              <Pressable onPress={() => router.push({ pathname: '/customize', params: { username: currentUsername } })} style={styles.btnNavSolid}>
                <Text style={styles.btnNavSolidText}>Profile</Text>
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: '/wallet', params: { username: currentUsername } })} style={styles.btnNavGold}>
                <Text style={styles.btnNavGoldText}>฿ {wallet.toLocaleString()}</Text>
              </Pressable>
            </>
          )}

          {isAdmin && (
            <Pressable onPress={() => router.push({ pathname: '/dashboard', params: { logged_in: 'true', username: currentUsername } })} style={styles.btnNavSolid}>
              <Text style={styles.btnNavSolidText}>Dashboard</Text>
            </Pressable>
          )}

          <Pressable onPress={handleLogout} style={styles.btnLogout}>
            <Text style={styles.logoutText}>Exit</Text>
          </Pressable>
        </View>
      </View>

      {!isAdmin && (
        <View style={styles.rankBanner}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => router.push({ pathname: '/cart', params: { username: currentUsername } })} style={styles.btnBannerCart}>
               <Text style={styles.btnBannerCartText}>View Cart</Text>
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/claim_details', params: { username: currentUsername } })} style={styles.btnBannerClaim}>
               <Text style={styles.btnBannerClaimText}>Claim</Text>
            </Pressable>
          </View>
          <Text style={styles.rankBannerText}>Rank: {userRank}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TextInput style={styles.searchInput} placeholder="Search products..." placeholderTextColor={COLORS.textLight} value={searchQuery} onChangeText={setSearchQuery} />
        
        <Pressable style={styles.catDropdownBtn} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.catDropdownText}>Category: {selectedCategory} ▼</Text>
        </Pressable>

        {!isAdmin && recommendations.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recScrollContent}>
              {recommendations.map(item => {
                const isRecOutOfStock = Number(item.quantity) <= 0;
                const aiScore = calculateGlobalAIMatch(item.category || 'Mouse', globalAIStats);
                
                return (
                  <View key={item.id} style={styles.recCard}>
                    <View style={{ position: 'relative' }}>
                      {item.image_filename ? <Image source={{ uri: item.image_filename }} style={styles.recImage} /> : <View style={styles.recNoImage} />}
                      <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: aiScore > 75 ? '#10B981' : '#6C757D', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>Match {aiScore}%</Text>
                      </View>
                    </View>
                    <View style={styles.cardBody}>
                      <View>
                        <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
                        <Text style={styles.productPrice}>THB {item.price}</Text>
                      </View>
                      <Pressable 
                        style={[styles.btnAction, { marginTop: 8, backgroundColor: isRecOutOfStock ? '#E2E8F0' : COLORS.btnBuy }]} 
                        onPress={() => handleAddToCart(item.id, item.product_name, Number(item.quantity), item.category || 'Mouse')}
                        disabled={isRecOutOfStock}
                      >
                        <Text style={[styles.btnActionText, isRecOutOfStock && { color: '#94A3B8' }]}>
                          {isRecOutOfStock ? 'Sold Out' : 'Add to Cart'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
          {isAdmin && (
            <Pressable style={styles.btnAddNew} onPress={() => openForm(null)}>
              <Text style={styles.btnAddNewText}>+ Add New</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.grid}>
          {sortedFilteredProducts.map((item) => {
            const isOutOfStock = Number(item.quantity) <= 0;

            return (
              <View key={item.id} style={styles.card}>
                <View style={{ position: 'relative' }}>
                  {item.image_filename ? <Image source={{ uri: item.image_filename }} style={styles.productImage} /> : <View style={styles.noImageView} />}
                  {!isAdmin && (
                    <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: item.aiScore > 75 ? '#10B981' : '#6C757D', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>Match {item.aiScore}%</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View>
                    <View style={styles.tagWrap}><Text style={styles.tagText}>{item.category || 'Mouse'}</Text></View>
                    <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
                    <Text style={styles.productPrice}>THB {item.price}</Text>
                    <Text style={[styles.productStock, isOutOfStock && { color: COLORS.btnDelete }]}>Stock: {item.quantity}</Text>
                  </View>

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
                    <Pressable style={[styles.btnAction, { backgroundColor: isOutOfStock ? '#E2E8F0' : COLORS.btnBuy, marginTop: 8 }]} onPress={() => handleAddToCart(item.id, item.product_name, Number(item.quantity), item.category || 'Mouse')} disabled={isOutOfStock}>
                      <Text style={[styles.btnActionText, isOutOfStock && {color: '#94A3B8'}]}>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</Text>
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

      <Modal visible={showCategoryModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.catModalBox}>
            <Text style={[styles.modalTitle, {color: '#0F172A'}]}>Select Category</Text>
            {CATEGORIES.map(cat => (
              <Pressable key={cat} style={[styles.catOptionBtn, selectedCategory === cat && styles.catOptionBtnActive]} onPress={() => { setSelectedCategory(cat); setShowCategoryModal(false); }}>
                <Text style={[styles.catOptionText, selectedCategory === cat && styles.catOptionTextActive]}>{cat}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.btnSpin, {backgroundColor: COLORS.textDark, marginTop: 15}]} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.btnSpinText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showRoulette} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 2 }]}>
            <Text style={[styles.modalTitle, {color: '#92400E'}]}>✨ Lucky Spin ✨</Text>
            <Text style={{marginBottom: 20, textAlign:'center', color: '#B45309', fontWeight: 'bold'}}>Spins Left: {spins}</Text>
            
            <View style={styles.wheelWrapper}>
              <View style={styles.pointerDown} />
              <Animated.View style={[styles.wheelContainer, { transform: [{ rotate: spinInterpolation }] }]}>
                {wheelSlices.map((slice, idx) => (
                  <React.Fragment key={idx}>
                    <View style={[styles.wheelSlice, { transform: [{ rotate: `${slice.lineAngle}deg` }] }]}><View style={styles.sliceLine} /></View>
                    <View style={[styles.wheelSlice, { transform: [{ rotate: `${slice.textAngle}deg` }] }]}>
                      
                      {slice.name === "iPhone 18 Pro Max" ? (
                        <View style={{ marginTop: 14, alignItems: 'center' }}>
                          <Image 
                            source={{ uri: 'https://images.unsplash.com/photo-1592899677974-c46681fa5336?q=80&w=200&auto=format&fit=crop' }} 
                            style={{ width: 14, height: 26, borderRadius: 2, resizeMode: 'cover' }} 
                          />
                        </View>
                      ) : (
                        <Text style={[
                          styles.sliceText, 
                          slice.name === "15% Discount" && { fontSize: 8, marginTop: 22 },
                          slice.name === "10% Discount" && { fontSize: 10, marginTop: 20 }
                        ]}>
                          {slice.name}
                        </Text>
                      )}

                    </View>
                  </React.Fragment>
                ))}
              </Animated.View>
            </View>

            <View style={styles.rouletteResultBox}><Text style={styles.rouletteResultText}>{prizeText}</Text></View>
            
            <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
              <Pressable style={[styles.btnSpin, {backgroundColor: isSpinning || spins <= 0 ? '#D1D5DB' : '#10B981', flex: 1}]} onPress={playRoulette} disabled={isSpinning || spins <= 0}>
                <Text style={styles.btnSpinText}>{isSpinning ? 'Spinning...' : 'Spin!'}</Text>
              </Pressable>
              <Pressable style={[styles.btnSpin, {backgroundColor: '#EF4444', flex: 1}]} onPress={() => { setShowRoulette(false); setPrizeText('Press to Spin!'); }} disabled={isSpinning}>
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
  
  /* ปรับแต่ง Header ใหม่ จัดวาง Flexbox ให้ซ้ายสุดเป็นโลโก้ ขวาสุดเป็นกลุ่มปุ่มโปรไฟล์/เงิน/ออก */
  header: { backgroundColor: COLORS.headerBg, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitleWrap: { flex: 1 },
  headerTitle: { color: COLORS.textDark, fontSize: isSmallScreen ? 18 : 20, fontWeight: '900', letterSpacing: 0.5 },
  userRoleText: { color: COLORS.textLight, fontSize: isSmallScreen ? 11 : 12, fontWeight: '600', marginTop: 2 },
  
  /* กลุ่มปุ่มฝั่งขวา */
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  btnNavSolid: { backgroundColor: COLORS.textDark, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  btnNavSolidText: { color: COLORS.white, fontWeight: '700', fontSize: isSmallScreen ? 11 : 12 },
  
  btnNavGold: { backgroundColor: '#D97706', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  btnNavGoldText: { color: COLORS.white, fontWeight: '800', fontSize: isSmallScreen ? 11 : 12 },
  
  btnLogout: { paddingHorizontal: 8, paddingVertical: 8 },
  logoutText: { color: COLORS.btnDelete, fontSize: isSmallScreen ? 13 : 14, fontWeight: '800' },
  
  rankBanner: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: COLORS.border },
  rankBannerText: { fontWeight: '800', fontSize: 13, color: '#94A3B8' },
  
  btnBannerCart: { backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center', flexDirection: 'row' },
  btnBannerCartText: { color: COLORS.white, fontWeight: '700', fontSize: isSmallScreen ? 11 : 12 },

  btnBannerClaim: { backgroundColor: '#EF4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center', flexDirection: 'row' },
  btnBannerClaimText: { color: COLORS.white, fontWeight: '700', fontSize: isSmallScreen ? 11 : 12 },

  scrollContent: { padding: 16, paddingBottom: 120 },
  sectionContainer: { marginBottom: 24 },
  
  searchInput: { height: 44, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 14 },
  
  catDropdownBtn: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24, alignItems: 'center' },
  catDropdownText: { color: COLORS.textDark, fontWeight: '700', fontSize: 14 },
  catModalBox: { backgroundColor: COLORS.white, width: '80%', maxWidth: 320, padding: 20, borderRadius: 16 },
  catOptionBtn: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'center' },
  catOptionBtnActive: { backgroundColor: COLORS.activeCat, borderRadius: 8, borderBottomWidth: 0 },
  catOptionText: { color: COLORS.textDark, fontSize: 14, fontWeight: '600' },
  catOptionTextActive: { color: COLORS.white, fontWeight: '700' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: isSmallScreen ? 18 : 20, fontWeight: '900', color: COLORS.textDark, marginBottom: 12, letterSpacing: 0.5 },
  btnAddNew: { backgroundColor: COLORS.textDark, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  btnAddNewText: { color: COLORS.white, fontWeight: '700', fontSize: isSmallScreen ? 11 : 12 },
  
  recScrollContent: { gap: 12, paddingRight: 16 },
  recCard: { width: 150, height: 240, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', flexDirection: 'column' },
  recImage: { width: '100%', height: 110, resizeMode: 'cover' },
  recNoImage: { width: '100%', height: 110, backgroundColor: '#F1F5F9' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  card: { width: '48%', backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', flexDirection: 'column' },
  productImage: { width: '100%', aspectRatio: 1 },
  noImageView: { width: '100%', aspectRatio: 1, backgroundColor: '#F1F5F9' },
  cardBody: { padding: 10, flex: 1, justifyContent: 'space-between' },
  tagWrap: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  tagText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight },
  productName: { fontSize: isSmallScreen ? 13 : 14, fontWeight: '800', marginBottom: 4, color: COLORS.textDark },
  productPrice: { fontSize: isSmallScreen ? 12 : 13, color: '#10B981', fontWeight: '800', marginBottom: 4 },
  productStock: { fontSize: isSmallScreen ? 11 : 12, color: COLORS.textLight, fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  btnAction: { paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnActionText: { color: COLORS.white, fontWeight: '800', fontSize: isSmallScreen ? 11 : 12 },
  
  fabSpin: { position: 'absolute', right: 16, backgroundColor: '#FDE68A', paddingVertical: 14, paddingHorizontal: 22, borderRadius: 30, borderWidth: 2, borderColor: '#F59E0B', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 6, zIndex: 999 },
  fabSpinText: { color: '#92400E', fontWeight: '900', fontSize: isSmallScreen ? 13 : 15 },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', width: '100%', maxWidth: 360, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  
  wheelWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 10, position: 'relative' },
  pointerDown: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#EF4444', position: 'absolute', top: -10, zIndex: 10 },
  wheelContainer: { width: 280, height: 280, borderRadius: 140, backgroundColor: '#FFFBEB', borderWidth: 6, borderColor: '#FDE68A', overflow: 'hidden', position: 'relative' },
  wheelSlice: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-start' },
  sliceLine: { width: 2, height: '50%', backgroundColor: '#FDE68A' },
  sliceText: { marginTop: 20, fontSize: 14, fontWeight: '800', color: '#92400E', textAlign: 'center', paddingHorizontal: 10 },
  
  rouletteResultBox: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 80, borderWidth: 1, borderColor: '#FDE68A' },
  rouletteResultText: { fontSize: 18, fontWeight: '900', color: '#D97706', textAlign: 'center' },
  btnSpin: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnSpinText: { color: COLORS.white, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }
});