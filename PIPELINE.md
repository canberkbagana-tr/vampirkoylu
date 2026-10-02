# PIPELINE & MİMARİ YOL HARİTASI

## 1. Teknoloji Yığını ve Altyapı Kararı
GitHub Pages kısıtı altında 8 farklı telefonun birbiriyle anlık (real-time) konuşması gerekmektedir.

### Seçilen Mimari: **Public MQTT over Secure WebSocket (WSS) + Fallback PeerJS / Local State**
* **Neden MQTT over WSS?**
  * Sıfır sunucu maliyeti, sıfır API anahtarı yapılandırması.
  * `broker.hivemq.com:8884/mqtt` veya `broker.emqx.io:8084/mqtt` üzerinden WSS ile doğrudan tarayıcıdan çalışır.
  * Her oda için benzersiz bir topic: `vampir-koylu-sapanca/{ROOM_CODE}/#`.
  * Telefon kilitlense veya sekme değişse bile otomatik anında yeniden bağlanır.
  * Düşük gecikme (sub-100ms) ile anlık buton basışları, hazır olma durumları ve oylamalar senkronize olur.
* **Ses & Atmosfer:** Web Audio API (prosedürel ambians sesleri, nabız, çan, gece fısıltıları) + Web Speech API (Türkçe sesli moderatör anlatımı).
* **QR Kod Entegrasyonu:** `qrcode.min.js` ile odaya tek tıkla/kamerayla katılma.

---

## 2. Geliştirme Fazları (Roadmap)

- [x] **Adım 1:** GDD (Game Design Document) ve Mimari Tasarım
- [x] **Adım 2:** Görsel ve Atmosferik Varlıkların Üretilmesi (Splash, Kart Arkası, 4 Meme Köylü Görseli)
- [x] **Adım 3:** Tek Sayfa Uygulama (SPA) İskeleti (`index.html`, `style.css` - Gotik karanlık mod & 3D kartlar)
- [x] **Adım 4:** Ağ ve Senkronizasyon Katmanı (`network.js` - MQTT WSS bağlantısı, oda/QR yönetimi)
- [x] **Adım 5:** Sesli ve Haptik Moderatör Katmanı (`moderator.js` - Türkçe Web Speech API ve Web Audio sentezi)
- [x] **Adım 6:** Oyun Mantığı ve Faz Yönetimi (`game.js` - 2 dk sayaç, tekil meme köylü dağıtımı, gizli oylama)
- [x] **Adım 7:** Canberk Admin & God Mode Sistemi (`game.js`, `style.css` - Röntgenci modu, faz/oylama zorlama, hayat kontrolü)
- [x] **Adım 8:** GitHub Pages Dağıtım Hazırlığı (`README.md`, göreceli varlık yolları, sıfır-sunucu hazır mimari)
