# MVP: Bemowo Survivors

Nov 16, 2026 · @Adrian

## Cel

Jedna 10-minutowa runda, która działa w przeglądarce i jest grywalna od początku do końca. Nic więcej.

## Technologia

- **Phaser 3 + czysty JS, bez bundlera.** Phaser ładowany z pliku lub CDN, fizyka Arcade.
- **Dlaczego Phaser 3, a nie nowszy:** modele AI znają go najlepiej, co przy vibe codingu ma znaczenie.
- **Hosting:** GitHub Pages. Bez własnych nagłówków i bez problemu.
- **Ekran: pion albo poziom.** Domyślnie pion 720×1280, w ustawieniach (w siłowni) można przełączyć na poziom 1280×720; wybór siedzi w `save.orientation`. Gra skaluje się do okna (`Scale.FIT`), przy innym kształcie okna są czarne pasy. Liczby zależne od kształtu ekranu: portretowe w zwykłym config, poziome nadpisania w `config.layouts.landscape`, wstawiane przez `src/systems/layout.js`. W pionie karty level upu i skrzyni leżą jedna pod drugą, w poziomie obok siebie; siłownia w poziomie ma dwie kolumny wierszy i przycisk startu w prawym dolnym rogu. W rundzie orientacji się nie zmienia (świat rundy jest zbudowany pod jeden kształt), pauza mówi, że robi się to w siłowni. Czcionka wszystkich tekstów: Not Jam Mono Clean 16 (CC0, `assets/font`).
- **Ekran ładowania.** Od pierwszej chwili (zanim wczyta się Phaser) strona pokazuje kółko, „Ładowanie…” i pasek postępu z `index.html`; BootScene wypełnia pasek i usuwa ekran, gdy wszystko jest wczytane. Potem jest „Kliknij, aby zacząć”.
- **Pauza i ustawienia** (`SettingsScene`). W rundzie przycisk pauzy obok zegara albo Esc zatrzymuje grę i otwiera ekran „Pauza”; w siłowni to samo robi zębatka obok tytułu. Na ekranie: głośność muzyki i efektów (−/+ co 10%, zapis w `save.musicVolume` i `save.sfxVolume`), „Wznów”/„Wróć” albo Esc. Gdy są otwarte karty level upu albo skrzynia, pauza się nie otwiera. Poza rundą jest tam też wybór ekranu: Pion / Poziom. M dalej wycisza wszystko. Liczby w `config.ui.settings`.

## Zakres

MVP to bazowy Bartek z pistoletem, 2 typy zombie, XP z 5 ulepszeniami i jedna runda na czas.

### Gracz

- Ruch WASD i strzałkami, 100 HP.
- Na telefonie wirtualny joystick: pojawia się tam, gdzie dotkniesz ekranu.
- Po trafieniu 0,5 s nietykalności, bo bez tego horda zabija w ułamek sekundy.
- Sprite: statyczny obrazek całego Bartka.

### Broń: pistolet

- Strzela sam w najbliższego zombie w zasięgu (co 0,6 s, liczby w `config.weapons.pistol`).
- Pocisk znika po pierwszym trafieniu.
- Wersja 3: pistolet to pierwsza broń z `src/data/weapons.js`, Bartek ma go od startu. Kolejne poziomy pistoletu przychodzą jako karty i dają +1 pocisk na strzał (dawna karta "Dodatkowy pocisk"). Bartek trzyma narysowany pistolet, obrócony w stronę celu; przy strzale pocisk wylatuje z lufy, jest błysk i łuska (rysowane w kodzie) i dźwięk z paczki `assets/muzzle-flash-pixel-fx-v1` (CC0).

### Wrogowie

| Typ | Prędkość | HP | Obrażenia przy dotyku | Pojawia się od |
| --- | --- | --- | --- | --- |
| Zombie | wolny (1x) | 10 | 15 | 0:00 |
| Biegacz | 2x szybszy | 4 | 15 | 1:00 |

- Spawn poza ekranem, w pierścieniu wokół gracza. Częstotliwość rośnie z czasem.
- Krzywa trudności (wersja 3): spawn na sekundę rośnie po krzywej, spokojnie na początku i najmocniej pod koniec. HP zwykłych wrogów rośnie z każdą minutą rundy (boss ma stałe HP). Kolejne poziomy drożeją szybciej niż liniowo. Spawn jest szybszy, niż pistolet nadąża zabijać, więc wokół Bartka zbiera się horda; za to pojedynczy dotyk zwykłego wroga boli mało. Co 45 s pierścień wrogów otacza Bartka, większy z każdą falą. Cel: horda rośnie przez całą rundę (ok. 10-30 wrogów na ekranie w 1.-2. minucie, ponad 100 w drugiej połowie), gracz bez siłowni przeżywa ok. 4-5 minut, a pełna siłownia z dobrymi kartami wygrywa.
- **Zmiana planu (v2):** wrogowie to warianty Bartka. Zombie to zombie-Bartek, biegacz to Uncanny, a silniejsze zombie to kolejne warianty: Joker (od 3:00) i Homelander (od 5:00). Większy obrazek = silniejszy wróg. Nowi wrogowie w przyszłości to też warianty Bartka. Do tego klapa bagażnika (od 4:00). Liczby w `config.enemies` i `config.boss`. **Zmiana planu (v3):** boss Golf został usunięty z gry; bossowie to powiększone wersje zwykłych wrogów (krok 26).
- Wersja 3: Goblin Bartek (od 1:30) przychodzi stadem 3-5 sztuk z jednego punktu pierścienia, szybki i kruchy. Sportakus (od 4:00) idzie powoli, a co kilka sekund, gdy Bartek jest blisko, staje, miga na czerwono i doskakuje tam, gdzie Bartek stał (znacznik celu w miejscu lądowania, kurz przy wybiciu). Ruch szarży (stop, miganie, rzut w zapamiętany punkt) jest w `src/systems/charge.js`, żeby bossowie mogli go użyć ponownie.
- Bossowie (wersja 3): powiększona wersja zwykłego wroga z jego zachowaniem (Wielki Sportakus też doskakuje). 2:30 Wielki Zombie, 4:30 Wielki Sportakus, 6:30 Wielki Joker, 9:30 Wielki Homelander; liczby w `config.boss.list` (typ bazowy, skala, mnożniki HP, prędkości i obrażeń, minuta, skrzynia, białko). 2 s wcześniej baner „UWAGA: …” i muzyka bossa. U góry pasek HP z nazwą bossa; gdy na mapie jest kilku, pasek pokazuje najnowszego. Po śmierci: wybuch, deszcz kryształów, czerwony gem, białko na koniec rundy i skrzynia, która leży aż do podniesienia. Skrzynia otwiera osobny ekran: karty przewijają nazwy ulepszeń i zatrzymują się po kolei, każde ulepszenie (z wylosowaną rzadkością) działa od razu; liczba ulepszeń 1-3 zależy od bossa. Gdy w tej samej chwili czekają karty level-upu, skrzynia otwiera się po nich. Debug: `config.debug.bossKey`, klawisz B, potem cyfra.
- Limit 250 wrogów na ekranie, żeby gra nie klatkowała.

### XP i level up

Zabity zombie zostawia kryształ, który przyciąga się do gracza z niewielkiego zasięgu. Kryształy są rysowane w kodzie jako wielokąty z fasetami i białym błyskiem, każdy typ wroga wypada innym: zielony romb = 1 XP (zombie, biegacz, klapa), niebieski sześciokąt = 3 (Joker), żółty pięciokąt = 5 (Homelander), szary ośmiokąt = 10, czerwony szlifowany klejnot = 25 (bossowie). Gdy na mapie leży za dużo kryształów, najstarsze łączą się w jeden o sumie wartości, w kolorze najwyższego gema, który się mieści. Monety (rysowane: obwódka i hantla; czerwona 1, srebrna 3, złota 10) to rzadki drop z wrogów: dają białko, doliczane na końcu rundy i pokazane osobno na ekranie końca gry. Przy level upie gra się pauzuje i pokazuje 3 losowe karty: pasywki (tabela poniżej), karty broni (sekcja "Bronie") i Bartkowanie (karta bez slotu). Wersja 3 (krok 30): karty statystyk Obrażenia, Szybkostrzelność, Szybkość ruchu i Max HP zastąpiły pasywki, a Ul jest bronią (start: 2 pszczoły).

Pasywki (`src/data/passives.js`, liczby w `config.passives`): karty z rzadkością (rzadsza = większy skok), do 4 naraz; po zapełnieniu slotów wypadają tylko kolejne poziomy posiadanych. HUD pokazuje je w rzędzie nad slotami broni. Odblokowania liczy `save.stats` (łącznie ze wszystkich rund), sprawdzane na końcu rundy. Debug: `config.debug.givePassives` (lista id) daje je na start i odblokowuje; nakładka balansu (`config.debug.balanceOverlay`) pokazuje wszystkie statystyki.

| Pasywka | Na poziom (zwykła karta) | Max | Odblokowanie |
| --- | --- | --- | --- |
| Kreatyna | +10% obrażeń | 5 | od startu |
| Kawa z Żabki | -8% czasu odnowienia | 5 | od startu |
| Buty z bazaru | +8% szybkości | 5 | od startu |
| Gainer | +20 max HP i leczenie | 5 | od startu |
| Hantle w plecaku | +10% obszaru (pociski, chmury, promienie, tarcze, orbita pszczół) | 5 | od startu |
| Bilet miesięczny ZTM | +1 pocisk, chmura, promień, tarcza i pszczoła | 2 | od startu |
| Karnet na siłownię | +10% czasu działania (chmury gazu i znajdźki) | 5 | od startu |
| Rosół babci | +0,3 HP/s | 5 | 20 zjedzonych pierogów łącznie |
| Kurtka puchowa | -1 obrażeń z dotyku (min. 1) | 5 | 2000 przyjętych obrażeń łącznie |
| Koniczyna z trawnika | +10% szczęścia (rzadsze karty, więcej monet) | 5 | 10 złotych monet łącznie |
| Zeszyt w kratkę | +8% XP | 5 | 30 poziom w rundzie |
| Wór na kryształy | +20% zasięgu przyciągania | 5 | od startu |

### Znajdźki czasowe (wersja 3)

Oprócz rzadkich znajdziek z wrogów (OLX, Photoshop) są znajdźki typowe dla gatunku: Magnes z lodówki (wszystkie kryształy lecą do Bartka), Zimny prysznic (zwykli wrogowie stoją i nie zadają obrażeń, boss i klapy nie), Przedtreningówka (x2 szybkostrzelność), Bańka (brak obrażeń) i Pierogi w domu („Mamy KFC w domu”, leczenie). Wypadają z wrogów i co ok. 35 s jedna leży sama na mapie, poza ekranem; strzałka na krawędzi ekranu wskazuje najbliższą. Aktywne efekty widać w HUD (ikonka i pasek czasu). Dane w `src/data/pickups.js`, liczby w `config.pickups`.

### Runda

- Licznik 10:00. Przeżyjesz, to wygrałeś.
- Śmierć daje ekran końca ze statystykami (czas, zabici, level) i przycisk "Jeszcze raz".
- Pierwsze uruchomienie (licznik `save.runsPlayed` równy 0) prowadzi z intro prosto do rundy, bez siłowni. Po pierwszej rundzie przycisk "Siłownia" na ekranie końca pulsuje, a od drugiej rundy intro prowadzi do siłowni.
- HUD: panel w lewym górnym rogu (HP z serduszkiem, XP z odznaką poziomu, pasek czołgu), w prawym górnym rogu kolumna: zegar, zabici, białko z monet; pod nimi pasek bossa, a pod nim aktywne efekty (ikonka, nazwa, pasek czasu); na dole po lewej sloty broni, a nad nimi sloty pasywek, oba z poziomem. Banery znajdziek na panelu, ok. 3 s, z opisem działania. Wszystko rysowane przez `src/systems/ui.js`.

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
| Metal bagażnikowy | Latające klapy bagażnika (3x obrażenia), blizna po trafieniu klapą (boss Golf usunięty w v3) | v2 |
| Likwidacja rasy | Znajdźka "Ogłoszenie z OLX": rzadko wypada, duży napis LIKWIDACJA RASY przy ogłoszeniu ze zdjęciem gołębia, stado gołębi zabija wszystko na ekranie. Hasło nigdy bez gołębia | v2 |
| Mały B | Znajdźka "Photoshop": duży napis MAŁY B jak przy LIKWIDACJA, Bartek kurczy się na 15 s (mniejszy hitbox, szybszy, słabsze strzały). Opis: "Nie każdy w Gigantach jest gigantem." | v2 |
| Pszczoły (B = Bee, Valheim) | Ulepszenie "Ul": pszczoły krążą wokół Bartka (ten sam kod orbity co Kratos). Opis: "Pszczoły są szczęśliwe." Gdy Bartek jest małym B, pszczół jest 2x więcej | v2 |
| Bartkowanie | Karta z losowym absurdalnym efektem i definicje na ekranie ładowania | v2 |
| Praworządność | Pasywka: zombie przechodzące na czerwonym dostają 2x obrażenia | v2 |

Nazwa i logo Gigantów Programowania oraz cudze postacie zostają tylko w wersji dla znajomych z prywatnym linkiem.

## Bronie

**Zmiana planu:** postacią grywalną jest zawsze zwykły Bartek (`bartek.png`). Zamiast postaci zmieniają się bronie, a warianty Bartka (Joker, Homelander, Uncanny i kolejne) są wrogami, nie postaciami. Lista poniżej to teraz lista broni; nazwa z kolumny "Inspiracja" zostaje jako nazwa broni albo opis karty. Bronie robisz w tej kolejności, ale Tarcza Kapitana odblokowuje się jako ostatnia.

**Zmiana planu (v3): bronie z kart, nie wybór przed rundą.** Jak w gatunku: Bartek zaczyna z pistoletem i nosi do 4 broni naraz (`config.weapons.maxSlots`). Nowa broń wypada jako karta przy level upie ("NOWA BROŃ"), a kolejne poziomy broni też jako karty z rzadkością (rzadsza karta = większy skok). Karta Obrażenia i Szybkostrzelność, siłownia i znajdźki działają na wszystkie bronie. Która broń w ogóle może wypaść, decyduje jej warunek odblokowania: sprawdzany na końcu rundy i zapisany na stałe w `save.unlocks`. Siłownia nie ma wyboru broni. Bronie to dane w `src/data/weapons.js`; HUD pokazuje w lewym dolnym rogu ikonki posiadanych broni z poziomem.

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

- **Gaz rozweselający** (wersja 3, krok 29): co 3 s chmura spada na jednego z 5 najbliższych wrogów, trwa 3 s, co 0,5 s rani wszystkich w środku; obraca się, nad nią wyskakują rysowane „HA”, na końcu blednie. Poziomy dają obrażenia, kolejne chmury, promień i czas (`config.weapons.gas`). Odblokowanie: „Dlaczego taki poważny?”, czyli 30 zabitych Jokerów w jednej rundzie (`run.killsByType`).
- **Laser z oczu** (wersja 3, krok 29): co 2,5 s promień z oczu Bartka (z okularów) w stronę najbliższego wroga, rani wszystkich na linii na całym zasięgu; rysowany w kodzie (poświata, czerwony promień, białe jądro), gaśnie w 0,26 s. Poziomy dają obrażenia, kolejne promienie (do kolejnych najbliższych wrogów), szerokość i zasięg (`config.weapons.laser`). Odblokowanie: „Wzrok, który zabija”, czyli wygrana runda z pokonanym Wielkim Homelanderem (`run.bossesKilled`).
- **Tarcza Kapitana** (wersja 3): leci do najbliższego wroga, odbija się do kolejnych (nietrafionych w tym rzucie), wraca do Bartka i czeka chwilę; obraca się w locie, przy każdym odbiciu `impacts/metal-clang`. Poziomy dają odbicia, obrażenia i kolejne tarcze (`config.weapons.shield`). Odblokowanie, jako ostatnia broń: „Mogę tak cały dzień”, czyli wygrana runda z co najmniej 500 przyjętymi obrażeniami, gdy wszystkie inne bronie są już odblokowane. Grafika `assets/captain_shield.png` to eksport z `captain_shield.aseprite`. Debug: `config.debug.giveWeapon` (id albo lista, np. `['gas', 'laser', 'shield']`) odblokowuje bronie i daje je na start.

## Różnorodność podejść (wersja 3, kroki 30–35)

**Problem.** Każda runda wygląda tak samo:
- start zawsze z pistoletem;
- te same 4 karty statystyk, które dają płaskie „+X%”;
- ta sama mapa i bossowie o tych samych minutach;
- brak decyzji, które coś wykluczają.

Gracz bierze wszystko po kolei, więc buildy się nie różnią.

**Cel.** Każda runda ma zmuszać do kilku wyborów, które się wykluczają. Każda ma mieć inny przebieg i powód, żeby zagrać jeszcze raz. Mechaniki biorę ze sprawdzonych gier gatunku: Vampire Survivors (VS), Brotato, Halls of Torment, Hades. Wszystkie liczby siedzą w `config.js`, treść w `src/data/`. Każda rzecz ma flagę lub klawisz w `config.debug`.

### 1. Pasywki ze slotami (krok 30, z VS i Brotato)

- **Pasywki zamiast kart statystyk.** Karty Obrażenia, Szybkostrzelność, Szybkość ruchu i Max HP znikają. W ich miejsce przychodzą **pasywki**: przedmioty z nazwą-memem, poziomami (karty z rzadkością, jak bronie) i limitem **4 slotów** (`config.passives.maxSlots`).
- **Pula jest większa niż sloty**, więc trzeba wybierać. Po zapełnieniu slotów karty nowych pasywek przestają wypadać i zostają tylko poziomy posiadanych.
- **Nowe statystyki gracza** (jak w VS):
  - obszar: wielkość pocisków, chmur, promieni i tarcz;
  - czas trwania;
  - liczba pocisków;
  - pancerz;
  - regeneracja;
  - szczęście;
  - zysk XP;
  - zasięg przyciągania.

  Bronie czytają je przez helpery sceny (tak jak dziś `weaponDamage` i `weaponCooldown`). Dzięki temu każda pasywka działa na każdą broń.
- **Ul przechodzi do broni.** Z pszczołami na orbicie to broń, nie ulepszenie, więc trafia do `src/data/weapons.js`.
- **Bartkowanie zostaje kartą bez slotu.**
- **Pasywki** (`src/data/passives.js`):

| Pasywka | Statystyka | Na poziom (startowo) | Max | Odblokowanie |
| --- | --- | --- | --- | --- |
| Kreatyna | obrażenia | +10% | 5 | od startu |
| Kawa z Żabki | czas odnowienia broni | -8% | 5 | od startu |
| Buty z bazaru | szybkość ruchu | +8% | 5 | od startu |
| Gainer | max HP | +20 | 5 | od startu |
| Hantle w plecaku | obszar | +10% | 5 | od startu |
| Bilet miesięczny ZTM | liczba pocisków | +1 | 2 | od startu |
| Karnet na siłownię | czas trwania (bronie i znajdźki) | +10% | 5 | od startu |
| Rosół babci | regeneracja | +0,3 HP/s | 5 | zjedz 20 pierogów (łącznie) |
| Kurtka puchowa | pancerz: mniej obrażeń z każdego dotyku | -1 | 5 | przyjmij 2000 obrażeń (łącznie) |
| Koniczyna z trawnika | szczęście: rzadsze karty, więcej monet | +10% | 5 | zbierz 10 złotych monet (łącznie) |
| Zeszyt w kratkę | zysk XP | +8% | 5 | dojdź do 30 poziomu |
| Wór na kryształy | zasięg przyciągania | +20% | 5 | od startu |

Liczniki „łącznie” trzyma `save.stats`, a odblokowania idą do `save.unlocks`, tak jak u broni.

### 2. Kontrola losowania (krok 31, z VS i Brotato)

- **Ekran level upu dostaje trzy przyciski z licznikami:**
  - **Odśwież (R):** nowe trzy karty.
  - **Pomiń (S):** nic nie bierzesz, dostajesz trochę HP.
  - **Wywal (W, potem cyfra):** karta znika z puli do końca rundy.
- **Liczniki na start są małe** (`config.draw`). Siłownia sprzedaje kolejne w nowym ulepszeniu „Plan dnia”.
- **Po co:** Wywalanie pozwala celować w konkretny build, a Odśwież ratuje słabe losowanie.
- **Jak działa (krok 31):**
  - Przyciski stoją pod kartami, każdy z liczbą ładunków; przycisk bez ładunków jest wyszarzony. Na start: 2 Odśwież, 2 Pomiń, 1 Wywal (`config.draw`). Ładunki są w `run.player`, więc liczą się jak inne statystyki: config, potem siłownia.
  - Pomiń leczy o `config.draw.skipHeal` HP i zużywa level up.
  - Wywal: W albo przycisk włącza tryb wywalania (czerwone ramki, podpowiedź pod przyciskami), cyfra albo kliknięcie karty ją wywala, ponowne W anuluje. Wywalona karta trafia do `run.banished`. Nie wraca do końca rundy ani na level upie, ani w skrzyni, ani w „Losowym treningu”. Na jej miejsce wpada nowa karta, inna niż te na ekranie. Wywalona karta broni czy pasywki zabiera też wszystkie jej poziomy. Leczenia (karta-zapychacz) nie da się wywalić.
  - Trzymany klawisz W albo S (ruch) nie odpala przycisków: liczy się tylko świeże wciśnięcie.
  - Siłownia: „Plan dnia”, 3 poziomy, każdy daje +1 Odśwież i +1 Wywal (`config.gym.plan`).
  - Skrzynia nie ma tych przycisków.
  - Debug: `config.debug.drawCharges` (liczba) ustawia wszystkie trzy liczniki na start rundy.

### 3. Ewolucje broni (krok 32, z VS)

- **Warunek:** broń na maksymalnym poziomie plus jej pasywka w slocie.
- **Skąd:** najbliższa skrzynia (boss albo elita) zamiast kart daje **ewolucję**. Broń zmienia się w mocniejszą wersję w tym samym slocie, a pasywka zostaje.
- **Podpowiedzi:** karta broni pokazuje „Ewolucja: + Pasywka”. Ekran końca gry pokazuje odkryte ewolucje.
- Dane to pole `evolution` w `src/data/weapons.js`.

| Broń | + Pasywka | Ewolucja | Co zmienia |
| --- | --- | --- | --- |
| Pistolet | Bilet miesięczny ZTM | Uzi z bazaru | ciągła seria, pocisk przebija 1 wroga |
| Tarcza Kapitana | Kurtka puchowa | Tarcza Bemowa | tarcze bez czekania, każde trafienie leczy 1 HP |
| Gaz rozweselający | Karnet na siłownię | Smog nad Bemowem | chmury nie znikają i powoli płyną za najbliższym wrogiem |
| Laser z oczu | Hantle w plecaku | Wzrok Homelandera | ciągły promień, który obraca się za celem |
| Ul | Rosół babci | Pasieka babci | 2x pszczół, a zabici przez pszczoły czasem zostawiają pierogi |

**Jak działa (krok 32):**
- Pole `evolution` broni: `{ passive, id, name, icon, description, evolve? }`, liczby w `config.weapons.<broń>.evolution`. Ewoluowana broń ma `w.evolved`, a jej zwykłe `update` czyta tę flagę.
- Skrzynia: gdy jakaś broń jest gotowa (maksymalny poziom + jej pasywka w slocie), pierwsza karta skrzyni to ewolucja: złota ramka i napis „BROŃ → EWOLUCJA”. Pozostałe karty są losowane jak zwykle. Jedna skrzynia daje jedną ewolucję, kolejność jak w slotach broni. Po ewolucji jest baner „EWOLUCJA: …”, a ikonka w slocie zmienia się na ewoluowaną (złota ramka).
- Liczby: Uzi strzela co 120 ms pociskami za 60% obrażeń, każdy przebija 1 wroga. Tarcza Bemowa wraca do rzutu bez czekania (złota), każde trafienie leczy 1 HP. Smog: tyle chmur, ile chmur ma gaz, nie znikają, każda płynie 45 px/s za innym wrogiem (szara chmura). Wzrok Homelandera: promienie świecą stale, obracają się 200°/s za celem i palą co 200 ms za 35% obrażeń lasera. Pasieka: 2x pszczół, zabity przez pszczołę zostawia pierogi z szansą 4%.
- Podpowiedź „Ewolucja: Broń + Pasywka” stoi na dole karty broni i karty pasywki (na level upie i w skrzyni), dopóki ta broń nie ewoluowała w tej rundzie.
- `save.evolutions`: odkryte ewolucje. Ekran końca gry pokazuje „Nowa ewolucja: …!” przy pierwszym odkryciu.
- Debug: `config.debug.evolveKey`, klawisz E daje noszonym broniom maksymalny poziom i ich pasywki; następna skrzynia (P z `pickupKey`) ewoluuje pierwszą gotową broń.

### 4. Plan treningowy na start (krok 33, z Brotato i z postaci z VS)

- **Wybór przed rundą.** Po „Na Bemowo!” gracz wybiera 1 z 3 losowych planów (`src/data/plans.js`, nowa scena `PlanScene`).
- **Co daje plan:** wyraźny bonus i wyraźną wadę, czasem też startową pasywkę.
- **Czego plan nie zmienia:** postać zostaje zwykłym Bartkiem, a broni nie wybiera się przed rundą (decyzja nr 1).
- **Pierwsza runda w życiu** idzie bez planu.

| Plan | Plus | Minus | Odblokowanie |
| --- | --- | --- | --- |
| Dzień klaty | +20% obrażeń | -15% szybkości ruchu | od startu |
| Cardio | +20% szybkości ruchu, start z Butami z bazaru | -20 max HP | od startu |
| Na masie | +40 max HP, start z Gainerem | -10% szybkostrzelności | od startu |
| Rzeźba | +25% szybkostrzelności | -30 max HP | wygraj rundę |
| Dzień nóg | 2x zasięg przyciągania, +10% XP | -10% obrażeń | od startu |
| Trening z Unc | +2 Odśwież, +2 Wywal | karty tylko zwykłe | wygraj z 3 pasywkami na max |
| Bartkowanie | Bartkowanie 3x częściej, start z losową pasywką | brak | wypadnij 10 razy na Bartkowanie |
| Lenistwo | +30% XP | wrogowie +15% HP | zgiń przed 2:00 trzy razy |

### 5. Elity i wydarzenia rundy (krok 34, z Halls of Torment i VS)

- **Elity.** Co `config.elites.everySec` jeden zwykły wróg staje się elitą z losową cechą (`src/data/elites.js`). Elita ma większe HP, kolorową obwódkę i nazwę cechy nad głową, a po śmierci zostawia **małą skrzynię** (1 karta albo ewolucja). Cechy:

| Cecha | Działanie |
| --- | --- |
| Szybki | +60% prędkości |
| Pancerny | x4 HP |
| Dzielący się | po śmierci 3 mniejsze kopie |
| Wampir | leczy wrogów obok |
| Złodziej | zbiera kryształy z ziemi; po zabiciu wysypuje je razem z bonusem |

- **Wydarzenia.** Każda runda losuje 3 wydarzenia z puli (`src/data/events.js`) w losowych minutach, poza czasem bossów. Każde zapowiada baner z opisem.

| Wydarzenie | Co się dzieje |
| --- | --- |
| Wycieczka szkolna | 40 goblinów z jednego kierunku |
| Awaria prądu | 20 s ciemności, widać tylko krąg wokół Bartka |
| Złota godzina | 30 s podwójnego XP |
| Kontrola biletów | 3 elity naraz |
| Promocja w Żabce | na mapie stoi sklep: 3 karty za monety białka z tej rundy, więc monety mają sens już w trakcie gry |
| Burza | 15 s piorunów w losowych wrogów |
| Festyn osiedlowy | 3 znajdźki naraz na mapie |
| Deszcz kryształów | kryształy spadają wokół Bartka |

- **Bossowie.** Pierwsze trzy sloty losują bossa z puli (`config.boss.slots`). Wielki Homelander jako ostatni zostaje stały.

### 6. Zakłady z Unc (krok 35, z Hades i z klątwy z VS)

- **Kiedy:** po pierwszej wygranej siłownia dostaje zakładkę „Zakłady z Unc”.
- **Jak działa:** każdy zakład utrudnia rundę i podnosi białko z niej o swój procent. Sumę widać przed rundą i na ekranie końca gry.

| Zakład | Na poziom | Białko | Max |
| --- | --- | --- | --- |
| Szybsze zombie | +10% prędkości | +10% | 3 |
| Grubsze zombie | +20% HP | +10% | 3 |
| Gęstsza horda | +25% spawnu | +15% | 2 |
| Wcześniejsi bossowie | o 30 s | +15% | 2 |
| Bez pierogów | brak leczenia ze znajdziek | +15% | 1 |
| Dwie karty | 2 karty zamiast 3 | +20% | 1 |

- **Nagrody:** wygrane z sumą zakładów od 50% i od 100% odblokowują plan „Trening z Unc” i ostatnie pasywki. Daje to cel po pierwszych wygranych.

### Później (po kroku 37 z mapą)

- **Dzielnice** (z map z VS): Bemowo, Jelonki, Górce, z inną paletą ulic, innym miksem wrogów i inną pulą wydarzeń. Odblokowywane wygranymi.
- **Wyzwanie dnia:** ten sam seed dla wszystkich danego dnia.

## Plan na później

### Rzadkość ulepszeń

Przy każdym level upie każda z 3 kart dostaje losową rzadkość: zwykła, rzadka, epicka albo legendarna. Rzadkość mnoży siłę efektu (np. 1x, 1,5x, 2x, 3x) i ma swój kolor ramki karty. Szansa na rzadsze karty rośnie z poziomem. Rzadkości, ich szanse i mnożniki są w `config.js`, a ulepszenia dalej są danymi: `apply(player, scene, mult)` dostaje mnożnik rzadkości jako trzeci argument, a `description` może być funkcją `(mult) => tekst`. Karty bez liczb (Bartkowanie) mają `rarity: false` i są zawsze zwykłe. Zrobione w kroku 22. Pasuje do pola `weight` z kroku 18 (Bartkowanie), ale to osobna rzecz: `weight` decyduje, która karta wypada, a rzadkość decyduje, jak mocna jest.

### Efekty (rysowane w kodzie)

Efekty nie są z pikselowych paczek (bez kontekstu wyglądały słabo). `src/systems/vfx.js` rysuje w `BootScene` małe białe kształty `fx_*` (kropka, iskra, kłąb dymu, pierścień, celownik, gwiazdka, promienie, plus, płatek śniegu, błysk z lufy, łuska), a każdy efekt w `config.vfx` to kilka warstw: wybuch cząsteczek (liczba, prędkość, czas, skala, kolor, grawitacja, kierunek) albo jeden kształt, który rośnie lub maleje i znika. `playVfx(scene, id, x, y, kąt)` działa w każdej scenie.

W grze są: `hitSpark` (trafienie), `deathPoof` (śmierć wroga), `bossBoom` (śmierć bossa), `targetMark` i `dashDust` (doskok Sportakusa), `gemPickup`, `coinPickup`, `starBurst` (legendarna karta, znajdźka), `vacuumPull` (magnes), `frostNova` (zimny prysznic), `holyHeal` (pierogi), `metalClang` (tarcza), `chestOpen` (skrzynia), `muzzleFlash` i `shell` (pistolet).

Pomysły na później (krok 38), wszystkie rysowane tak samo:
- Błysk przy level upie, leczenie przy karcie Max HP.
- Czołg: kurz spod gąsienic, bańka w czasie nietykalności.
- Klapa: iskry z metalu przy trafieniu Bartka.
- Mały B: kłąb dymu przy zmniejszeniu i powrocie.
- Bartkowanie: krążące gwiazdki przy "Zombie robią przysiady", smugi przy "Moonwalk".
- Mocne trafienie: większe iskry; śmierć wybranych wrogów: plama.
- Ekran wygranej: fajerwerki.

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
