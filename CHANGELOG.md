# CHANGELOG - Vampir Köylü (Sapanca Edition)

Tüm önemli değişiklikler ve geliştirme aşamaları bu dosyada kronolojik olarak listelenmektedir.

## [v0.1.0] - 2026-10-02
### Eklendi
- `GDD.md`: Oyun Tasarım Dokümanı (8 kişilik rol dengesi, faz akışları, haptik & sesli moderatör stratejisi).
- `PIPELINE.md`: Mimari plan, teknoloji seçimi (MQTT over WSS, Web Speech API, QR kod entegrasyonu) ve yol haritası.
- Proje başlangıcı: Fiziksel moderatörsüz 8 kişilik akıllı telefon arayüzü tasarımı.

## [v0.2.0] - 2026-10-02
### Eklendi & Değiştirildi
- **4 Benzersiz Köylü Meme Kartı:** Kullanıcının eklediği 4 özel köylü fotoğrafı (`koylu1.png`, `Koylu2.png`, `koylu3.png`, `koylu4.png`) projeye entegre edildi.
  - `VILLAGER_1`: Köylü (Halay Başı Dayı)
  - `VILLAGER_2`: Köylü (Köyde Eylem Var!)
  - `VILLAGER_3`: Köylü (Noktasıyla Su Bulan Dayı)
  - `VILLAGER_4`: Köylü (Bilge Kasketli)
- **Tekilleştirilmiş Rol Dağıtımı (`generateRoleDeck`):** 8 kişilik oyunda 4 köylü oyuncusunun her birine KESİNLİKLE farklı bir meme kartı atanacak şekilde algoritma güncellendi. Artık aynı köylü kartı iki kişiye gitmez.
- **3D Kart Çevirme (Card Flip):** Kart üzerine dokunarak veya "Kartı Çevir" butonuyla 3D efektle gizli kimliği görme özelliği.

## [v0.3.0] - 2026-10-02
### Eklendi & Değiştirildi
- **Canberk Admin Sistemi:**
  - Kullanıcı adını `canberk` (büyük/küçük harf duyarsız) olarak yazan oyuncuya otomatik `isAdmin = true` tanımlandı.
  - Lobi kartında ve oyuncu listelerinde parlayan `⚡ Admin` rozeti eklendi.
  - Canberk oda kurucusu (Host) olmasa dahi oyunu tek başına başlatabilir (`ADMIN_START_GAME`).
- **Oyun Bitirme Kısıtı ("Başladıktan Sonra Bitirmek Yok"):**
  - Sıradan oyuncuların oyunu erken sonlandırması veya sıfırlaması engellendi.
  - Sadece Admin (Canberk) acil durum reset veya zafer yetkisine sahiptir.
- **Canberk Özel Admin Paneli (`admin-panel-modal`):**
  - Ekranın sağ alt köşesinde gizlenebilir kayan `⚡ ADMİN` butonu.
  - **⏭️ Fazı Zorla İleri Al:** Gece/Gündüz/Oylama timerlarını anında atlayıp bir sonraki faza geçme yetkisi.
  - **⚖️ Oylamaya Zorla:** 2 dakikalık gündüz tartışmasını beklemeden derhal oylamayı başlatma yetkisi.
  - **👁️ Röntgenci Modu (God View):** Canberk'in ekranında tüm oyuncuların gizli rollerini canlı olarak gösterme/gizleme modu.
  - **🔄 Oyunu Sıfırla (Lobiye Dön):** Acil durumlarda oyunu lobiye çekme yetkisi.
  - **🏆 Hızlı Zafer:** Oyunu anında Köylüler veya Vampirler lehine bitirme yetkisi.
  - **💀 Canlı/Ölü Kontrolü:** İstenen oyuncuyu tek tıkla öldürme veya diriltme yetkisi.
## [v0.4.0] - 2026-10-02
### Eklendi & Düzeltildi
- **Latince/Yabancı Ses Telaffuz Hatası Giderildi:**
  - Cihazda Türkçe TTS ses motoru bulunmadığında (örneğin İngilizce Windows veya Türkçe dil paketi yüklü olmayan sistemler) varsayılan İngilizce sesin Türkçeyi Latince dua gibi ("jee-see all-doo...") okuması engellendi.
  - Sadece gerçek Türkçe ses motorları (`tr-TR`, `Google Türkçe`, `Tolga`, `Yelda`, `Cem`) varsa sesli okuma yapılır.
- **Canlı Gotik Moderatör Altyazı Barı (`#narrator-banner`):**
  - Moderatörün tüm konuşmaları ekranda altın yaldızlı, gölgeli gotik bir altyazı kartı olarak canlı gösterilir.
  - Sapanca'da gürültülü ortamda veya telefon sessizde olsa bile tüm oyuncular moderatörün anonslarını senkronize şekilde okuyabilir.
- **GitHub Repository Senkronizasyonu:**
  - Proje doğrudan [canberkbagana-tr/vampirkoylu](https://github.com/canberkbagana-tr/vampirkoylu) reposuna pushlandı.

## [v0.5.0] - 2026-10-02
### Eklendi & Değiştirildi
- **Dinamik Kişi Sayısı & 7 Kişilik Dengeleme:**
  - Sabit 8 kişi kuralı kaldırıldı; 4 ile 12+ oyuncu arasındaki her grup büyüklüğü için otomatik matematiksel dengeleme eklendi (`getDynamicRoleComposition`).
  - **7 Kişilik Optimize Denge:** 2 Vampir, 1 Doktor, 1 Kahin, 3 Benzersiz Meme Köylüsü (`koylu1-3`). Vampirlerin gece ortak kurban seçme mekaniği ve tansiyonu 7 kişide tam korundu.
- **Lobi Dinamik Rol Dağılım Önizleme Çubuğu (`#lobby-role-preview`):**
  - Odaya her yeni arkadaş katıldığında lobi ekranında rollerin nasıl dağıtılacağı canlı rozetlerle (`🧛 2 Vampir`, `💉 1 Doktor`, `🔮 1 Kahin`, `🧑‍🌾 3 Köylü`) anında gösterilir.
- **Meme Kartları Tekilleştirilmiş Dağıtımı:**
  - 7 kişilik oyunda 4 köylü meme kartı havuzundan rastgele 3 tanesi seçilerek 3 köylüye atanır; aynı kart asla iki kişiye verilmez.

## [v0.6.0] - 2026-10-02
### Eklendi & Değiştirildi
- **Host & Admin Özel Rol Yapılandırma Paneli (`#lobby-role-customizer`):**
  - Host veya Canberk Admin lobi ekranında açılır kapanır panel üzerinden istediği gibi rol sayılarını artırıp azaltabilir (`+` / `-` butonları).
  - Vampir, Doktor, Kahin ve Köylü sayıları tamamen manuel olarak ayarlanabilir (Örn: 7 kişide 1 veya 2 vampir, 8 kişide 3 vampir vb.).
  - **⚡ Önerilene Sıfırla:** Tek tıkla o anki oyuncu sayısına en uygun matematiksel dengeye dönme butonu.
- **Canlı Senkronizasyon (`UPDATE_ROLE_SETUP`):**
  - Host veya Admin rolleri değiştirdiğinde tüm oyuncuların lobi ekranındaki rozetler ve sayaçlar anlık olarak güncellenir.
- **Tek Tuşla Test Botu Ekleme:**
  - Host kontrollerine `🤖 +1 Test Botu Ekle` butonu eklendi, böylece istenen tam kişi sayısına (7, 8 vb.) kolayca ulaşılabilir.

