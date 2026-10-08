import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const API_BASE_URL = 'http://119.59.102.161:3095/api';

const COLORS = {
  primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#0F172A', textLight: '#64748B',
  border: '#E2E8F0', btnDownload: '#10B981', btnCancel: '#DC3545', btnSecondary: '#64748B'
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUsername = params.username as string;

  const [orders, setOrders] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/history/${currentUsername}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.log('Error fetching history');
    }
  };

  const printDocument = (contentHTML: string) => {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(contentHTML);
        printWindow.document.close();
      }
    }
  };

  const downloadTaxInvoice = (order: any) => {
    Toast.show({ type: 'info', text1: 'Preparing Invoice', text2: 'Please select "Save as PDF" in print menu.' });
    const safeItems = order.items || [];
    const subtotal = order.subtotal || order.total || 0;
    const discountAmount = order.discountAmount || 0;
    const discountPercent = order.discountPercent || 0;
    const total = order.total || 0;

    const content = `
      <html>
      <head>
        <title>Invoice - ${order.order_id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; padding: 20px; }
          .container { width: 100%; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 26px; color: #0F172A; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-col { width: 48%; }
          .info-col p { margin: 4px 0; font-size: 14px; }
          .section-title { border-top: 2px solid #0F172A; padding-top: 15px; margin-bottom: 15px; font-size: 16px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
          th { background-color: #F8FAFC; color: #475569; }
          .total-section { width: 100%; max-width: 350px; margin-left: auto; border-top: 2px solid #E2E8F0; padding-top: 20px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .grand-total { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #0F172A; font-size: 18px; font-weight: bold; }
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
              <p><strong>Billed To:</strong><br/>${order.fullName}</p>
              <p><strong>Phone:</strong> ${order.phone}</p>
              <p><strong>Address:</strong><br/>${order.address}</p>
            </div>
            <div class="info-col" style="text-align: right;">
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Date:</strong> ${order.date}</p>
            </div>
          </div>
          <div class="section-title">Purchased Items</div>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Item Name</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${safeItems.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product_name}</td>
                  <td style="text-align: center;">${item.cart_qty}</td>
                  <td style="text-align: right;">${Number(item.price).toLocaleString()}</td>
                  <td style="text-align: right;">${(Number(item.price) * Number(item.cart_qty)).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>THB ${subtotal.toLocaleString()}</span>
            </div>
            ${discountAmount > 0 ? `
            <div class="total-row" style="color: #10B981;">
              <span>Discount (${discountPercent}%):</span>
              <span>- THB ${discountAmount.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="grand-total">
              <span>Total Price:</span>
              <span>THB ${total.toLocaleString()}</span>
            </div>
          </div>
          <div class="footer">
            <p>This document is generated automatically.</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); } };
        </script>
      </body>
      </html>
    `;
    printDocument(content);
  };

  const downloadClaimForm = (order: any) => {
    Toast.show({ type: 'info', text1: 'Preparing Claim Form', text2: 'Please select "Save as PDF" in print menu.' });
    const safeItems = order.items || [];
    
    // โค้ดดึงรูปมาโชว์ใน PDF หน้า History ถ้ามีรูป
    const imageElement = order.claim_image 
      ? `<div style="margin-top: 20px; text-align: center;">
           <p style="text-align: left; font-size: 14px; font-weight: bold; color: #0F172A; margin-bottom: 10px;">Attached Image:</p>
           <img src="${order.claim_image}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #CBD5E1;" />
         </div>`
      : '';

    const content = `
      <html>
      <head>
        <title>Claim Form - ${order.order_id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; padding: 20px; }
          .container { width: 100%; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 24px; color: #0F172A; }
          .info-sec p { margin: 8px 0; font-size: 14px; }
          .desc-box { margin-top: 20px; padding: 15px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; }
          .desc-title { font-size: 14px; font-weight: bold; color: #0F172A; margin: 0; }
          .desc-text { margin: 8px 0 0 0; font-size: 14px; color: #475569; }
          .section-title { border-top: 2px solid #0F172A; padding-top: 15px; margin-top: 30px; margin-bottom: 15px; font-size: 16px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
          th { background-color: #F8FAFC; color: #475569; }
          .footer { margin-top: 50px; text-align: center; color: #94A3B8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>WARRANTY CLAIM FORM</h1>
            <p>1IT Store</p>
          </div>
          <div class="info-sec">
            <p><strong>Customer Name:</strong> ${order.fullName}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Date of Purchase:</strong> ${order.date}</p>
          </div>
          
          <div class="section-title">Claim Details</div>
          <div class="desc-box">
            <p class="desc-title">Issue Description:</p>
            <p class="desc-text">${order.claim_detail || 'No description provided.'}</p>
          </div>
          
          ${imageElement}

          <div class="section-title">Items Included in Order</div>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Product Name</th>
                <th style="text-align: center;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${safeItems.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product_name}</td>
                  <td style="text-align: center;">${item.cart_qty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>This claim form is generated automatically based on your submission.</p>
          </div>
        </div>
        <script>
          window.onload = function() { 
            setTimeout(function() {
              window.print(); 
              window.onafterprint = function(){ window.close(); } 
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printDocument(content);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Purchase History</Text>
        <Pressable onPress={() => { router.replace({ pathname: '/customize', params: { username: currentUsername } }); }}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {orders.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: COLORS.textLight, fontSize: 16 }}>No purchase history found.</Text>
          </View>
        ) : (
          orders.map((order, idx) => {
            const itemsList = order.items || [];
            const orderTotal = order.total || 0;
            return (
            <View key={idx} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order: {order.order_id}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <View style={[styles.statusBadge, order.is_claimed ? { backgroundColor: '#FEF2F2' } : {}]}>
                  <Text style={[styles.statusBadgeText, order.is_claimed ? { color: '#DC2626' } : {}]}>
                    {order.is_claimed ? 'Claimed' : 'Completed'}
                  </Text>
                </View>
              </View>

              <View style={styles.orderItemList}>
                <Text style={styles.itemCountText}>{itemsList.length} Items Purchased</Text>
              </View>

              <View style={styles.orderFooter}>
                <View>
                  <Text style={styles.orderTotalLabel}>Total Amount</Text>
                  <Text style={styles.orderTotalValue}>THB {orderTotal.toLocaleString()}</Text>
                </View>
                
                <View style={styles.btnActionContainer}>
                  <Pressable style={styles.btnDownload} onPress={() => downloadTaxInvoice(order)}>
                    <Text style={styles.btnDownloadText}>Download Invoice</Text>
                  </Pressable>
                  
                  {order.is_claimed && (
                    <Pressable style={[styles.btnDownload, { backgroundColor: COLORS.btnSecondary, marginTop: 8 }]} onPress={() => downloadClaimForm(order)}>
                      <Text style={styles.btnDownloadText}>Download Claim Form</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          )})
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { backgroundColor: COLORS.white, padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  backText: { fontSize: 16, color: COLORS.btnCancel, fontWeight: '700' },
  scrollContent: { padding: 16 },
  orderCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderColor: '#F1F5F9', paddingBottom: 15, marginBottom: 15 },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  orderDate: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { color: '#059669', fontSize: 12, fontWeight: '800' },
  orderItemList: { marginBottom: 15 },
  itemCountText: { fontSize: 14, color: COLORS.textDark, fontWeight: '600' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
  orderTotalLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  orderTotalValue: { fontSize: 18, fontWeight: '900', color: '#0D6EFD' },
  btnActionContainer: { alignItems: 'flex-end' },
  btnDownload: { backgroundColor: '#0F172A', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  btnDownloadText: { color: COLORS.white, fontSize: 12, fontWeight: '800' }
});