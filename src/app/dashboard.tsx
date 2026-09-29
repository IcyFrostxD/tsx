import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const COLORS = {
  primaryBg: '#F8F9FA',
  headerBg: '#FFFFFF',
  white: '#FFFFFF',
  textDark: '#212529',
  textLight: '#6C757D',
  border: '#DEE2E6',
  cardBg1: '#0D6EFD', // Blue
  cardBg2: '#FD7E14', // Orange
  cardBg3: '#198754'  // Green
};

const API_BASE_URL = 'http://119.59.102.161:3095/api/products';

export default function DashboardInsights() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  const calculateInsights = (data: any[]) => {
    let itemsCount = data.length;
    let stockSum = 0;
    let valueSum = 0;

    data.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      stockSum += qty;
      valueSum += (qty * price);
    });

    setTotalProducts(itemsCount);
    setTotalStock(stockSum);
    setTotalValue(valueSum);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchProducts = async () => {
        try {
          const res = await fetch(API_BASE_URL);
          const data = await res.json();
          if (Array.isArray(data)) {
            calculateInsights(data);
          }
        } catch (error) {
          console.error("Dashboard Fetch Error");
        }
      };
      fetchProducts();
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Dashboard</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Overview Insights</Text>
        <Text style={styles.subtitle}>Real-time inventory valuation</Text>

        <View style={[styles.insightCard, { backgroundColor: COLORS.cardBg1 }]}>
          <Text style={styles.cardLabel}>Unique Products</Text>
          <Text style={styles.cardValue}>{totalProducts} Mouses</Text>
        </View>

        <View style={[styles.insightCard, { backgroundColor: COLORS.cardBg2 }]}>
          <Text style={styles.cardLabel}>Total Stock Items</Text>
          <Text style={styles.cardValue}>{totalStock} Units</Text>
        </View>

        <View style={[styles.insightCard, { backgroundColor: COLORS.cardBg3 }]}>
          <Text style={styles.cardLabel}>Total Inventory Value</Text>
          <Text style={styles.cardValue}>฿{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { backgroundColor: COLORS.headerBg, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { color: COLORS.textDark, fontSize: isSmallScreen ? 18 : 22, fontWeight: '800' },
  backText: { color: COLORS.textLight, fontSize: 16, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: isSmallScreen ? 24 : 28, fontWeight: '800', color: COLORS.textDark },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 24, marginTop: 4 },
  insightCard: { padding: 24, borderRadius: 16, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  cardValue: { color: COLORS.white, fontSize: 32, fontWeight: '800' }
});