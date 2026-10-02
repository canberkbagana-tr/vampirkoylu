# GDD - Vampir Köylü (Sapanca Edition)
**Otomatik Moderatörlü Gerçek Zamanlı Web Oyunu**

## 1. Oyunun Amacı ve Çıkış Noktası
Vampir Köylü (Mafia/Werewolf) oyununda klasik problem: 8 kişi toplanıldığında 1 kişinin "Moderatör/Anlatıcı" olması ve oyundan mahrum kalmasıdır.
Bu projenin amacı, **8 kişinin tamamının oyuncu olarak katılabileceği**, fiziksel bir moderatöre ihtiyaç duymayan, **GitHub Pages üzerinden tamamen ücretsiz ve sunucusuz (zero-config)** çalışan, akıllı telefonlardan oynanan atmosferik bir web arayüzü sağlamaktır.

---

## 2. Dinamik Rol Sistemi (Kişi Sayısına Göre Değişken Denge)
Oyuncu sayısındaki değişimlere (örneğin 8'den 7'ye düşülmesi veya artması) göre roller otomatik ve matematiksel olarak dengelenir:

* **7 Kişilik Optimize Denge (Mevcut Grup):**
  * **2x Vampir:** Gece uyanır, birbirlerini kırmızı parlama ile görür ve ortak kurban seçerler.
  * **1x Doktor:** Gece uyanır, 1 kişiyi ölümden kurtarır (üst üste aynı kişiyi koruyamaz).
  * **1x Kahin (Gözcü):** Gece uyanır, 1 kişinin kimliğini sorgular.
  * **3x Benzersiz Köylü (Meme Kartları):** 4 meme kartı arasından rastgele seçilen 3 farklı köylü (aynı kart tekrarlanmaz).

* **Dinamik Rol Skalası (4 - 12+ Kişi):**
  * **4 Kişi:** 1 Vampir, 1 Doktor, 2 Köylü
  * **5 Kişi:** 1 Vampir, 1 Doktor, 1 Kahin, 2 Köylü
  * **6 Kişi:** 1 Vampir, 1 Doktor, 1 Kahin, 3 Köylü
  * **7 Kişi:** 2 Vampir, 1 Doktor, 1 Kahin, 3 Köylü
  * **8 Kişi:** 2 Vampir, 1 Doktor, 1 Kahin, 4 Köylü (4 meme kartının tamamı)
  * **9 Kişi:** 2 Vampir, 1 Doktor, 1 Kahin, 5 Köylü
  * **10+ Kişi:** 3 Vampir, 1 Doktor, 1 Kahin, (N - 5) Köylü

* **Lobi Canlı Rol Önizlemesi:** Odaya her yeni arkadaş katıldığında lobi üstünde anlık rol dağılımı rozetlerle (`🧛 2 Vampir`, `💉 1 Doktor` vb.) canlı gösterilir.


---

## 3. Akıllı Moderatör Mekaniği (Fiziksel Moderatörü Devre Dışı Bırakma)
Bir insan anlatıcı olmadan oyunun yürümesi için 3 kritik teknoloji kullanılır:
1. **Web Speech API & Ses Efektleri (Sesli Moderatör):**
   * Türkçe ses motoru doğrudan tarayıcıdan konuşur: *"Köy uykuya dalıyor, herkes gözlerini kapatsın..."*, *"Vampirler uyanın, kurbanınızı seçin..."*
   * Gece ve gündüz için karanlık ambient müzik, kalp atışı gerilimi, horoz sesi ve kurt uluması.
2. **Haptik / Titreşim (Gizli Uyandırma):**
   * Gözler kapalıyken veya telefon masada ters dururken `navigator.vibrate` ile sadece aktif rolün telefonu titrer! Böylece kimse kafasını kaldırıp etrafa bakarak kimin telefonuna baktığını anlayamaz.
3. **Ekran Karartma & "Kör Modu" (Blind Screen):**
   * Sırası olmayan oyuncunun ekranı tamamen simsiyah olur ve yalnızca *"UYUYORSUNUZ"* yazar. Parmak hareketi anlaşılmasın diye sahte buton tıklama alanları veya dokunmatik kilit konur.

---

## 4. Oyun Akışı ve Fazlar (State Machine)

### Faz 0: Lobi & Katılım (Oda Kodu & QR)
* 1 kişi "Oda Kur" der, 4 haneli rastgele oda kodu üretilir (Örn: `SPNC`).
* QR Kod ekranda belirir; Sapanca'daki 7 arkadaş kamerayı açıp saniyeler içinde lobiye girer.
* İsim + Avatar seçimi.
* Herkes "Hazırım" dediğinde Host oyunu başlatır.

### Faz 1: Gizli Rol Dağıtımı
* Kartlar rastgele ve şifreli dağıtılır.
* "Basılı Tut ve Gör" (Hold to Reveal) mekaniği: Yandaki kişi ekrana bakamasın diye parmak basılı tutulurken kart açılır, çekince kapanır.
* Herkes rolünü onaylar.

### Faz 2: Gece Fazı (Toplu / Adım Adım)
1. **Genel Uyku:** Ses: *"Gece oldu, herkes gözlerini kapatsın."* (Geri sayım başlar).
2. **Vampirler:** Vampirlerin ekranı açılır. Diğer vampir arkadaşının ismi yeşil/kırmızı ışıkla görünür. Ortak hedef listesinden kurban seçilir.
3. **Doktor:** Doktorun ekranı uyanır. Korunacak kişiyi seçer.
4. **Kahin:** Kahinin ekranı uyanır. Bir kişiyi seçip 'Vampir mi / Masum mu' kartını görür.
* *Not:* Her gece rolüne eşit süre (örn. 25 sn) verilir, böylece vampir erken seçse bile süre dolmadan diğer faza geçilmez; kimin ne kadar ekrana baktığı dışarıdan anlaşılmaz!

### Faz 3: Gündüz Fazı (2 Dakika Tartışma)
* Ses ve Güneş doğuşu animasyonu.
* Gece Raporu: *"Bu gece [İsim] vahşice katledildi!"* veya *"Doktor bu gece bir hayat kurtardı, kimse ölmedi!"*
* **2 Dakikalık Geri Sayım Sayacı:**
  * 1:00 kala uyarı gongu.
  * Son 30 saniye hızlı kalp atışı.
  * Son 10 saniye sesli geri sayım.
  * *Opsiyonel:* Erken Oylama Butonu (Herkes hemfikirse tartışma erkenden bitirilebilir).

### Faz 4: Mahkeme & Oylama (Yargılama)
* Herkes hayattaki birine oy verir veya "Pas / Çekimser" kalır.
* Gizli oylama: Süre bitene kadar oylar gizli kalır, süre bitince dramatik efektle kimin kime oy verdiği açılır.
* En çok oyu alan asılır veya eşitlikte "Kimse asılmadı" kararı çıkar.
* Asılan kişinin rolü açıklanır (Lobi ayarına bağlı).

### Faz 5: Zafer Kontrolü & Oyun Sonu
* **Köylüler Kazanır:** Tüm vampirler öldürüldüğünde.
* **Vampirler Kazanır:** Vampir sayısı masum sayısına eşitlendiğinde veya geçtiğinde.
* Oyun sonu istatistikleri ve "Tekrar Oyna" butonu ile aynı lobide hemen yeni tur.

---

## 5. UI/UX Tasarım Standartları
* **Tema:** Gotik Karanlık Mod (Obsidyen siyahı `#0d0f12`, Kan Kırmızısı `#dc2626`, Mehtap Altını `#f59e0b`, Sis Grisi).
* **Tipografi:** Google Fonts (`Cinzel` gotik başlıklar, `Plus Jakarta Sans` temiz arayüz).
* **Mobil Odaklı:** Sapanca'da herkes akıllı telefondan oynayacağı için dokunmatik butonlar büyük, animasyonlar akıcı (60 FPS), tek elle kullanıma uygun.

---

## 6. Canberk Admin & God Mode Sistemi (Süper Moderatör)
Oyunun kontrolünü sağlamak ve gerektiğinde akışı hızlandırmak/müdahale etmek için özel bir Admin mekanizması kurulmuştur:
* **Admin Tetikleyicisi:** Oyuncunun adı `Canberk` (büyük/küçük harf duyarsız) olduğunda sistem oyuncuyu otomatik olarak `isAdmin = true` kabul eder ve ekrana parlayan `⚡ Admin` rozeti ile kayan `⚡ ADMİN` paneli butonu yerleştirir.
* **Oyunu Başlatma Yetkisi:** Canberk, lobi sahibi (Host) olmasa dahi oyunu doğrudan başlatabilir (`ADMIN_START_GAME`).
* **Faz İlerleme (Force Phase Skip):** Beklemek istemediği durumlarda 2 dakikalık tartışma sayacını, gece rollerini veya oylama timerlarını anında atlatıp sonraki faza geçirebilir.
* **Oylamaya Zorlama (Force Vote):** Gündüz tartışmasını derhal bitirip herkesi mahkeme/oylama ekranına geçirebilir.
* **Röntgenci Modu (God View):** Canberk'in ekranında canlı olarak kimin hangi role sahip olduğunu (Vampir, Doktor, Kahin, Köylü 1-4) gösteren toggle anahtarı.
* **Hayat / Ölüm Kontrolü (Kill/Revive):** İstenen oyuncuyu tek tıkla öldürme veya yanlışlıkla asılan birini diriltme yetkisi.
* **Oyun Sıfırlama & Acil Durum Reset:** Tur bittiğinde veya kilitlenme durumunda lobiyi baştan başlatma (`ADMIN_RESET_LOBBY`).

---

## 7. Oyun Kilit Mekaniği ("Başladıktan Sonra Bitirmek Yok")
* Sıradan oyuncuların oyun başladıktan sonra oyunu iptal etme, bitirme veya lobiye çekme butonları gizlenmiştir.
* Oyun başladıktan sonra yalnızca 2 şekilde bitebilir:
  1. Doğal Zafer Şartı: Vampirlerin veya Köylülerin kazanması.
  2. Süper Moderatör Müdahalesi: Canberk'in Admin Paneli üzerinden oyunu sıfırlaması veya doğrudan zafer ilan etmesi.

