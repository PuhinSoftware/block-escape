# Block Escape v0.6.3.1 — zafer sesindeki kesilme

Dal: `feature/block-escape-v0.6.3.1-victory-audio-fix`.
Temel: güncel `origin/main` (v0.6.3, `518c1c0a4334d417b540b13e0877c7bc68fc5e27`).

## Doğrulanan kök nedenler

1. `Manager.effect()` her yeni efektte global `stopEffects()` çağırıyordu.
   Ayrı bir ödül yaşam döngüsü ve bölüm başına zafer koruması yoktu. Eski
   oynatıcıda 0,3. saniyede gelen bir yıldız **veya ikinci zafer çağrısı**,
   çalan zafer kaynağında `stop(0.3)` oluşturdu. İkinci zafer yeni bir kaynak
   başlatıp dosyayı baştan oynattı. Yeni sürüm aynı çağrıları reddeder;
   tek kaynak doğal bitişine kadar açık kalır.
2. Önceden master edilmiş WAV'lara osilatör zarfı uygulanıyordu:
   gain 0,32'den 0,0001'e tüm dosya boyunca üstel olarak indiriliyordu.
   Zafer WAV'ının kendi ayrı notaları ve doğal kuyruğu bu ikinci zarfla
   gereksiz yere bastırılıyordu. Gerçek 1,4 saniyelik dosya OfflineAudioContext
   ile eski ve yeni Manager üzerinden render edildi:

| Ölçüm: çıktı / özgün WAV RMS | Eski oynatıcı | Düzeltilmiş |
| --- | ---: | ---: |
| 0,4–0,6 saniye | 0,010595 | 0,224047 |
| 0,8–1,0 saniye | 0,001806 | 0,224000 |

   Beklenen gain 0,32 × 0,70 = 0,224'tür. Eski zarf orta bölümü yaklaşık
   **21 kat**, geç bölümü **124 kat** fazla kısıyordu. Bu, dosyanın doğal
   notalarını ve sürekliliğini bozabilen doğrulanmış bir oynatıcı hatasıdır.
3. **1/2 yıldız belirtisine özgü ölçüm:** main'in özgün audio-manager,
   timer-stars ve star-audio dosyaları gerçek WAV'larla Chromium'da çalıştırıldı.
   Son yıldız ile zafer başlangıcı arasında 1 yıldızda **0,839 s**, 2 yıldızda
   **0,862 s**, 3 yıldızda **0,090 s** ödül efekti boşluğu ölçüldü. İlk iki yıldızın
   kesilmesi ile sabit zamanlayıcı birlikte, bildirilen 1/2 yıldız ayrımını
   uygulama düzeyinde yeniden üretiyor.
   [Eski sıralama ölçümü](v0631/sequence-before.json).

   Zafer ve müzik restorasyonu sabit 1100/2600 ms zamanlayıcılarına bağlıydı;
   gerçek kaynak tamamlanması izlenmiyordu. Ayrıca ilk/son yıldız ayrımı
   yapılmadan ilk iki ses 220 ms'ye kesiliyordu. Böylece bir veya iki yıldızda
   son yıldız da doğal kuyruğuna ulaşmıyordu. Bunlar süre takibini belirsizleştirdi.

[İptal/tekrar öncesi-sonrası](v0631/interrupt-before-after.json) ·
[Gerçek WAV render karşılaştırması](v0631/render-before-after.json).
Yeni 9 Node regresyonu eski kodda başarısız, düzeltmeden sonra başarılıdır.
[Eski kodla çıktısı](v0631/before-node.log).

**Kanıt sınırı:** Bunlar Node/Chromium'da yeniden üretilen uygulama kusurlarıdır.
Gerçek iPhone'dan ses kaydı veya engine trace'i alınmadığı için bildirilen
her duyumsal kesilmenin tek ve yalnız sebebinin bunlar olduğu iddia edilmez.
Safari'ye özgü bir WebKit hatası teşhis edildiği de iddia edilmez.

## Düzeltme

- Tek mevcut AudioContext üzerinde mantıksal `gameplay` / `reward` kanalları.
  Yeni oyun efekti global iptal yapmaz. Zafer başladıktan sonra başka yıldız,
  oyun sesi veya yinelenen zafer onu değiştiremez. Zafer her denemede en fazla
  bir kez başlar; koruma yeni bölüm/deneme durumunda sıfırlanır.
- Master edilmiş tam WAV'larda sabit gain kullanılır; dosyanın kendi zarfı
  korunur. Tam buffer için `source.stop()` zamanlanmaz; doğal `ended` izlenir.
  Osilatör yedekleri kendi kısa zarflarını korur. Ara yıldızlar 260 ms görsel
  ritim için 220 ms penceresini kullanabilir; **son kazanılan yıldız** her zaman
  tam decode edilmiş dosya süresini kullanır.
- Her cue, bütün kaynakları bitince yalnızca bir kez completion bildirir.
  Son yıldızın gerçek bitişi zaferi başlatır; zaferin gerçek bitişi müziğin
  restorasyonunu başlatır. Sabit zafer/restorasyon gecikmeleri kaldırıldı.
  Normal dosyalı sıra:

| Kazanılan yıldız | Son yıldız dosyası | Zafer dosyası | Restorasyon |
| --- | --- | --- | --- |
| 1 | star_1: 0,58 s, tam | level_win: 1,40 s, tam | Zafer ended sonrası |
| 2 | star_2: 0,64 s, tam | level_win: 1,40 s, tam | Zafer ended sonrası |
| 3 | star_3: 1,00 s, tam | level_win: 1,40 s, tam | Zafer ended sonrası |

- Müzik yalnız GainNode otomasyonuyla kısılıp açılır. Hedef değişmiyorsa
  otomasyon yeniden kurulmaz; hedef değişince mevcut değer tutulur
  (`cancelAndHoldAtTime`, destek yoksa mevcut değerden güvenli fallback).
  Duck/restoration için media.pause/play veya currentTime değişikliği yoktur.
- Menü, sonraki bölüm, SFX mute/sıfır seviye, gizli sekme ve dispose açık iptal
  olarak çalışmaya devam eder. İptal epoch'u, yeniden ses açıldığında eski
  bekleyen ödüllerin dirilmesini engeller. Gizli sekmeden dönüşte sonuç
  yıldızları doğru görünür; iptal edilen sesler yeniden başlamaz.
- Sıfırdan büyük ses seviyesi değişiklikleri kaynakları durdurmaz. Efekt mute
  edildiğinde iptal edilen ödül müziğin duck durumunu da serbest bırakır.
  Ses eksik/reddedilmişse görsel sonuç ve sonraki bölüm kilitlenmez.

## Korunan alanlar

Ses ayarı anahtarı/default'lar, ilerleme ve en iyi yıldız anahtarları,
normal 25 bölüm, collision/timer laboratuvarları, puanlama ve hareket
kuralları değişmedi. `game.js` incelendi, değişiklik gerekmedi. Ses dosyaları
byte düzeyinde aynı; yeni ses kütüphanesi veya AudioContext eklenmedi.
UNDO eklenmedi. HTML başlığında sürüm 0.6.3.1 oldu.

## Test kapsamı

- Önceki 29 Node + yeni 9 zafer regresyonu = 38 test.
- Yeni Node: geç yıldız/yinelenen zafer reddi, gerçek 1,4 s doğal bitiş,
  örnek zarfı, tek completion, canlı ses değişimi, mute/sıfır/menu/next/hidden/
  dispose iptalleri. Gerçek PCM WAV header'ları süre kontrolünde kullanılır.
- Yeni Chromium: gerçek WAV decode ve native source start/ended/stop izleme.
  1/2/3 yıldız için tek tam zafer; son yıldız kuyruğu; sonradan yinelenen
  çağrı reddi; müziğin pause/play olmadan akması; canlı müzik/efekt seviyesi;
  offline PCM render gain kontrolü; tüm iptaller ve mute/unmute sırasında
  bekleyen zaferin yeniden başlamaması. Aynı tek AudioContext doğrulanır.
- Önceki ses testi observer'ı completion seçeneklerini de iletir. Eski sabit
  1000 ms beklentisi son yıldızın decode edilmiş süresiyle değiştirildi.
  Fallback ses dizisindeki zafer notaları da artık doğal completion zincirinde
  doğrulanır; eski kontroller kaldırılmadı.
- İlk tam Chromium koşusunda 15/16 paket geçti. HUD testi, yıldızlardan sonra
  hâlâ çalan yeni completion zincirindeki zaferi kaynak sızıntısı saydı. Sabit
  300 ms varsayımı, sahte saati aktif kaynaklar bitene kadar sınırlı adımlarla
  ilerleterek değiştirildi. Kaynak sayısı ve kalıcı bus kontrolü korunuyor;
  düzeltilen HUD paketi ayrıca geçti.
- Tam browser runner 16 paket içerir. Normal bölümler ve her iki laboratuvar,
  kayıt/puanlama, animasyonlar ve 320/375/390/430 px testleri de çalıştırılır.

## WebKit / gerçek cihaz sınırı

WebKit başlatılamadı: `webkit-2336/pw_run.sh` bulunmuyor.
[Çıktı](v0631/webkit.log). Gerçek iPhone Safari veya Android donanım testi ve
hoparlörden dinleme yapılmadı. Chromium native kaynak/PCM ölçümleri gerçek
Safari testi olarak sunulmaz. iPhone'da 1/2/3 yıldızlı bitişlerin yeniden
kullanıcı tarafından dinlenmesi, bu sürümün cihaz doğrulamasında hâlâ gereklidir.

## Değişen dosyalar

`audio-manager.js`, `timer-stars.js`, `star-audio.js`, `index.html`;
`tests/victory-audio.test.cjs`, `tests/victory-audio-browser.cjs` (yeni),
mevcut audio-system/browser/hud-polish test beklentileri ve runner;
`README.md`, `AGENTS.md`, `assets/audio/README.md`, bu rapor ve kanıt çıktıları.

## Sonuç

**38/38 Node testi ve 16/16 Chromium paketi başarılı.** Son toplu browser
koşusu çıkış kodu 0. Paketler: browser, animations, board-geometry, mobile-grid,
menu, reference-menu, settings, gameplay-ui, crystal-mines, art-upgrade,
level-system-browser, collision-browser, timer-stars-browser,
hud-polish-browser, audio-system-browser, victory-audio-browser.

[Node çıktısı](v0631/node.log) · [Son toplu Chromium çıktısı](v0631/chromium.log).

Yeni native testlerde 1/2/3 yıldızın ardından zafer bir kez başladı, kaynakta
hiç `stop()` olmadan gerçek 1,4 saniyelik sonuna ulaştı; son yıldız ile zafer
arasında yapay bekleme yoktu (doğal ended callback'inden sonraki başlangıç
50 ms sınırı içinde). Normal zafer boyunca müzik öğesinde pause/play olmadı.
Nonzero ayar değişiklikleri kaynakları kesmedi; açık iptaller ve mute/unmute
sonrasında yeniden başlamama doğrulandı. Aynı tek AudioContext kullanıldı.

25 normal bölüm dört genişlikte 1.500 gerçek dokunma hamlesiyle oynandı;
iki laboratuvar, kayıt/puanlama ve mevcut geometri/animasyon regresyonları geçti.
Seed tekrar üretimi ve bölüm çözüm doğrulayıcıları, sözdizimi ve whitespace
kontrolleri de başarılı. WebKit kapsamı yukarıdaki ortam eksikliği nedeniyle
sağlanamadı. Yalnızca geliştirme dalına commit/push; main'e merge veya
GitHub Pages yayını yapılmadı.
