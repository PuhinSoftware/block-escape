# Block Escape v0.6.2 — teknik ve test raporu

Başlangıç: `origin/main` / `fa01b5eff1add090e130ff1622a644ed40d73b49` (v0.6.1).
Dal: `feature/block-escape-v0.6.2-timer-stars`.

## Uygulama

- 550 ms easing ile tek parça altın doluluk barı. CSS transform geçişi, yeni hedef
  geldiğinde mevcut çizilmiş konumdan sürer; DOM/bar her hamlede yeniden yaratılmaz.
  Çıkış animasyonu tamamlandıktan sonra başarılı çıkarılan / ilk blok sayısı
  hesaplanır. Çarpışma barı azaltmaz veya ilerletmez. Üç eşit ilerleme eşiğinde
  yıldız parıltısı; azaltılmış harekette geçiş ve parıltı kapalı.
- Performans puanı `engine/performance.js` içinde bağımsızdır. Süreli bölümde
  üç can + üç-yıldız süresi => 3; en az iki can + iki-yıldız süresi => 2;
  diğer başarılı bitiş => 1. Süresiz bölümde kalan can sayısı kullanılır.
  Başarısızlıkta puan yoktur. Süre eşikleri JSON'da yapılandırılabilir.
- En iyi puanlar `blockEscapeBestStarsV062` anahtarında sürümlü JSON olarak,
  `v06`, `collision`, `timer` ad alanlarıyla ayrılır. Düşük puan yüksek puanı
  ezmez. Eski kayıt anahtarları silinmez veya taşınmaz; erişim reddi oyunu bozmaz.
- En fazla bir zamanlayıcı, monotonik saat ve durum geçişinde senkronizasyon.
  Menü, diyalog, açılış, çıkış/çarpışma animasyonu, gizli sekme, pagehide ve
  terminal durumlarda süre durur. Süresiz bölümlerde periyodik döngü çalışmaz.
  Sıfırda tek TIME'S UP! ekranı; negatif süre yoktur. Retry süre/can/barı sıfırlar.
  Üç can kaybının LEVEL FAILED davranışı korunur.
- Ana menü grafikleri, maden varlıkları ve hareket kuralları değiştirilmedi.
  Normal 25 bölüm, katalog ve çarpışma laboratuvarı JSON dosyaları main ile
  birebir aynıdır. UNDO eklenmedi.

## Laboratuvar

`?lab=timer`, çarpışma laboratuvarındaki doğrulanmış düzenleri ayrı JSON paketinde
kullanır. Amaç süre davranışını izole doğrulamaktır; bunlar yeni üretim dengesi
veya yeni 25 bölüm değildir. Normal 25 bölüm hâlâ süresizdir.

| Test | Süre | Blok / minimum hamle | 3 / 2 yıldız zaman eşiği |
| --- | --- | --- | --- |
| 1 | Süresiz | 3 / 3 | Kalan can |
| 2 | 45 sn | 5 / 5 | 25 / 40 sn |
| 3 | 40 sn | 6 / 6 | 22 / 36 sn |
| 4 | 35 sn | 6 / 6 | 20 / 31 sn |
| 5 | 30 sn | 12 / 12 | 18 / 27 sn |

Çözümler: [tekrarlanabilir JSON raporu](timer-lab-v062.json).

## Testler

- Node: 10 bölüm sistemi + 6 çarpışma + 5 süre/yıldız = **21 başarılı test**.
- Seed tekrar üretimi, normal 25 bölüm, 5 çarpışma ve 5 süre laboratuvarı
  doğrulayıcıları başarılı. JavaScript sözdizimi ve `git diff --check` başarılı.
- Node sahte monotonik saati ve Playwright fake clock ile: açılış, gerçek çıkış
  animasyonu, busy kilidi, menü/picker, gizli sekme simülasyonu, süre bitişi,
  tekrar deneme, başarıda durma, puan eşikleri ve en iyi kaydın reload sonrası
  korunması doğrulanır. Arka plan testi `document.hidden` ve visibilitychange
  simülasyonudur; fiziksel telefon uygulama geçişi testi değildir.
- Yeni mobil test 320/375/390/430 px'de gerçek Chromium dokunma olaylarıyla beş
  laboratuvarı tamamlar. Hareket açıkken gerçek CSS ara doluluk matrisi ve devam
  eden dolumun yeni hedefe yönelmesi ölçülür. İlk/orta/son durumda 36 kare hücre,
  blok sınırları, HUD çakışması ve yatay taşma denetlenir.
- İlk geliştirme koşusunda bir Node yüzde karşılaştırması kayan nokta yuvarlaması
  nedeniyle başarısızdı; toleranslı sayısal karşılaştırma ile düzeltildi.
- İlk toplu koşuda `mobile-grid` 430 px reset kontrolü başarısızdı: hücre belge
  Y konumu 400 px kalırken dokunma sayfayı 15 px kaydırdı (viewport Y: 400→385).
  Test, diğer geometri testleri gibi belge koordinatlarına geçirildi; karelik,
  boyut, konum ve blok/hücre sınırlama kontrolleri korunuyor.

WebKit denemesi **başlatılamadı**: `webkit-2336/pw_run.sh` bu ortamda yok.
Safari/iPhone veya fiziksel Android üzerinde test edildiği iddia edilmez.
Chromium dokunma emülasyonu ve CSS uyumluluk incelemesi gerçek cihaz testinin
yerine geçmez. [WebKit çıktısı](v062/webkit.log), [Node çıktısı](v062/node.log).

Ekran görüntüleri çalışma ortamında `/tmp/block-escape-v062/` altında:
`chromium-timer-320.png`, `chromium-timer-375.png`, `chromium-timer-390.png`,
`chromium-timer-430.png`, `chromium-timer-progress-390.png`,
`chromium-timer-victory-390.png`. PNG'ler uygulama varlıklarına eklenmedi.

## Son toplu koşu

**13/13 Chromium paketi başarılı, süreç çıkış kodu 0.**
`browser`, `animations`, `board-geometry`, `mobile-grid`, `menu`,
`reference-menu`, `settings`, `gameplay-ui`, `crystal-mines`, `art-upgrade`,
`level-system-browser`, `collision-browser`, `timer-stars-browser`.
[Toplu koşu çıktısı](v062/chromium.log).

Normal 25 bölüm, her mobil genişlikte 375 gerçek dokunma hamlesiyle
(toplam 1.500) tamamlandı. Ayrıca karelik/taşma stres testleri, yükleme hataları,
proje alt dizini, kayıt/ses hata durumları ve beş çarpışma laboratuvarı geçti.
Yeni süre laboratuvarı dört genişlikte beş bölümün tamamını oynadı.
Son koşuda başarısız Node veya Chromium testi yok; WebKit yukarıdaki ortam
kısıtı nedeniyle doğrulanamadı. 320 ve 390 px başlangıç, 390 px yarı doluluk ve
başarı ekranları görsel olarak incelendi. Main'e merge veya yayınlama yapılmadı.
