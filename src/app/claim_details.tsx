import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const API_BASE_URL = 'http://119.59.102.161:3095/api';

const COLORS = {
  primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#0F172A', textLight: '#64748B',
  border: '#E2E8F0', btnSubmit: '#EF4444', btnCancel: '#64748B', btnPrimary: '#0D6EFD',
  btnUpload: '#E2E8F0', iconUpload: '#64748B'
};

export default function ClaimDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUsername = params.username as string;

  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimSuccessData, setClaimSuccessData] = useState<any>(null);

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user-orders/${currentUsername}`);
      if (res.ok) {
        const data = await res.json();
        setUserOrders(data);
      }
    } catch (e) {
      console.log('Failed to fetch orders');
    }
  };

  const pickImageWeb = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImageBase64(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedOrderId.trim() || !issueDesc.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Information', text2: 'Please select an order and describe the issue.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          order_id: selectedOrderId,
          issue_description: issueDesc,
          image_base64: imageBase64 
        })
      });

      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Claim Submitted', text2: 'Linked with ' + selectedOrderId });
        setClaimSuccessData({
          order_id: selectedOrderId,
          issue_description: issueDesc,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          image_base64: imageBase64 
        });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Unable to submit claim request.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please check your connection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadClaimPdf = () => {
    if (Platform.OS === 'web' && claimSuccessData) {
      Toast.show({ type: 'info', text1: 'Preparing Document', text2: 'Please select "Save as PDF" in print menu.' });

      const imageElement = claimSuccessData.image_base64 
        ? `<div style="margin-top: 20px; text-align: center;">
             <p style="text-align: left; font-size: 14px; font-weight: bold; color: #0F172A; margin-bottom: 10px;">Attached Image:</p>
             <img src="${claimSuccessData.image_base64}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #CBD5E1;" />
           </div>`
        : '';

      const content = `
        <html>
        <head>
          <title>Claim Form - ${claimSuccessData.order_id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; padding: 20px; }
            .container { width: 100%; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 24px; color: #0F172A; }
            .info-sec p { margin: 10px 0; font-size: 14px; }
            .desc-box { margin-top: 20px; padding: 15px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; }
            .desc-title { font-size: 14px; font-weight: bold; color: #0F172A; margin: 0; }
            .desc-text { margin: 8px 0 0 0; font-size: 14px; color: #475569; }
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
              <p><strong>Customer:</strong> ${currentUsername}</p>
              <p><strong>Date:</strong> ${claimSuccessData.date}</p>
              <p><strong>Order ID:</strong> ${claimSuccessData.order_id}</p>
            </div>
            <div class="desc-box">
              <p class="desc-title">Issue Description:</p>
              <p class="desc-text">${claimSuccessData.issue_description}</p>
            </div>
            ${imageElement}
            <div class="footer">
              <p>This claim form is generated automatically.</p>
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() { window.print(); window.onafterprint = function(){ window.close(); } }, 500);
            };
          </script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Warranty Claim</Text>
        <Pressable onPress={() => { router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } }); }}>
          <Text style={styles.backText}>Close</Text>
        </Pressable>
      </View>

      {claimSuccessData ? (
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Claim Submitted Successfully</Text>
          <Text style={styles.successSubtitle}>Linked to order {claimSuccessData.order_id}</Text>
          
          <Pressable style={styles.btnPrintPrimary} onPress={downloadClaimPdf}>
            <Text style={styles.btnPrintText}>Download Claim Form</Text>
          </Pressable>

          <Pressable style={styles.btnBackToShop} onPress={() => { router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } }); }}>
            <Text style={styles.btnBackToShopText}>Back to Home</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Select your purchase order below to file a warranty claim.</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Order from History</Text>
              {userOrders.length === 0 ? (
                <Text style={{color: COLORS.textLight, fontSize: 13}}>No purchase history found.</Text>
              ) : (
                <View style={styles.orderPickerGrid}>
                  {userOrders.map((ord) => {
                    const isSelected = selectedOrderId === ord.order_id;
                    return (
                      <Pressable 
                        key={ord.order_id} 
                        style={[styles.orderOptionCard, isSelected && styles.orderOptionCardActive]}
                        onPress={() => setSelectedOrderId(ord.order_id)}
                      >
                        <Text style={[styles.orderOptionTitle, isSelected && {color: COLORS.btnPrimary}]}>{ord.order_id}</Text>
                        <Text style={styles.orderOptionSubtitle}>THB {Number(ord.total).toLocaleString()}</Text>
                        <Text style={styles.orderOptionItems} numberOfLines={1}>
                          {ord.items.map((i: any) => i.product_name).join(', ')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Selected Order ID</Text>
              <TextInput style={styles.input} value={selectedOrderId} onChangeText={setSelectedOrderId} placeholder="e.g. ORD-8" placeholderTextColor="#94A3B8" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Issue Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={issueDesc} onChangeText={setIssueDesc} placeholder="Describe the issue in detail..." placeholderTextColor="#94A3B8" multiline />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Attach Image (Optional)</Text>
              <View style={styles.imageGrid}>
                  {imageBase64 ? (
                      <View style={styles.imageWrapper}>
                          <Image source={{ uri: imageBase64 }} style={styles.thumbnail} />
                          <Pressable style={styles.removeImageBtn} onPress={() => setImageBase64(null)}>
                              <Text style={styles.removeImageText}>X</Text>
                          </Pressable>
                      </View>
                  ) : (
                      <Pressable style={styles.uploadBtn} onPress={pickImageWeb}>
                          <Text style={styles.uploadIcon}>+</Text>
                          <Text style={styles.uploadText}>Choose File</Text>
                      </Pressable>
                  )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={[styles.btnSubmit, isSubmitting && { opacity: 0.5 }]} onPress={handleSubmitClaim} disabled={isSubmitting}>
              <Text style={styles.btnSubmitText}>{isSubmitting ? 'Submitting...' : 'Submit Claim Request'}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { backgroundColor: COLORS.white, padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark, textTransform: 'uppercase' },
  backText: { fontSize: 16, color: COLORS.btnCancel, fontWeight: '700' },
  scrollContent: { padding: 20 },
  infoBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 20 },
  infoText: { fontSize: 13, color: '#0F172A', lineHeight: 20, textAlign: 'center' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 14, color: COLORS.textDark },
  textArea: { height: 120, paddingTop: 14, textAlignVertical: 'top' },
  orderPickerGrid: { gap: 10 },
  orderOptionCard: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12 },
  orderOptionCardActive: { borderColor: COLORS.btnPrimary, backgroundColor: '#F0F9FF' },
  orderOptionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  orderOptionSubtitle: { fontSize: 12, color: '#10B981', fontWeight: '700', marginTop: 2 },
  orderOptionItems: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  imageWrapper: { position: 'relative', width: 100, height: 100 },
  thumbnail: { width: '100%', height: '100%', borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  removeImageBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.btnCancel, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  removeImageText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  uploadBtn: { width: 100, height: 100, backgroundColor: COLORS.btnUpload, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.iconUpload },
  uploadIcon: { fontSize: 24, color: COLORS.iconUpload, marginBottom: 4 },
  uploadText: { fontSize: 10, color: COLORS.iconUpload, fontWeight: '600' },
  footer: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderColor: COLORS.border },
  btnSubmit: { backgroundColor: COLORS.btnSubmit, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  btnSubmitText: { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#10B981', marginBottom: 10, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 30, textAlign: 'center' },
  btnPrintPrimary: { width: '100%', maxWidth: 300, backgroundColor: COLORS.btnPrimary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20, shadowColor: COLORS.btnPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  btnPrintText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  btnBackToShop: { paddingVertical: 10, paddingHorizontal: 20 },
  btnBackToShopText: { color: '#64748B', fontSize: 14, fontWeight: '800' }
});