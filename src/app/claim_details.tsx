import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const COLORS = {
  primaryBg: '#F8FAFC', white: '#FFFFFF', textDark: '#0F172A', textLight: '#64748B',
  border: '#E2E8F0', btnPrimary: '#0F172A', btnCancel: '#EF4444'
};

export default function ClaimDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUsername = (params.username as string) || 'User';

  const [productName, setProductName] = useState('');
  const [snNumber, setSnNumber] = useState('');
  const [issueDetail, setIssueDetail] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // ฟังก์ชันเลือกรูปภาพจากเครื่องโดยใช้ Native Web File Input (ไม่ต้องลง lib เพิ่ม)
  const handlePickLocalImage = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const base64Data = uploadEvent.target?.result as string;
            if (base64Data) {
              setImageUrl(base64Data);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Toast.show({ type: 'info', text1: 'Photo upload', text2: 'Please run on web browser or use URL.' });
    }
  };

  const handleSubmitClaim = async () => {
    if (!productName || !snNumber || !issueDetail) {
      return Toast.show({ type: 'error', text1: 'Missing Information', text2: 'Please fill in all required fields.' });
    }
    
    try {
      const res = await fetch(`http://119.59.102.161:3095/api/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          productName: productName.trim(),
          snNumber: snNumber.trim(),
          issueDetail: issueDetail.trim(),
          imageUrl: imageUrl.trim()
        })
      });

      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Claim Submitted Successfully', text2: 'Our team will contact you shortly.' });
        setTimeout(() => {
          if (router.canGoBack()) router.back();
          else router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } });
        }, 2000);
      } else {
        Toast.show({ type: 'error', text1: 'Submission Failed', text2: 'Please try again later.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection.' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Warranty Claim</Text>
        <Pressable onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace({ pathname: '/', params: { logged_in: 'true', username: currentUsername } });
        }}>
          <Text style={styles.backText}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Claim Information</Text>
          <Text style={styles.cardSubtitle}>Submitted by: <Text style={{fontWeight: '700'}}>{currentUsername}</Text></Text>

          <Text style={styles.label}>Product Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Gaming Mouse X1" placeholderTextColor="#94A3B8" value={productName} onChangeText={setProductName} />

          <Text style={styles.label}>Serial Number</Text>
          <TextInput style={styles.input} placeholder="e.g. SN-123456789" placeholderTextColor="#94A3B8" value={snNumber} onChangeText={setSnNumber} />

          <Text style={styles.label}>Product Image</Text>
          <Pressable style={styles.btnPickImage} onPress={handlePickLocalImage}>
             <Text style={styles.btnPickImageText}>Choose Image from Device</Text>
          </Pressable>
          
          {imageUrl.trim() !== '' && (
            <View style={styles.imgPreviewContainer}>
              <View style={styles.imgPreviewBox}>
                <Image source={{ uri: imageUrl }} style={styles.imgPreview} resizeMode="contain" />
              </View>
              <Pressable style={styles.btnRemoveImg} onPress={() => setImageUrl('')}>
                <Text style={styles.btnRemoveImgText}>Remove Image</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.label}>Issue Description</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the defect or problem in detail..." placeholderTextColor="#94A3B8" multiline value={issueDetail} onChangeText={setIssueDetail} />

          <Pressable style={styles.btnSubmit} onPress={handleSubmitClaim}>
            <Text style={styles.btnSubmitText}>Submit Request</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { backgroundColor: COLORS.white, padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark, letterSpacing: 0.5 },
  backText: { fontSize: 15, color: COLORS.textLight, fontWeight: '700' },
  scrollContent: { padding: 16 },
  
  formCard: { backgroundColor: COLORS.white, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 24 },
  
  label: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, marginBottom: 20 },
  textArea: { height: 120, textAlignVertical: 'top' },
  
  btnPickImage: { backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnPickImageText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  
  imgPreviewContainer: { marginBottom: 20, alignItems: 'center' },
  imgPreviewBox: { width: '100%', height: 180, backgroundColor: '#F8FAFC', borderRadius: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  imgPreview: { width: '100%', height: '100%' },
  btnRemoveImg: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnRemoveImgText: { color: COLORS.btnCancel, fontSize: 12, fontWeight: '700' },
  
  btnSubmit: { backgroundColor: COLORS.btnPrimary, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  btnSubmitText: { color: COLORS.white, fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }
});