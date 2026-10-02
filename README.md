# 🩸 Vampir Köylü - Sapanca Edition
**Fiziksel Moderatöre İhtiyaç Duymayan, 8 Kişilik Otomatik Moderatörlü Web Oyunu**

Sapanca tatili için tasarlandı: 8 kişilik arkadaş grubunda artık kimse "anlatıcı/moderatör" olmak için oyundan mahrum kalmaz. Sesli yapay zeka moderatörü, karanlık gotik atmosferi ve eğlenceli meme köylü kartlarıyla 8 kişinin tamamı akıllı telefonlarından gerçek zamanlı oynar!

---

## 🚀 GitHub Pages Üzerinden Canlıya Alma (Dağıtım)

Bu proje sıfır sunucu konfigürasyonuyla (zero-config) doğrudan GitHub Pages üzerinden ücretsiz çalışır:

1. **GitHub'da Yeni Bir Repository Açın:** (Örn: `vampir-koylu`)
2. **Proje Klasöründeki Dosyaları Yükleyin:**
   ```bash
   git init
   git add .
   git commit -m "Vampir Koylu Sapanca Edition v0.3.0"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADINIZ/vampir-koylu.git
   git push -u origin main
   ```
3. **GitHub Pages'i Etkinleştirin:**
   * Repository sayfasında **Settings** > **Pages** menüsüne gidin.
   * **Source:** `Deploy from a branch` seçin.
   * **Branch:** `main` ve `/ (root)` seçip **Save** butonuna basın.
4. **Oyununuz Hazır!**
   * Yaklaşık 1 dakika içinde oyununuz `https://KULLANICI_ADINIZ.github.io/vampir-koylu/` adresinde canlıya geçer.

---

## 📱 Sapanca'da Mobilden Nasıl Oynanır?

1. **Oda Kurucu (Host):**
   * Linke girip adını yazar ve **"👑 YENİ ODA KUR"** der.
   * Ekranda 4 harfli oda kodu ve dinamik **QR Kod** belirir.
2. **Diğer 7 Oyuncu:**
   * Telefon kameralarını açıp Host'un ekranındaki QR kodu okutur.
   * Adlarını yazıp odaya saniyeler içinde bağlanırlar.
3. **Hazır Olma & Başlatma:**
   * Herkes **"HAZIRIM"** butonuna basar.
   * Host veya Canberk **"OYUNU BAŞLAT ⚔️"** butonuna basar.

---

## ⚡ Canberk Admin Yetkileri (God Mode)

Kullanıcı adını **`Canberk`** (büyük/küçük harf fark etmez) olarak giren oyuncu otomatik olarak **Süper Admin** yetkisi kazanır:

* **Oyun Başlatma & Sıfırlama:** Canberk oda kurucusu olmasa dahi oyunu başlatabilir veya lobiye sıfırlayabilir.
* **Başladıktan Sonra Kilit:** Sıradan oyuncuların oyunu bozması veya yarıda kesmesi engellenmiştir. Sadece Canberk acil durum kontrolüne sahiptir.
* **Kayan Admin Paneli (⚡ Butonu):**
  * ⏭️ **Fazı Zorla İleri Al:** Birisi uyuyakaldığında veya bekleme süresini atlamak istediğinde anında sıradaki faza geçirir.
  * ⚖️ **Oylamaya Zorla:** 2 dakikalık tartışma süresini beklemeden derhal köy mahkemesini başlatır.
  * 👁️ **Röntgenci Modu (God View):** Canberk'in ekranında tüm oyuncuların gerçek gizli rolleri renkli etiketlerle canlı olarak görünür. Diğer oyuncular bunu göremez!
  * 💀 **Öldür / Dirilt:** Oyuncuların hayat durumunu doğrudan kontrol eder.
  * 🏆 **Hızlı Zafer:** Oyunu istediği takım lehine tek tıkla sonlandırır.

---

## 🎭 8 Kişilik Rol Dağılımı & Efsanevi Meme Köylüleri

1. **2x Vampir:** Gece uyanır, birbirlerinin isimlerini ve oylarını canlı görür, ortak kurban seçer.
2. **1x Doktor:** Gece uyanır, bir köylüyü korur (üst üste aynı kişiyi koruyamaz).
3. **1x Kahin:** Gece uyanır, bir kişinin kimliğini sorgular (Vampir mi / Masum mu).
4. **4x Benzersiz Meme Köylüsü (Tekilleştirilmiş Dağıtım):**
   * 🕺 **Köylü 1 (Halay Başı Dayı):** Düğün meydanından vampir avına (`koylu1.png`).
   * 📢 **Köylü 2 (Köyde Eylem Var!):** Hakkını savunan direnişçi köylü (`koylu2.png`).
   * 💧 **Köylü 3 (Su Bulan Dayı):** Dut dalıyla noktasıyla su arar gibi vampir arayan dayı (`koylu3.png`).
   * 🧢 **Köylü 4 (Bilge Kasketli):** Bıyık altından gülen bilge köylü (`koylu4.png`).
   * *Not: 4 köylünün her birine KESİNLİKLE farklı bir meme kartı gider, aynı kart iki kişiye dağıtılmaz!*

---

## 🛠️ Teknik Altyapı
* **İletişim:** MQTT over Secure WebSockets (`broker.hivemq.com` / `broker.emqx.io`). Sıfır backend, sunucu maliyetsiz.
* **Sesli Anlatıcı:** Web Speech API (Türkçe ses motoru).
* **Ses Efektleri:** Web Audio API (prosedürel kalp atışı, meclis çanı, şafak melodisi, geri sayım tikleri).
* **Titreşim (Haptik):** Vibration API (aktif rol çağrıldığında sessizce telefonu titretir).
