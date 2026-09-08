import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const COLORS = {
  primaryBg: '#F8F9FA',
  headerBg: '#FFFFFF',
  white: '#FFFFFF',
  textDark: '#212529',
  textLight: '#6C757D',
  btnEdit: '#FD7E14',
  btnDelete: '#DC3545',
  btnAdd: '#0D6EFD',
  btnBuy: '#198754',
  border: '#DEE2E6',
};

const API_BASE_URL = 'http://119.59.102.161:3095/api/products';

interface ProductItem {
  id: number;
  product_name: string;
  price: number | string;
  quantity: number | string;
  image_filename?: string;
  snnumber?: string;
  detail?: string;
}

export default function AppIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const isLoggedIn = params.logged_in === 'true';
  const currentUsername = params.username as string;
  const isAdmin = currentUsername === 'nueng';

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        router.replace('/login');
      } else {
        fetchProducts();
      }
    }, [isLoggedIn])
  );

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_BASE_URL);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
      else setProducts([]);
    } catch {
      setProducts([]);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this product?');
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
      const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch {
      if (Platform.OS === 'web') alert('Failed to delete product.');
    }
  };

  // ฟังก์ชันสั่งซื้อสินค้า ตัดสต็อกผ่าน API
  const handleBuy = async (id: number, productName: string, currentStock: number | string) => {
    if (Number(currentStock) <= 0) {
      if (Platform.OS === 'web') alert('This product is out of stock!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/${id}/buy`, {
        method: 'PUT',
      });
      const data = await res.json();

      if (res.ok) {
        if (Platform.OS === 'web') {
          alert(`Successfully ordered: ${productName}!`);
        } else {
          Alert.alert('Success', `Successfully ordered: ${productName}!`);
        }
        fetchProducts(); // โหลดข้อมูลสต็อกล่าสุดใหม่ทันที
      } else {
        if (Platform.OS === 'web') alert(data.error || 'Failed to purchase');
      }
    } catch {
      if (Platform.OS === 'web') alert('Network connection failed');
    }
  };

  const openForm = (product: ProductItem | null = null) => {
    if (product) {
      router.push({
        pathname: '/save',
        params: {
          id: String(product.id),
          logged_in: 'true',
          username: currentUsername,
        },
      });
    } else {
      router.push({ 
        pathname: '/save', 
        params: { logged_in: 'true', username: currentUsername } 
      });
    }
  };

  if (!isLoggedIn) {
    return <View style={styles.container} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Game Store</Text>
          <Text style={styles.userRoleText}>Role: {isAdmin ? 'Admin (nueng)' : `User (${currentUsername})`}</Text>
        </View>
        <Pressable onPress={() => router.replace('/login')}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Products Listing</Text>
          {isAdmin && (
            <Pressable style={styles.btnAdd} onPress={() => openForm(null)}>
              <Text style={styles.btnAddText}>+ Add</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.grid}>
          {filteredProducts.map((item) => {
            const isOutOfStock = Number(item.quantity) <= 0;
            return (
              <View key={item.id} style={styles.card}>
                {item.image_filename ? (
                  <Image source={{ uri: item.image_filename }} style={styles.productImage} resizeMode="cover" />
                ) : (
                  <View style={styles.noImageView}>
                    <Text style={styles.noImageText}>No Image</Text>
                  </View>
                )}

                <View style={styles.cardBody}>
                  <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>
                  <Text style={styles.productDetails} numberOfLines={1}>S/N: {item.snnumber || '-'}</Text>
                  <Text style={styles.productDetails} numberOfLines={1}>Price: ฿{item.price}</Text>
                  <Text style={[styles.productDetails, isOutOfStock && { color: COLORS.btnDelete, fontWeight: '700' }]} numberOfLines={1}>
                    Stock: {item.quantity}
                  </Text>

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
                    <View style={styles.actionRow}>
                      <Pressable 
                        style={[styles.btnAction, { backgroundColor: isOutOfStock ? COLORS.textLight : COLORS.btnBuy, flex: 1 }]} 
                        onPress={() => handleBuy(item.id, item.product_name, item.quantity)}
                      >
                        <Text style={styles.btnActionText}>{isOutOfStock ? 'Sold Out' : 'Buy'}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { backgroundColor: COLORS.headerBg, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { color: COLORS.textDark, fontSize: isSmallScreen ? 18 : 22, fontWeight: '800' },
  userRoleText: { color: COLORS.textLight, fontSize: 12, fontWeight: '600', marginTop: 2 },
  logoutText: { color: COLORS.btnDelete, fontSize: 16, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  searchInput: { height: 50, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: COLORS.textDark, marginBottom: 20 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: isSmallScreen ? 22 : 26, fontWeight: '800', color: COLORS.textDark },
  btnAdd: { backgroundColor: COLORS.btnAdd, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  btnAddText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  productImage: { width: '100%', height: 120, backgroundColor: '#E9ECEF' },
  noImageView: { width: '100%', height: 120, backgroundColor: '#E9ECEF', alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: COLORS.textLight, fontWeight: '600', fontSize: 12 },
  cardBody: { padding: 14 },
  productName: { fontSize: 16, fontWeight: '800', marginBottom: 6, color: COLORS.textDark },
  productDetails: { fontSize: 14, color: COLORS.textLight, marginBottom: 4, fontWeight: '500' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  btnAction: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnActionText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});