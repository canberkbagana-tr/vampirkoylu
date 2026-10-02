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
- **GitHub Pages Hazırlığı:** Tüm bağımlılıklar yerel dosyalara bağlandı, göreceli dosya yolları sağlandı.

