import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const COLORS = {
  primaryBg: '#F8F9FA', white: '#FFFFFF', textDark: '#212529', textLight: '#6C757D',
  btnConfirm: '#198754', btnCancel: '#DC3545', border: '#DEE2E6', activeCat: '#0D6EFD'
};

const CATEGORIES = ['Mouse', 'Monitor', 'Keyboard', 'Mousepad', 'Headphone', 'Gamepad'];
const API_BASE_URL = 'http://119.59.102.161:3095/api/products';

interface FormState {
  id: string | null; product_name: string; price: string; quantity: string;
  snnumber: string; detail: string; image_filename: string; category: string;
}

export default function SaveProduct() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<any>();

  const [formData, setFormData] = useState<FormState>({
    id: null, product_name: '', price: '', quantity: '1',
    snnumber: '', detail: '', image_filename: '', category: 'Mouse',
  });

  useEffect(() => {
    if (params.id) {
      setFormData({
        id: String(params.id),
        product_name: params.product_name ? String(params.product_name) : '',
        price: params.price ? String(params.price) : '0',
        quantity: params.quantity ? String(params.quantity) : '1',
        snnumber: params.snnumber ? String(params.snnumber) : '',
        detail: params.detail ? String(params.detail) : '',
        image_filename: params.image_filename ? String(params.image_filename) : '',
        category: params.category ? String(params.category) : 'Mouse',
      });
    } else {
      setFormData({
        id: null, product_name: '', price: '', quantity: '1',
        snnumber: '', detail: '', image_filename: '', category: 'Mouse',
      });
    }
  }, [params.id, params.product_name, params.price, params.quantity, params.snnumber, params.detail, params.image_filename, params.category]);

  const handleWebFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setFormData({ ...formData, image_filename: reader.result as string }); };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePress = () => {
    if (!formData.product_name.trim()) {
      return Toast.show({ type: 'error', text1: 'Missing Information', text2: 'Product name is required.' });
    }
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Do you want to save this product?');
      if (confirmed) executeSave();
    } else {
      Alert.alert(formData.id ? 'Confirm Update' : 'Confirm Create', 'Do you want to save this product?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', style: 'default', onPress: () => executeSave() },
      ]);
    }
  };

  const executeSave = async () => {
    try {
      const isEditing = formData.id !== null;
      const url = isEditing ? `${API_BASE_URL}/${formData.id}` : API_BASE_URL;

      const payload = {
        product_name: formData.product_name,
        price: parseFloat(formData.price) || 0,
        quantity: parseInt(formData.quantity, 10) || 0,
        image_filename: formData.image_filename || '',
        snnumber: formData.snnumber || '',
        detail: formData.detail || '',
        category: formData.category,
      };

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Saved successfully!' });
        router.back();
      } else {
        Toast.show({ type: 'error', text1: 'Failed to save product' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Connection Error' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.box}>
            <Text style={styles.title}>{formData.id ? `Edit Item ID: ${formData.id}` : 'Add New Item'}</Text>

            <Text style={styles.label}>Product Name</Text>
            <TextInput style={styles.input} value={formData.product_name} onChangeText={(t) => setFormData({ ...formData, product_name: t })} placeholder="Enter name" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map(cat => (
                <Pressable key={cat} style={[styles.catBtn, formData.category === cat && styles.catBtnActive]} onPress={() => setFormData({...formData, category: cat})}>
                  <Text style={[styles.catText, formData.category === cat && styles.catTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Price (THB)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={formData.price} onChangeText={(t) => setFormData({ ...formData, price: t })} placeholder="0" placeholderTextColor={COLORS.textLight} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Stock Qty</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={formData.quantity} onChangeText={(t) => setFormData({ ...formData, quantity: t })} placeholder="1" placeholderTextColor={COLORS.textLight} />
              </View>
            </View>

            <Text style={styles.label}>Serial Number (S/N)</Text>
            <TextInput style={styles.input} value={formData.snnumber} onChangeText={(t) => setFormData({ ...formData, snnumber: t })} placeholder="e.g. SN-001" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Product Image</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.webFileInputContainer}>
                {React.createElement('input', { type: 'file', accept: 'image/*', onChange: handleWebFileChange, style: { color: COLORS.textDark, fontSize: 14 } })}
              </View>
            ) : (
              <TextInput style={styles.input} placeholder="Image URL or Path" placeholderTextColor={COLORS.textLight} value={formData.image_filename} onChangeText={(t) => setFormData({ ...formData, image_filename: t })} />
            )}
            {formData.image_filename ? <Image source={{ uri: formData.image_filename }} style={styles.previewImage} resizeMode="cover" /> : null}

            <Text style={styles.label}>Item Detail</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={formData.detail} onChangeText={(t) => setFormData({ ...formData, detail: t })} placeholder="Description..." placeholderTextColor={COLORS.textLight} />

            <View style={styles.actionRow}>
              <Pressable style={[styles.btnForm, { backgroundColor: COLORS.btnConfirm }]} onPress={handleSavePress}>
                <Text style={styles.btnFormText}>{formData.id ? 'Update' : 'Create'}</Text>
              </Pressable>
              <Pressable style={[styles.btnForm, { backgroundColor: COLORS.btnCancel }]} onPress={() => router.back()}>
                <Text style={styles.btnFormText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  scrollContent: { padding: 16, justifyContent: 'center', flexGrow: 1 },
  box: { backgroundColor: COLORS.white, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, width: '100%', maxWidth: 500, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, marginTop: 12 },
  input: { height: 46, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: COLORS.textDark },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  catScroll: { flexDirection: 'row', marginBottom: 4 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.primaryBg },
  catBtnActive: { backgroundColor: COLORS.activeCat, borderColor: COLORS.activeCat },
  catText: { color: COLORS.textLight, fontWeight: '600', fontSize: 13 },
  catTextActive: { color: COLORS.white, fontWeight: '700' },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  webFileInputContainer: { backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12 },
  previewImage: { width: '100%', height: 160, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  btnForm: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnFormText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});