# Block Escape v0.6.3 — Audio Experience

Başlangıç: güncel `origin/main`, `199287fe109bb5d5dab4c3a857348f38788a37dd`
(v0.6.2.1 squash merge). Dal: `feature/block-escape-v0.6.3-audio-system`.

Test edilen uygulama commit SHA: `3b8cb7d3a96dbe8db1981018bb20d4f8ec5aa86a`.
Bu rapor ve test çıktıları, uygulamayı değiştirmeyen ayrı bir belge commit’iyle eklenmiştir.

## Mimari ve davranış

- `audio-manager.js`: tek, kullanıcı etkileşiminde oluşturulan AudioContext;
  tek HTML `<audio>` müzik öğesi; bağımsız music/sfx GainNode'ları; decode edilmiş
  küçük efekt önbelleği; sınırlı aktif kaynaklar; ayar ve durum yönetimi.
- `audio-ui.js`: mevcut nota düğmesi artık yalnızca müzik; ayarlarda iki bağımsız
  aç/kapat ve 0–100 native range kontrolü. Klavye Tab döngüsü input'ları da kapsar.
  Varsayılan müzik %30, efekt %70. 44 px dokunma hedefleri korunur.
- OGG/Vorbis önce, MP3 ikinci `<source>`. Kaynaklar ilk izinli oyun girişine
  kadar eklenmez: sadece menü açılınca ses isteği yapılmaz. Arşiv WAV müziğe
  runtime referansı yoktur. Efektler ilk etkileşimde birer kez yüklenip decode edilir.
- Aynı dünyada bölüm geçişi mevcut müzik öğesini ve currentTime'ı korur.
  Menü ve gizli sekme müziği duraklatır; arka planda efekt reddedilir. Daha önce
  etkileşimle açılan ses bağlamı dönüşte yeniden denenebilir. Kapalı müzik açılmaz.
- Başarı/başarısızlıkta müzik ayarlı seviyenin %35'ine yumuşakça kısılır.
  Ödül dizisi ve zafer efekti bittikten sonra eski seviyesine döner. Sonraki bölüm
  veya pencereyi erken kapatma ödül işlerini iptal eder; oyun kilitlenmez.
- Efekt oynatıcı aynı olayın 45 ms içindeki tekrarını ezer; yeni efekt öncekinin
  yerini alır. Dosyalı cue için bir kaynak; sentez yedeğinde en çok üç osilatör.
  Her kaynak sonunda/iptalde disconnect edilir. Sayfadan çıkışta dispose;
  BFCache için persisted pagehide'da duraklatma ve kaynak koruma kullanılır.
- Dünya kaynak tablosu ileride diğer üç dünya için genişletilebilir; tanımsız
  dünyada yanlış müzik çalınmaz. Bu sürümde yalnızca Crystal Mines müziği bulunur.

## Ayarlar ve kayıtlar

`blockEscapeAudioV063` anahtarının `schemaVersion:1` alanları:
`musicEnabled`, `sfxEnabled`, `musicVolume`, `sfxVolume`.
İlk göçte eski `blockEscapeSound=off` her iki kanalı kapalı tutar. Geçerli yeni
ayarlar bundan sonra önceliklidir; eski anahtar **yazılmaz veya silinmez**.
Geçersiz/eksik değerler doğrulanır; seviyeler 0–1 aralığında tutulur.
Depolama reddi oyunu bozmaz; oturum içi ayarlar çalışır. İlerleme ve yıldız kayıt
anahtarları değişmedi. Normal 25 bölüm, iki laboratuvar ve scorer dosyaları
main ile byte düzeyinde aynı kaldı. UNDO eklenmedi.

## Ses olayları

| Olay | Dosya / davranış |
| --- | --- |
| Başarılı çıkış | `sfx/blocks/block_exit.wav` |
| Çarpışma ve can kaybı | `sfx/blocks/collision.wav`, tek ortak uyarı |
| Canların bitmesi | `sfx/results/level_failed.wav` |
| Sürenin bitmesi | `sfx/results/time_up.wav` |
| Kazanılan yıldızlar | `sfx/rewards/star_1.wav`, `star_2.wav`, `star_3.wav` |
| Bölüm zaferi | `sfx/results/level_win.wav`, son yıldızdan sonra |

Pakette bağımsız can-kaybı dosyası yok; ikinci ses uydurmak/çift çalmak yerine
çarpışma sesi bu uyarıyı da karşılar. Yıldızlar yalnızca gerçek performans ödülü
olduğunda çalar; kaynak README'nin eski ilerleme-milestone tarifi uygulanmadı.
v0.6.2.1'in 260 ms yıldız görünme aralığı ve CSS animasyonları korundu. Uzun
kaynakların üst üste binmemesi için ilk iki yıldız 220 ms'lik fade zarfında
çalınır; üçüncü 1 saniyeyi kullanabilir. Zafer, son yıldızdan 1100 ms sonra;
müzik restorasyonu son yıldızdan 2600 ms sonra başlar. Ödül/ses tercihi kapalıysa
kaynak yaratılmaz. Dosya henüz hazır değilse veya yüklenemezse aynı context
üzerinde kısa özgün sentez yedeği kullanılır; geç yüklenen ses sonradan tekrarlanmaz.

## Ses varlıkları

Kullanıcının sağladığı iki ZIP'ten özgün sesler korundu. MP3, önceki hazırlıkta
WAV master'dan 128 kbps olarak üretilmiştir. Her iki sıkıştırılmış müzik tek
kopyadır. Kaynak README'ler ve master arşiv amaçlı tutuldu; büyük WAV indirilmez.
Tüm sesler 32 kHz; müzik stereo, efektler mono PCM16.

| Yol (`assets/audio/`) | Format | Bayt | Saniye |
| --- | --- | ---: | ---: |
| `music/crystal-mines.mp3` | mp3 / mp3 | 1,025,324 | 64.044 |
| `music/crystal-mines.ogg` | ogg / vorbis | 755,584 | 64.000 |
| `sfx/blocks/block_exit.wav` | wav / pcm_s16le | 32,684 | 0.510 |
| `sfx/blocks/collision.wav` | wav / pcm_s16le | 21,164 | 0.330 |
| `sfx/results/level_failed.wav` | wav / pcm_s16le | 89,644 | 1.400 |
| `sfx/results/level_win.wav` | wav / pcm_s16le | 89,644 | 1.400 |
| `sfx/results/time_up.wav` | wav / pcm_s16le | 70,444 | 1.100 |
| `sfx/rewards/star_1.wav` | wav / pcm_s16le | 37,164 | 0.580 |
| `sfx/rewards/star_2.wav` | wav / pcm_s16le | 41,004 | 0.640 |
| `sfx/rewards/star_3.wav` | wav / pcm_s16le | 64,044 | 1.000 |
| `sources/bgm/crystal_mines_ambient_loop.wav` | wav / pcm_s16le | 8,192,044 | 64.000 |

Özgün arşiv CRC ve tüm seslerin ffmpeg decode kontrolleri hazırlıkta geçti.
SHA-256 ve tam metadata: [envanter](../assets/audio/inventory.csv).
Kaynakların provenansı [assets/LICENSES.md](../assets/LICENSES.md) içinde kayıtlı;
paketler ayrıca bir lisans metni içermiyordu.

## Safari ve mobil önlemler / sınırlar

- Gerçek giriş handler'larında context oluşturma/resume ve ilk media.play çağrısı.
  Sonraki gecikmeli efektler context oluşturmaz. play/resume reddi yakalanır.
- iOS'un media.volume kısıtını aşmak için HTML müzik, MediaElementAudioSourceNode
  üzerinden GainNode'a bağlanır; ses seviyesi yalnız HTML volume'a dayanmaz.
- Gizli sekme, pagehide, kesintiye uğramış bağlam ve BFCache dönüşü ele alınır.
  Mute veya görünürlük değişimi devam eden play promise'iyle yarışsa da son tercih
  korunur. Başarısız ses oyun hareketini veya diyalog geçişini bekletmez.
- OGG başarısızlığında gerçek MP3 geçişi ve OGG döngü sınırında oynatmanın devamı
  Chromium'da doğrulandı. MP3 container süresi 64.044 s (encoder delay/padding);
  gerçek cihazda akustik olarak boşluksuz döngü garantisi verilmez.
- **WebKit başlatılamadı:** `webkit-2336/pw_run.sh` kurulu değil.
  [Çıktı](v063/webkit.log). Chromium emülasyonu gerçek iPhone Safari/Android
  cihaz testi değildir. Hoparlör/kulaklıkla akustik dinleme yapılmadı.
- 320/375/390/430 px ayarlar: bağımsız düğmeler, range klavye kullanımı,
  dokunma hedefleri ve yatay taşma denetlenir. Kısa ekranlarda açıklama
  satırları azaltılarak kontroller için yer kazanıldı; gerektiğinde panel
  içi dikey kaydırma kullanılabilir. Oyun tahtası/ana menü görselleri korunur.

## Testler ve düzeltilen durumlar

- Yeni 5 Node testi: varsayılanlar, legacy göç/bozuk kayıt, bağımsız gain,
  tek context, aynı dünya devamı, görünürlük/duck, bounded voices/duplicate
  guard/disposal, reddedilen API. Önceki 24 test ile toplam 29.
- Yeni browser paketi: gerçek OGG + 8 WAV decode; %30/%70 gain; bağımsız mute;
  kaydırıcıların persistence'ı; eski mute/ilerleme koruması; aynı dünya zaman
  devamı; menü/gizli sayfa; 1/2/3 yıldız sayısı; zafer sıralaması; müzik restore;
  failure/timeout ayrımı; OGG loop ve MP3 fallback; dosya/API/play/storage
  hatalarında oynanabilirlik; dört mobil genişlikte kontroller.
- İlk Node koşusu hızlı kapat/aç sırasında pending media.play yarışını buldu.
  Revision kontrolü ile son görünürlük/ayar niyeti korunarak düzeltildi.
- İlk browser koşusu menüde erken ses kaynağı isteğini buldu. Kaynak seçimi
  ilk izinli oynatmaya taşındı. Yumuşak gain dönüşü testinde anlık sabit bekleme
  yerine son gain'e ulaşma beklendi; sahte saat timeout testinde bölümden önce
  kurularak zaman kökeni doğru sabitlendi.
- İlk tam Chromium koşusunda 14/15 paket geçti; alt dizin testinin oyun
  kontrolleri geçmesine rağmen kapanışta devam eden route callback'i kapatılan
  request context'e erişti. Test şimdi sekiz efektin decode'unu ve tüm yönlendirme
  callback'lerinin bitmesini bekler; hatalar bastırılmadan teardown sırası düzeltilir.
- Eski ses testleri yeni müzik-only nota / bağımsız efekt tercihlerine uyarlandı.
  Tek context, kaynak temizliği, ses yok/reddedildi, tüm oyun/geometri kontrolleri
  kaldırılmadı. Efekt bus'ı session boyunca bağlı kalan bir kaynak olarak sayılır.

## Değiştirilen dosyalar

- Yeni `audio-manager.js`, `audio-ui.js`, ses dosyaları ve `assets/audio/` envanteri.
- `game.js`, `collision.js`, `star-audio.js`, `timer-stars.js`: merkezi olay bağlantıları.
- `index.html`, `menu.js`, `menu.css`: müzik öğesi ve bağımsız erişilebilir ayarlar.
- Yeni `tests/audio-system.test.cjs`, `tests/audio-system-browser.cjs`;
  runner ve browser/collision/hud-polish/reference-menu/settings test beklentileri;
  level-system-browser alt dizin testi kapanış sırası.
- `README.md`, `AGENTS.md`, `assets/LICENSES.md`, bu rapor ve test logları.

Ekran görüntüleri: `/tmp/block-escape-v063/chromium-audio-settings-320.png`
ve aynı dizindeki 375/390/430 px karşılıkları.


## Son doğrulama

**29/29 Node testi ve 15/15 Chromium paketi başarılı.** Son toplu Chromium
koşusu çıkış kodu 0; başarısız paket yok. Paketler: browser, animations,
board-geometry, mobile-grid, menu, reference-menu, settings, gameplay-ui,
crystal-mines, art-upgrade, level-system-browser, collision-browser,
timer-stars-browser, hud-polish-browser, audio-system-browser.

[Chromium çıktısı](v063/chromium.log) · [Node çıktısı](v063/node.log).

Normal 25 bölüm dört mobil genişlikte toplam 1.500 gerçek dokunma hamlesiyle
oynandı. Her iki laboratuvar, eski/yeni kayıtlar, bölüm üretimi tekrarlanabilirliği
ve çözüm doğrulayıcıları geçti. Yeni ayar kontrollerinin viewport içinde kaldığı
ve birbirleriyle kesişmediği ayrıca ölçüldü. 320/390 px ayarlar görsel olarak
incelendi; küçük ekran düzeninde onay düğmesi de görünür.

İki ZIP CRC kontrolü ve 10 özgün sesin byte karşılaştırması tekrar başarılı;
MP3 dahil 11 dosya hatasız decode edildi. Sözdizimi ve Git whitespace kontrolleri
başarılı. CSV envanterinin satır sonları LF olarak düzenlendi; sesler değişmedi.
WebKit kurulu olmadığı için Safari/gerçek cihaz ses kalitesi kapsamı eksiktir.
Main'e merge veya yayınlama yapılmadı.
