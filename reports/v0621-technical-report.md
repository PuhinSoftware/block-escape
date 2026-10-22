# Block Escape v0.6.2.1 — Premium HUD ve doğru yıldız gösterimi

Temel: güncel `origin/main`, `293c2fa2d105ddccbb1bc42049c5e8c5cc6124ea` (v0.6.2).
Geliştirme dalı: `feature/block-escape-v0.6.2.1-hud-polish`.

## Değişiklikler

- İlerleme paneli gerçek Chromium ölçümünde **48 → 28 px**: %41,7 küçüldü.
  Dış boşluklar da 13 → 9 px; oyun alanı için toplam 24 px kazanıldı.
  İnce taş/lacivert yüzey, turkuaz kristal dolumu ve küçük özgün SVG kristal
  kullanıldı. Dolum yıldız içermiyor; temizlenen / toplam blok sayısı gösteriliyor.
- Tek parça 550 ms transform geçişi ve mevcut görsel konumdan hedef güncelleme
  korundu. Çarpışma ilerlemeyi değiştirmez; Retry sıfırlar. Reduced motion
  dolumu ve potansiyel yıldız geçişlerini anlık yapar.
- Ayrı **POTANSİYEL ÖDÜL** göstergesi saf `potential()` yardımcısından gelir.
  Bu yardımcı mevcut `score()` fonksiyonuna delegasyon yapar; eşikler UI'da
  kopyalanmaz. Can ve geçen aktif süre dışındaki geleceğe ilişkin tahmin yoktur.
  Süre eşiği geçilince veya can kaybedilince olanaksız yıldızlar yumuşakça söner.
  Başarı hâlâ mümkünse alt sınır 1; sıfır can/timeout/failed durumunda 0'dır.
- Gerçek ödüller yalnızca başarı ekranında, **260 ms arayla** ortaya çıkar.
  Kazanılmayan slot boş kalır ve kutlama yapmaz. Sıralı gösterim sonraki bölüm
  veya menü geçişini kilitlemez; diyalog kapanınca bekleyen işler iptal edilir.
- Tek mevcut AudioContext üzerinde özgün geçici Web Audio kristal sesleri:
  1. yıldız 784 Hz; 2. yıldız 988 Hz; 3. yıldız 1175/1480/1760 Hz akoru.
  Bir akor üç osilatör ama **tek ödül sesi**dir. Her ses yaklaşık 190 ms sürer;
  260 ms aralık üst üste binmeyi önler. Kısa yumuşak atak ve azalan gain kullanılır.
  Kaynaklar bitince ayrılır; mute/kapatma/geçiş aktif sesleri durdurur.
- Son hamlenin kullanıcı etkileşimi içinde mevcut ses bağlamı hazırlanır.
  Gecikmeli yıldız işleri context oluşturmaz veya resume çağırmaz. Safari
  oynatmaya izin vermezse ses atlanır; oyun akışı devam eder. Eski bitiş melodisi
  bu sıralı ödül sesleriyle değiştirildi, iki kutlama sesi üst üste çalmaz.

## Korunan alanlar

`levels/` altındaki normal 25 bölüm, çarpışma ve süre laboratuvarlarının tamamı
main ile byte düzeyinde aynı. `engine/rules.js`, `engine/catalog.js`, görsel
varlıklar, çarpışma efektleri ve ana menü dosyaları değişmedi. Kayıt anahtarları,
puan eşikleri, aktif süre hesabı, 3 can, yön kuralları ve 6×6 tahta korundu.
UNDO eklenmedi. Yeni runtime bağımlılığı, ses dosyası veya arka plan müziği yok.

## Test kapsamı

- **24 Node testi:** bölüm sistemi 10, çarpışma 6, süre/yıldız 5, yeni potansiyel
  puan 3. Kesin eşikler, süresiz alternatif, en az bir yıldız/başarısızlık ayrımı,
  can/süre kötüleştikçe potansiyelin artmaması test edilir.
- Seed tekrar üretimi ve normal 25 / çarpışma 5 / süre 5 çözüm doğrulayıcıları.
- Yeni tarayıcı paketi A–H: hatasız 3, tek hata 2, iki hata 1; sıralı gerçek
  yıldız gösterimi ve Web Audio sınırında tam ses sayısı/frekans/zaman grupları;
  aynı tek context; kaynak temizliği; mute ve gösterim sırasında mute;
  erken kapatma/sonraki bölüm iptali; en iyi puanın düşük sonuçla ezilmemesi.
- Sahte saatle 25 saniyelik 3-yıldız ve 40 saniyelik 2-yıldız eşikleri,
  timeout, sıfır can, Retry ve başarısızlıkta ödül sesinin/gösteriminin olmaması.
- Yeni mobil paket: dört genişlikte 28 px yükseklik, metinlerin sığması,
  HUD/can/süre/başlık arasında çakışma olmaması, gerçek ara doluluk matrisi,
  tek hata sonrası iki yıldız, iki yıldızlı sonuç, kare hücreler ve reduced motion.
- Ses API'si yok/reddedilmiş/hata atan durumlarda sonuç ve sonraki bölüm kullanılabilir.
- Eski ses regresyonunun beklenen bitiş notaları yeni ödül dizisine güncellendi;
  ses, kaynak temizliği ve tek context kontrolleri kaldırılmadı.

Node çıktısı: [node.log](v0621/node.log).

## Mobil ölçümler ve görüntüler

| Genişlik | Viewport yüksekliği | Belge yüksekliği | İlerleme paneli |
| --- | --- | --- | --- |
| 320 px | 568 px | 821 px | 28 px |
| 375 px | 844 px | 903 px | 28 px |
| 390 px | 844 px | 918 px | 28 px |
| 430 px | 844 px | 958 px | 28 px |

Yatay taşma yok. **Dikey kaydırma devam ediyor**; Bloop, kare hücreler ve büyük
kontroller korunarak 24 px alan kazanıldı. Tüm ekranın küçük iPhone viewport'una
sığdığı iddia edilmez. Mevcut safe-area kuralları değiştirilmedi.

Görüntüler `/tmp/block-escape-v0621/` içinde:

- `chromium-hud-320.png`, `chromium-hud-390.png` (ayrıca 375/430).
- `chromium-hud-two-potential-390.png`: bir can kaybı, iki potansiyel yıldız.
- `chromium-hud-two-result-390.png`: iki kazanılmış yıldız, üçüncü boş.

İlk görsel incelemede potansiyel etiketinin parlak arka planda kontrastı zayıftı;
koyu kompakt yüzey ve 10 px etiketlerle iyileştirildi. PNG'ler çalışma
artefaktlarıdır; oyunun yükleyeceği varlıklara eklenmedi.

## Ortam sınırları

WebKit çalıştırma denemesi başarısız: kurulu motor dosyası
`webkit-2336/pw_run.sh` bulunmuyor. [WebKit çıktısı](v0621/webkit.log).
Chromium dokunma emülasyonu gerçek iPhone Safari veya Android cihaz testi
olarak sunulmaz. Sesler API sınırında ölçüldü; gerçek hoparlörde/iOS donanımında
akustik dinleme testi yapılmadı. Önceki oturumdaki otomatik onay kullanım limiti
çalıştırmayı engellemişti; devam oturumunda Chromium izni ve çalıştırması sağlandı.

## Değiştirilen dosyalar

- `index.html`, `timer-stars.css`: kompakt panel, kristal, ayrı potansiyel HUD.
- `engine/performance.js`: mevcut scorer'a dayanan saf `potential()`.
- `timer-stars.js`: potansiyel güncelleme, sıralı ödüller ve iptal yaşam döngüsü.
- `star-audio.js` (yeni): mevcut bağlam üzerinde kristal sesleri.
- `game.js`: can kaybı güncellemesi, gesture hazırlığı, mute/diyalog iptal bağlantıları.
- `tests/hud-polish.test.cjs`, `tests/hud-polish-browser.cjs` (yeni).
- `tests/browser.cjs`, `tests/run-browser.cjs`: yeni bitiş sesi beklentileri ve paket kaydı.
- `README.md`, `AGENTS.md`, bu rapor ve `reports/v0621/` test çıktıları.

## Sonuç

**24/24 Node testi ve 14/14 Chromium paketi başarılı; toplu Chromium çıkış kodu 0.**
Paketler: browser, animations, board-geometry, mobile-grid, menu, reference-menu,
settings, gameplay-ui, crystal-mines, art-upgrade, level-system-browser,
collision-browser, timer-stars-browser, hud-polish-browser.
[Toplu Chromium çıktısı](v0621/chromium.log).

Normal 25 bölüm dört genişlikte toplam 1.500 gerçek dokunma hamlesiyle tamamlandı.
Her iki beşli laboratuvar da geçti. Seed/çözüm doğrulayıcıları, sözdizimi ve diff
kontrolleri başarılı. Son HUD görüntüleri 320 ve 390 px'de tekrar görsel olarak
incelendi. Başarısız uygulama testi yok; WebKit kapsamı ortam nedeniyle eksik.
Yalnızca geliştirme dalına commit/push; main'e merge veya deploy yapılmadı.
