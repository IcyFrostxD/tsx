import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primaryBg: '#F8F9FA',
  white: '#FFFFFF',
  textDark: '#212529',
  textLight: '#6C757D',
  btnConfirm: '#198754',
  btnCancel: '#DC3545',
  border: '#DEE2E6',
};

const API_BASE_URL = 'http://119.59.102.161:3095/api/products';

interface FormState {
  id: string | null;
  product_name: string;
  price: string;
  quantity: string;
  snnumber: string;
  detail: string;
  image_filename: string;
}

export default function SaveProduct() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const [formData, setFormData] = useState<FormState>({
    id: null,
    product_name: '',
    price: '',
    quantity: '1',
    snnumber: '',
    detail: '',
    image_filename: '',
  });

  useEffect(() => {
    if (params.id) {
      fetch(`${API_BASE_URL}/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setFormData({
              id: String(data.id),
              product_name: data.product_name || '',
              price: data.price ? String(data.price) : '0',
              quantity: data.quantity ? String(data.quantity) : '1',
              snnumber: data.snnumber || '',
              detail: data.detail || '',
              image_filename: data.image_filename || '',
            });
          }
        })
        .catch(() => {
          if (Platform.OS === 'web') alert('Failed to load product details.');
        });
    }
  }, [params.id]);

  const handleWebFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_filename: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePress = () => {
    if (!formData.product_name.trim()) {
      return Platform.OS === 'web' ? alert('Product name is required.') : null;
    }
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(formData.id ? 'Confirm Update?' : 'Confirm Create?');
      if (confirmed) executeSave();
    } else {
      executeSave();
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
      };

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (Platform.OS === 'web') alert(isEditing ? 'Updated successfully!' : 'Created successfully!');
        router.back();
      } else {
        if (Platform.OS === 'web') alert('Failed to save product.');
      }
    } catch {
      if (Platform.OS === 'web') alert('Network connection failed.');
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

            <Text style={styles.label}>Price (฿)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={formData.price} onChangeText={(t) => setFormData({ ...formData, price: t })} placeholder="0.00" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Stock Quantity</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={formData.quantity} onChangeText={(t) => setFormData({ ...formData, quantity: t })} placeholder="1" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Serial Number (S/N)</Text>
            <TextInput style={styles.input} value={formData.snnumber} onChangeText={(t) => setFormData({ ...formData, snnumber: t })} placeholder="e.g. SN-001" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Product Image (Local File)</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.webFileInputContainer}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleWebFileChange}
                  style={{ color: COLORS.textDark, fontSize: 14 }}
                />
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Image URL or Path"
                placeholderTextColor={COLORS.textLight}
                value={formData.image_filename}
                onChangeText={(t) => setFormData({ ...formData, image_filename: t })}
              />
            )}

            {formData.image_filename ? (
              <Image source={{ uri: formData.image_filename }} style={styles.previewImage} resizeMode="cover" />
            ) : null}

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
  scrollContent: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  box: { backgroundColor: COLORS.white, padding: 30, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, width: '100%', maxWidth: 500, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, marginTop: 14 },
  input: { height: 50, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: COLORS.textDark },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
  webFileInputContainer: { backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12 },
  previewImage: { width: '100%', height: 160, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  btnForm: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnFormText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});