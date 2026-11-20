# MVP: Bemowo Survivors

Nov 16, 2026 · @Adrian

## Cel

Jedna 10-minutowa runda, która działa w przeglądarce i jest grywalna od początku do końca. Nic więcej.

## Technologia

- **Phaser 3 + czysty JS, bez bundlera.** Phaser ładowany z pliku lub CDN, fizyka Arcade.
- **Dlaczego Phaser 3, a nie nowszy:** modele AI znają go najlepiej, co przy vibe codingu ma znaczenie.
- **Hosting:** GitHub Pages. Bez własnych nagłówków i bez problemu.

## Zakres

MVP to bazowy Bartek z pistoletem, 2 typy zombie, XP z 5 ulepszeniami i jedna runda na czas.

### Gracz

- Ruch WASD i strzałkami, 100 HP.
- Na telefonie wirtualny joystick: pojawia się tam, gdzie dotkniesz ekranu.
- Po trafieniu 0,5 s nietykalności, bo bez tego horda zabija w ułamek sekundy.
- Sprite: statyczny obrazek całego Bartka.

### Broń: pistolet

- Strzela sam co 0,8 s w najbliższego zombie w zasięgu.
- Pocisk znika po pierwszym trafieniu.

### Wrogowie

| Typ | Prędkość | HP | Obrażenia przy dotyku | Pojawia się od |
| --- | --- | --- | --- | --- |
| Zombie | wolny (1x) | 10 | 15 | 0:00 |
| Biegacz | 2x szybszy | 4 | 15 | 1:00 |

- Spawn poza ekranem, w pierścieniu wokół gracza. Częstotliwość rośnie z czasem.
- **Zmiana planu (v2):** wrogowie to warianty Bartka. Zombie to zombie-Bartek, biegacz to Uncanny, a silniejsze zombie to kolejne warianty: Joker (od 3:00) i Homelander (od 5:00). Większy obrazek = silniejszy wróg. Nowi wrogowie w przyszłości to też warianty Bartka. Do tego klapa bagażnika (od 4:00) i boss Golf (8:00). Liczby w `config.enemies` i `config.boss`.
- Limit 250 wrogów na ekranie, żeby gra nie klatkowała.

### XP i level up

Zabity zombie zostawia kryształ, który przyciąga się do gracza z niewielkiego zasięgu. W v2 kryształy to animowane gemy (CC0, `assets/Coin_Gems`) o różnej wartości: każdy typ wroga wypada innym kolorem. Zielony = 1 XP (zombie, biegacz, klapa), niebieski = 3 (Joker), żółty = 5 (Homelander), czerwony = 10 (Golf). Szary gem i monety (`Moneda*.png`) czekają na pomysł, np. białko jako znajdźka albo skarb z bossa. Przy level upie gra się pauzuje i pokazuje 3 losowe karty z 5 ulepszeń.

| Ulepszenie | Efekt na poziom | Max poziomów |
| --- | --- | --- |
| Obrażenia | +25% | 5 |
| Szybkostrzelność | +15% | 5 |
| Dodatkowy pocisk | +1 pocisk | 5 |
| Szybkość ruchu | +10% | 5 |
| Max HP | +20 HP i leczenie | 5 |

### Runda

- Licznik 10:00. Przeżyjesz, to wygrałeś.
- Śmierć daje ekran końca ze statystykami (czas, zabici, level) i przycisk "Jeszcze raz".
- Pierwsze uruchomienie (licznik `save.runsPlayed` równy 0) prowadzi z intro prosto do rundy, bez siłowni. Po pierwszej rundzie przycisk "Siłownia" na ekranie końca pulsuje, a od drugiej rundy intro prowadzi do siłowni.
- HUD: pasek HP, pasek XP, level, czas, liczba zabitych.

### Memy w MVP (sam tekst, zero kosztu)

- Na start rundy napis "Witamy na Bemowie".
- Przy level upie dymek "Muchacho!" nad Bartkiem.
- Ekran śmierci: "Tu spoczywa Bartosz", a pod spodem małym drukiem "(Bartłomiej)".

## Poza MVP

Nie ruszasz niczego z tej listy, dopóki MVP nie spełni kryteriów z sekcji "Gotowe, kiedy".

- Intro z kuciem metalu i muzyka 8-bit metal
- Siłownia i waluta białko (stałe ulepszenia)
- Memy z mechaniką (sekcja "Bank memów")
- Nowe bronie Bartka (sekcja "Bronie")
- Przeszkody na mapie

## Bank memów

Każdy mem jest podpięty pod istniejący system, żeby nie mnożyć kodu. Do MVP wchodzi tylko sam tekst.

| Mem | Mechanika | Wersja |
| --- | --- | --- |
| Witamy na Bemowie | Napis na start rundy | MVP |
| Muchacho | Dymek przy level upie; w v2 też przy killstreaku i czołgu | MVP |
| Bartosz | Ekran śmierci "Tu spoczywa Bartosz (Bartłomiej)" | MVP |
| Intro | "BEMOWO" wjeżdża z kuciem metalu, potem "SURVIVORS", potem muzyka 8-bit metal | v2 |
| Siłownia | Stałe ulepszenia kupowane za białko między rundami | v2 |
| Unc | Opisy ulepszeń siłowni ("Okulary do czytania: +20% zasięgu", "Rozgrzewka 15 minut") i dymki "Za moich czasów..." | v2 |
| Czołg | Ultimate ładowany zabójstwami, 10 s rozjeżdżania hordy | v2 |
| Metal bagażnikowy | Latające klapy bagażnika (3x obrażenia), boss Golf z otwartym bagażnikiem, blizna po trafieniu klapą | v2 |
| Likwidacja rasy | Znajdźka "Ogłoszenie z OLX": rzadko wypada, duży napis LIKWIDACJA RASY przy ogłoszeniu ze zdjęciem gołębia, stado gołębi zabija wszystko na ekranie. Hasło nigdy bez gołębia | v2 |
| Mały B | Znajdźka "Photoshop": duży napis MAŁY B jak przy LIKWIDACJA, Bartek kurczy się na 15 s (mniejszy hitbox, szybszy, słabsze strzały). Opis: "Nie każdy w Gigantach jest gigantem." | v2 |
| Pszczoły (B = Bee, Valheim) | Ulepszenie "Ul": pszczoły krążą wokół Bartka (ten sam kod orbity co Kratos). Opis: "Pszczoły są szczęśliwe." Gdy Bartek jest małym B, pszczół jest 2x więcej | v2 |
| Bartkowanie | Karta z losowym absurdalnym efektem i definicje na ekranie ładowania | v2 |
| Praworządność | Pasywka: zombie przechodzące na czerwonym dostają 2x obrażenia | v2 |

Nazwa i logo Gigantów Programowania oraz cudze postacie zostają tylko w wersji dla znajomych z prywatnym linkiem.

## Bronie

**Zmiana planu:** postacią grywalną jest zawsze zwykły Bartek (`bartek.png`). Zamiast postaci zmieniają się bronie, a warianty Bartka (Joker, Homelander, Uncanny i kolejne) są wrogami, nie postaciami. Lista poniżej to teraz lista broni; nazwa z kolumny "Inspiracja" zostaje jako nazwa broni albo opis karty. Bronie robisz w tej kolejności, ale Tarcza Kapitana odblokowuje się jako ostatnia.

| # | Inspiracja | Broń / mechanika | Typ |
| --- | --- | --- | --- |
| 0 | Bazowy | Pistolet z auto-celowaniem | pocisk |
| 1 | Minion | Banany odbijające się od ziemi | pocisk łukiem |
| 2 | Kapitan | Tarcza odbijająca się między wrogami | odbicia |
| 3 | Sportacus | Najszybszy, kopnięcie z doskoku, jabłka leczą | ruch/dash |
| 4 | Joker (Batman) | Gaz rozweselający: chmura zadaje obrażenia co sekundę | strefa |
| 5 | Homelander | Laser z oczu w linii | promień |
| 6 | Uncanny | Aura: zombie zwalniają i uciekają | aura |
| 7 | Gnom | Rozstawia gnomy-pułapki | pułapki |
| 8 | Kratos | Ostrza kręcące się wokół niego | orbita |
| 9 | Goblin (Clash Royale) | Beczka, z której wyskakują goblini sojusznicy | przywołania |
| 10 | Kennedy | Nóż wręcz + strzelba | rozrzut |
| 11 | Purple Guy | Podwójne obrażenia od tyłu, krótkie zniknięcie | ukrycie |
| 12 | Lego | Klocki na ziemi: zombie stają i cierpią | pułapki |
| 13 | Minecraft | TNT + stawianie bloków jako ścian | wybuch + bariery |

Warunki odblokowania broni też są memami, np. aura Uncanny za przetrwanie 60 sekund bez ruszania się, ostrza Kratosa za 1000 zabitych.

## Plan na później

### Rzadkość ulepszeń

Przy każdym level upie każda z 3 kart dostaje losową rzadkość: zwykła, rzadka, epicka albo legendarna. Rzadkość mnoży siłę efektu (np. 1x, 1,5x, 2x, 3x) i ma swój kolor ramki karty. Szansa na rzadsze karty rośnie z poziomem. Rzadkości, ich szanse i mnożniki są w `config.js`, a ulepszenia dalej są danymi: `apply(player, mult)` dostaje mnożnik rzadkości. Pasuje do pola `weight` z kroku 18 (Bartkowanie), ale to osobna rzecz: `weight` decyduje, która karta wypada, a rzadkość decyduje, jak mocna jest.

### Efekty (CC0, `assets/effects`)

Paczka ma ok. 1300 animowanych efektów w 18 kategoriach (48 MB). Każdy efekt ma `sprite-sheet.png` i `manifest.json` z klatkami, czasami i punktem zaczepienia. `src/systems/vfx.js` ładuje tylko efekty wpisane w `config.vfx` i tnie je według manifestu, więc gra nie pobiera całej paczki.

W grze już są: `impacts/hit-spark` (trafienie pociskiem), `impacts/death-poof` (śmierć wroga), `explosions/big-explosion` (Golf zezłomowany).

Pomysły na później:
- `ui/level-up` przy level upie, `ui/gem-pickup` przy zbieraniu kryształu, `holy/holy-heal` przy leczeniu z karty Max HP.
- `scifi/muzzle-flash` przy strzale pistoletu.
- Czołg: `smoke/dash-dust` spod gąsienic, `holy/shield-bubble` w czasie nietykalności.
- Golf: `status/target-mark` w punkcie, w który zaraz szarżuje, `smoke/dash-dust` przy szarży, `impacts/metal-clang` przy otwarciu klapy.
- Klapa: `impacts/metal-clang` przy trafieniu Bartka.
- Mały B: `arcane/polymorph-poof` przy zmniejszeniu i powrocie.
- Bartkowanie: `status/stun-stars` przy "Zombie robią przysiady", `status/haste` przy "Moonwalk".
- Bronie: `nature/poison-cloud` (gaz rozweselający), `scifi/laser-beam` (laser), `explosions/barrel-explosion` (TNT), `lightning/chain-lightning` i `fire/flamethrower` jako nowe bronie.
- Ekran wygranej: `explosions/firework-burst`.

## Architektura

Te decyzje pozwolą dodać wersję 2 bez przebudowy kodu.

- **Sceny:** `BootScene` (ładowanie), `GameScene` (gra), `UIScene` (HUD jako osobna warstwa), `LevelUpScene` (karty), `GameOverScene`.
- **`config.js` ze wszystkimi liczbami:** HP, prędkości, cooldowny, krzywa XP, spawn rate. Balansujesz w jednym pliku.
- **Ulepszenia jako dane:** tablica obiektów `{id, nazwa, opis, maxStack, apply(player)}`. Bartkowanie i ulepszenia unc dojdą jako nowe wpisy, bez nowego kodu.
- **Stan rundy osobno od zapisu:** obiekt `run` resetowany co rundę i na razie pusty `save` na białko i odblokowania. Siłownia podepnie się bez przebudowy.
- **Pooling:** pociski, wrogowie i kryształy jako `Phaser.Group` z `maxSize`, używane ponownie. Bez tego przy 150 zombie przeglądarka zacznie się dusić.

## Kolejność budowy

Każdy krok musi dać się odpalić i przetestować przed następnym. Po każdym kroku commit.

- [ ] 1\. Ruch gracza, kamera za graczem, powtarzalne tło
- [ ] 2\. Spawn zombie, które idą w stronę gracza
- [ ] 3\. Kolizje, obrażenia, HP, nietykalność, game over
- [ ] 4\. Pistolet z auto-celowaniem
- [ ] 5\. Kryształy XP, magnes, pasek XP, level up z pauzą
- [ ] 6\. 5 ulepszeń jako dane, ekran z kartami
- [ ] 7\. Biegacz, rosnący spawn, licznik 10:00, ekran wygranej
- [ ] 8\. HUD, "Witamy na Bemowie", "Muchacho!"
- [ ] 9\. Deploy na GitHub Pages i test na drugim komputerze

## Gotowe, kiedy

MVP jest skończone, kiedy spełnia wszystkie cztery warunki.

- Ktoś, kto nie widział kodu, odpala link i bez tłumaczenia rozumie, co robić.
- Rundę da się przegrać i da się wygrać.
- Przy 250 wrogach gra nie spada wyraźnie poniżej 60 FPS.
- Chcesz zagrać drugi raz. Jeśli nie chcesz, problem jest w balansie (spawn, krzywa XP), a nie w braku funkcji. Napraw go przed czymkolwiek z listy "Poza MVP".

**Realny czas:** 2 do 4 wieczorów przy vibe codingu. Jeśli po 4 wieczorach nie masz kroku 5, coś zostało dorzucone poza zakres.
