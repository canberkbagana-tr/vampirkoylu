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
* **Host & Admin Rol Yapılandırma Paneli:** Oda kurucusu (Host) veya Canberk, oyun başlamadan önce lobi panelindeki `⚙️ Rol Dağılımını Ayarla` kartından dilediği rolün sayısını (`+` / `-` butonlarıyla) artırıp azaltabilir, tek tıkla `⚡ Önerilene Sıfırla` diyerek matematiksel ideal dengeye geri dönebilir.


---

## 3. Akıllı Moderatör Mekaniği (Fiziksel Moderatörü Devre Dışı Bırakma)
Bir insan anlatıcı olmadan oyunun yürümesi için aşağıdaki sistemler kullanılır:
1. **Sessiz & Yalın Mod (Silent & Plain UX):**
   * Kullanıcı geri bildirimleri doğrultusunda tüm sentetik ses efektleri (kalp atışı, gong, şafak melodisi vb.) ve Web Speech konuşma sentezi tamamen sessize alınmıştır.
   * Oyun gürültü yapmadan, ortamı bölmeden, tamamen telefon ekranındaki net ve temiz görsel akışla sessizce ilerler.
2. **Haptik / Titreşim (Gizli Uyandırma):**
   * Gözler kapalıyken veya telefon masada ters dururken `navigator.vibrate` ile sadece aktif rolün telefonu sessizce titrer. Böylece kimse başını kaldırıp ses çıkarmadan uyanır.
3. **Ekran Karartma & "Kör Modu" (Blind Screen):**
   * Sırası olmayan oyuncunun ekranı tamamen kararır ve yalnızca sessizce *"KÖY DERİN UYKUDASINIZ"* yazar.

---

## 4. Oyun Akışı ve Fazlar (State Machine)

### Faz 0: Lobi & Katılım (Oda Kodu & QR)
* 1 kişi "Oda Kur" der, 4 haneli rastgele oda kodu üretilir (Örn: `SPNC`).
* QR Kod ekranda belirir; Sapanca'daki arkadaşlar kamerayı açıp saniyeler içinde lobiye girer.
* İsim + Avatar seçimi.
* Herkes "Hazırım" dediğinde Host oyunu başlatır.

### Faz 1: Gizli Rol Dağıtımı
* Kartlar rastgele ve şifreli dağıtılır.
* "Basılı Tut ve Gör" (Hold to Reveal) veya dokunarak çevirme mekaniği.
* Herkes rolünü onaylar.

### Faz 2: Gece Fazı
1. **Genel Uyku:** Gece başlar, köy derin uykuya dalar.
2. **Vampirler:** Vampirlerin ekranı açılır. Ortak hedef listesinden kurban seçilir. Canlı tüm vampirler seçim yaptığında erken geçiş yapılır.
3. **Doktor:** Doktorun ekranı uyanır. Bu gece korumak istediği kişiyi seçer (üst üste iki gece aynı kişi seçilemez).
4. **Kahin:** Kahinin ekranı uyanır. Bir köylüyü seçtiğinde kartında anında ve sabit olarak "🧛 BU KİŞİ VAMPİR!" veya "🕊️ BU KİŞİ MASUM BİR KÖYLÜ" sonucu belirir.
* **Doktor & Vampir Karşılaşması (Kurtarma Mekaniği):**
  * Eğer Vampirlerin seçtiği kurban ile Doktorun koruduğu kişi AYNI ise: Doktor kurbanı kurtarır, kimse ölmez!
  * Eğer Vampir kurban seçemezse veya Doktor koruyamazsa kurban ölür.

### Faz 3: Şafak & Gündüz Tartışması
* Şafak Raporu:
  * Eğer kurban varsa: `☠️ [İSİM] KATLEDİLDİ!` (Kişinin gerçek rolü KESİNLİKLE açıklanmaz!).
  * Eğer Doktor kurtardıysa: `🛡️ DOKTOR SALDIRIYI ÖNLEDİ! - Vampirlerin hedef aldığı [İsim] doktorun korumasıyla hayatta kaldı!`
* 2 Dakikalık Gündüz Tartışması: Köy meydanında şüpheliler tartışılır. Çoğunluk isterse "Oylamaya Geç" butonuyla erken mahkemeye gidilir.

### Faz 4: Mahkeme & Oylama (Yargılama)
* Herkes hayattaki birine oy verir veya "Pas / Kimseyi Asma" der.
* En çok oyu alan kişi idam edilir; eşitlikte kimse asılmaz.
* **KRİTİK GİZLİLİK KURALI (Rol Açıklanmaz):** Asılan kişinin gerçek rolü ASLA ekranda veya loglarda açıklanmaz! Kişinin gerçek kimliği mezara gömülür, böylece vampirler masum rolü yapmaya devam edebilir, köy paranoyası canlı kalır.

### Faz 5: Zafer Kontrolü & Oyun Sonu
* **Köylüler Kazanır:** Tüm vampirler asıldığında.
* **Vampirler Kazanır:** Vampir sayısı masum sayısına eşitlendiğinde veya geçtiğinde.
* **Oyun Sonu Ekranı:** Sadece maç tamamen bittiğinde tüm oyuncuların gerçek rolleri ve kartları açılır.

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

---

## 8. Görsel & Sanatsal Çerçeveleme Sistemi (Collectible Card Deck Architecture)
- **Tasarım Dili:** Hearthstone / Magic: The Gathering tarzı gotik karanlık fantazi koleksiyon kartı.
- **Kart Formatı:** 848x1264 px (2:3 dikey tarot oranı).
- **Çerçeve Elemanları:**
  - Siyah katedral taşı & antik altın filigranlar.
  - Köşelerde oyulmuş gargoyle heykelleri ve koyu kırmızı yakut taşlar.
  - Alt kısımda her rolün ve köylü memesinin adının kazındığı antika pirinç isim plaketi (`KÖYLÜ - Halay Başı Dayı`, `VAMPİR - Gecenin Efendisi` vb.).
- **Fotoğraf Bütünlüğü:**
  - Ham Türk köylü fotoğrafları yapay zekayla bozulmadan doğrudan katedral kemerine oturtulmuş; 4 köşe pencerelerin arkasında kalarak sert dikdörtgen kenarları gizlenmiştir.
- **Kart Arkası:**
  - Kanlı Ay, gargoyle kanatları ve simya astroloji çemberiyle gotik tarot mührü.
