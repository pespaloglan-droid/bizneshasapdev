// @capacitor/cli henüz `npm install` edilmeden `tsc` kırılmasın diye
// tipi yerelde tanımlıyoruz — paket kurulunca gerçek tipe geçilebilir.
interface CapacitorConfig {
  readonly appId: string;
  readonly appName: string;
  readonly webDir: string;
  readonly androidScheme?: string;
  readonly android?: Record<string, unknown>;
  readonly server?: Record<string, unknown>;
  readonly plugins?: Record<string, Record<string, string | number | boolean>>;
}

const config: CapacitorConfig = {
  appId: 'com.bizneshasap.pos',
  appName: 'Biznes Hasap',
  webDir: 'dist',

  // ⚠️ DÜZ HTTP SUNUCULAR İÇİN KRİTİK
  // Varsayılan 'https' iken uygulama https://localhost origin'inden sunulur ve
  // WebView, http:// adreslerine giden istekleri "mixed content" diye engeller —
  // kullanıcı "Sunucuya ulaşılamıyor" görür, oysa sunucu çalışıyordur.
  // 'http' yaparak origin'i http://localhost'a düşürüyoruz; düz HTTP CouchDB
  // adreslerine (aynı Wi-Fi'daki bilgisayar ya da alan adı) izin verilsin.
  androidScheme: 'http',

  android: {
    // Karma içerik (https origin → http istek) açık.
    allowMixedContent: true,
  },

  server: {
    androidScheme: 'http',
    cleartext: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0e3860'
    },
    Keyboard: {
      resize: 'body'
    }
  }
};

export default config;
