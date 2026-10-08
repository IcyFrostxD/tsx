import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      return Toast.show({ 
        type: 'error', 
        text1: 'Missing Fields', 
        text2: 'Please enter your username and password.' 
      });
    }

    // *** หากคุณมี API ตรวจสอบรหัสผ่านหลังบ้าน สามารถใส่ fetch ตรงนี้ได้เลย ***
    // เบื้องต้นผมจำลองการส่งค่า username ไปหน้า index เพื่อให้ระบบทำงานได้ทันที
    Toast.show({ type: 'success', text1: 'Login Successful', text2: `Welcome back, ${username}!` });
    
    setTimeout(() => {
      router.replace({ 
        pathname: '/', 
        params: { logged_in: 'true', username: username.trim() } 
      });
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        
        {/* รูปโลโก้ลอยทับขอบด้านบน */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/image_38b4e5.jpg')} 
            style={styles.logo} 
            resizeMode="cover" 
          />
        </View>

        <Text style={styles.title}>ทรงพล login</Text>
        <Text style={styles.subtitle}>Sign in to continue to 1IT Store</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your username" 
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your password" 
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Pressable style={styles.btnLogin} onPress={handleLogin}>
          <Text style={styles.btnLoginText}>Login</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
          </Text>
        </Pressable>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // สีพื้นหลังเทาอ่อนๆ ให้ดูคลีน
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignItems: 'center',
    marginTop: 50, // เผื่อพื้นที่ให้โลโก้ลอย
    // เพิ่มเงาให้การ์ดดูมีมิติ
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50, // ดึงขึ้นไปครึ่งนึงเพื่อให้ลอยทับขอบการ์ด
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 30,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    height: 54,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnLogin: {
    width: '100%',
    height: 56,
    backgroundColor: '#0D6EFD', // สีน้ำเงินหลักของแอปคุณ
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0D6EFD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: 24,
    padding: 10,
  },
  registerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  registerTextBold: {
    color: '#0D6EFD',
    fontWeight: '800',
  }
});