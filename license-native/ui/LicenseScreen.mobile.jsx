// ui/LicenseScreen.mobile.jsx - React Native lisans ekranı
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Clipboard,
  Share,
  ActivityIndicator,
  NativeModules,
} from 'react-native';

const native = require('../native'); // nodejs-mobile üzerinden
const gate = require('../gate');

/**
 * Android APK Lisans Ekranı
 * 
 * @param {Object} route - React Navigation route parametreleri
 * @param {Object} navigation - React Navigation nesne
 */
export default function LicenseScreen({ route, navigation }) {
  const blockedRoute = route?.params?.blockedRoute;
  const accountId = route?.params?.accountId; // Kalıcı depodan gelir - YENİDEN ÜRETİLMEZ
  
  const [reqCode, setReqCode] = useState('');
  const [rootCode, setRootCode] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Android data dizinini al
        const dir = await NativeModules.PosBridge?.getDataDir();
        if (dir) {
          native.setDataDir(dir);
        }

        // Cihaz bileşenlerini native'e aktar (fingerprint için)
        const comps = await NativeModules.PosBridge?.getDeviceComponents();
        if (comps) {
          native.setDeviceComponents(comps);
        }

        // Boot elapsed time (saat geri alma tespiti için)
        const elapsed = await NativeModules.PosBridge?.getBootElapsed();
        if (elapsed !== undefined) {
          native.setBootElapsed(elapsed);
        }

        // İstek kodunu hesapla
        const code = native.getRequestCode(accountId);
        if (code) {
          setReqCode(code);
        } else {
          Alert.alert('Hata', 'İstek kodu oluşturulamadı');
        }

        // Gate'e aktif hesabı bildir
        gate.selectAccount(accountId);
      } catch (err) {
        Alert.alert('Hata', 'Başlatma hatası: ' + err.message);
      }
    })();
  }, [accountId]);

  const handleShareRequest = async () => {
    try {
      await Share.share({
        message: `Biznes Hasap POS Lisans İsteği\n\nHesap ID: ${accountId}\nİstek Kodu: ${reqCode}\n\nBu bilgileri bize göndererek lisans anahtarı alabilirsiniz.`,
        title: 'Lisans İsteği',
      });
    } catch (err) {
      Alert.alert('Hata', 'Paylaşma hatası');
    }
  };

  const handleActivate = () => {
    setLoading(true);

    try {
      // İlk kurulumda kök kodu gerekli
      if (rootCode.trim()) {
        const rootResult = native.setRootCode(accountId, rootCode.trim());
        if (rootResult !== native.OK) {
          Alert.alert('Hata', 'Kök kodu hatalı: ' + errorText(rootResult));
          setLoading(false);
          return;
        }
      }

      // Lisans anahtarını aktifleştir
      if (!key.trim()) {
        Alert.alert('Hata', 'Lisans anahtarı girin');
        setLoading(false);
        return;
      }

      const status = native.activate(accountId, key.trim());

      if (status === native.OK) {
        Alert.alert(
          'Başarılı',
          'Lisans başarıyla aktifleştirildi!',
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Engellenen rotaya git, yoksa ana ekrana
                navigation.replace(blockedRoute || 'HomeScreen');
              },
            },
          ]
        );
      } else {
        Alert.alert('Lisans Hatası', errorText(status));
      }
    } catch (err) {
      Alert.alert('Hata', 'Beklenmeyen hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Kopyalandı', `${label} panoya kopyalandı`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🔒 Lisans Anahtarı Gerekli</Text>
      </View>

      {blockedRoute && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Bu işlem lisans gerektirir:</Text>
          <Text style={styles.warningText}>{blockedRoute}</Text>
        </View>
      )}

      <Text style={styles.infoText}>
        Satış, alış, stok ve tüm işlemler lisansa bağlıdır. Aşağıdaki bilgileri
        bize göndererek lisans anahtarı alabilirsiniz.
      </Text>

      {/* Hesap ID */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>Hesap ID</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{accountId}</Text>
          <TouchableOpacity
            style={styles.btnCopy}
            onPress={() => copyToClipboard(accountId, 'Hesap ID')}
          >
            <Text style={styles.btnCopyText}>📋</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Bu ID hesabınıza özeldir (değiştirilemez)</Text>
      </View>

      {/* İstek Kodu */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>İstek Kodu (bize gönderin)</Text>
        <View style={styles.codeRow}>
          <Text style={[styles.codeText, styles.highlight]}>
            {reqCode || 'Yükleniyor...'}
          </Text>
          <TouchableOpacity
            style={styles.btnCopy}
            onPress={() => copyToClipboard(reqCode, 'İstek Kodu')}
            disabled={!reqCode}
          >
            <Text style={styles.btnCopyText}>📋</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Bu kod hesap + cihaz kimliğinizi içerir</Text>

        <TouchableOpacity
          style={styles.btnShare}
          onPress={handleShareRequest}
          disabled={!reqCode}
        >
          <Text style={styles.btnShareText}>WhatsApp/Telegram ile Gönder</Text>
        </TouchableOpacity>
      </View>

      {/* Kök Kod */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Kök Kodu (sadece ilk kurulum için)</Text>
        <TextInput
          style={styles.input}
          value={rootCode}
          onChangeText={(text) => setRootCode(text.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          autoCorrect={false}
          spellCheck={false}
        />
        <Text style={styles.hint}>İlk kullanımda bize gönderilen kök kodu girin</Text>
      </View>

      {/* Lisans Anahtarı */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Lisans Anahtarı</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={key}
          onChangeText={(text) => setKey(text.toUpperCase())}
          placeholder="Lisans anahtarınızı buraya yapıştırın"
          multiline
          numberOfLines={3}
          autoCapitalize="characters"
          autoCorrect={false}
          spellCheck={false}
        />
      </View>

      {/* Aktivasyon butonu */}
      <TouchableOpacity
        style={[styles.btnActivate, (loading || !key.trim()) && styles.btnDisabled]}
        onPress={handleActivate}
        disabled={loading || !key.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnActivateText}>Aktifleştir</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderWidth: 2,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    color: '#856404',
    fontSize: 13,
  },
  infoText: {
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    fontSize: 14,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  codeText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  highlight: {
    backgroundColor: '#e7f3ff',
    borderColor: '#0d6efd',
  },
  btnCopy: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  btnCopyText: {
    fontSize: 18,
  },
  hint: {
    marginTop: 6,
    color: '#6c757d',
    fontSize: 11,
  },
  btnShare: {
    marginTop: 12,
    backgroundColor: '#25d366',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnShareText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  btnActivate: {
    backgroundColor: '#0d6efd',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnActivateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    backgroundColor: '#6c757d',
  },
});

// Hata kodları -> açıklama
const ERROR_MESSAGES = {
  [0]:   'Geçersiz anahtar',
  [-1]:  'Lisans süresi dolmuş',
  [-2]:  'Bu anahtar başka bir cihaza ait',
  [-3]:  'Cihaz saati geri alınmış görünüyor',
  [-4]:  'Bu anahtar daha önce kullanılmış',
  [-5]:  'Lisans aktif değil',
  [-6]:  'Geçersiz giriş',
  [-7]:  'Anahtarın aktivasyon süresi geçmiş',
  [-8]:  'Anahtar bu hesaba ait değil',
  [-9]:  'Depolama hatası',
  [-10]: 'Önce kök kodu gerekli',
  [-11]: 'Durum dosyası hasarlı',
};

function errorText(status) {
  return ERROR_MESSAGES[status] || `Hata kodu: ${status}`;
}
