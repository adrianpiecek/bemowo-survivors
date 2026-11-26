# MVP: Bemowo Survivors

Nov 16, 2026 · @Adrian

## Cel

Jedna 10-minutowa runda, która działa w przeglądarce i jest grywalna od początku do końca. Nic więcej.

## Technologia

- **Phaser 3 + czysty JS, bez bundlera.** Phaser ładowany z pliku lub CDN, fizyka Arcade.
- **Dlaczego Phaser 3, a nie nowszy:** modele AI znają go najlepiej, co przy vibe codingu ma znaczenie.
- **Hosting:** GitHub Pages. Bez własnych nagłówków i bez problemu.
- **Ekran: pion albo poziom.** Domyślnie pion 720×1280, w ustawieniach (w siłowni) można przełączyć na poziom 1280×720; wybór siedzi w `save.orientation`. Gra skaluje się do okna (`Scale.FIT`), przy innym kształcie okna są czarne pasy. Liczby zależne od kształtu ekranu: portretowe w zwykłym config, poziome nadpisania w `config.layouts.landscape`, wstawiane przez `src/systems/layout.js`. W pionie karty level upu i skrzyni leżą jedna pod drugą, w poziomie obok siebie; siłownia w poziomie ma dwie kolumny wierszy i przycisk startu w prawym dolnym rogu. W rundzie orientacji się nie zmienia (świat rundy jest zbudowany pod jeden kształt), pauza mówi, że robi się to w siłowni. Czcionka wszystkich tekstów: Not Jam Mono Clean 16 (CC0, `assets/font`).
- **Ekran ładowania.** Od pierwszej chwili (zanim wczyta się Phaser) strona pokazuje kółko, „Ładowanie…” i pasek postępu z `index.html`; BootScene wypełnia pasek i usuwa ekran, gdy wszystko jest wczytane. Potem jest „Kliknij, aby zacząć”, a przy pierwszym uruchomieniu w jego miejscu pytanie o orientację ekranu.
- **Pauza i ustawienia** (`SettingsScene`). W rundzie przycisk pauzy obok zegara, Esc albo P zatrzymuje grę (i grające efekty dźwiękowe, muzyka gra dalej) i otwiera ekran „Pauza”; w siłowni to samo robi zębatka obok tytułu. Na ekranie: głośność muzyki i efektów (−/+ co 10%, zapis w `save.musicVolume` i `save.sfxVolume`), „Wznów”/„Wróć” albo Esc. Gdy są otwarte karty level upu albo skrzynia, pauza się nie otwiera. Przycisk „Wycisz” / „Włącz dźwięk” (to samo co M), a w rundzie też „Wyjdź do menu”: kończy rundę jak przegraną, ekran końca liczy białko zebrane do tej pory. Poza rundą jest tam też wybór ekranu: Pion / Poziom, oraz „Nowa gra” (krok 41): pierwsze kliknięcie zmienia przycisk na „Na pewno?” i pokazuje ostrzeżenie, drugie kasuje postępy (białko, siłownia, odblokowania, statystyki, zakłady; `resetProgress` w `src/state.js`), zostawia głośność, wyciszenie i orientację ekranu i wraca do ekranu tytułowego z intro. Liczby w `config.ui.settings`.

## Zakres

MVP to bazowy Bartek z pistoletem, 2 typy zombie, XP z 5 ulepszeniami i jedna runda na czas.

### Gracz

- Ruch WASD i strzałkami, 100 HP (od kroku 72: 80 HP).
- Na telefonie wirtualny joystick: pojawia się tam, gdzie dotkniesz ekranu.
- Po trafieniu 0,5 s nietykalności, bo bez tego horda zabija w ułamek sekundy.
- Sprite: statyczny obrazek całego Bartka.

### Broń: pistolet

- Strzela sam w najbliższego zombie w zasięgu (co 0,5 s, liczby w `config.weapons.pistol`).
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
- Bossowie (wersja 3): powiększona wersja zwykłego wroga z jego zachowaniem (Wielki Sportakus też doskakuje). 2:30 Wielki Zombie, 4:30 Wielki Sportakus, 6:30 Wielki Joker, 9:00 Wielki Homelander; liczby w `config.boss.list` (typ bazowy, skala, mnożniki HP, prędkości i obrażeń, minuta, skrzynia, białko). 2 s wcześniej baner „UWAGA: …” i muzyka bossa. U góry pasek HP z nazwą bossa; gdy na mapie jest kilku, pasek pokazuje najnowszego. Po śmierci: wybuch, deszcz kryształów, czerwony gem, białko na koniec rundy i skrzynia, która leży aż do podniesienia. Skrzynia otwiera osobny ekran: karty przewijają nazwy ulepszeń i zatrzymują się po kolei, każde ulepszenie (z wylosowaną rzadkością) działa od razu; liczba ulepszeń 1-3 zależy od bossa. Gdy w tej samej chwili czekają karty level-upu, skrzynia otwiera się po nich. Debug: `config.debug.bossKey`, klawisz B, potem cyfra.
- Limit 250 wrogów na ekranie, żeby gra nie klatkowała.

### XP i level up

Zabity zombie zostawia kryształ, który przyciąga się do gracza z niewielkiego zasięgu. Kryształy są rysowane w kodzie jako wielokąty z fasetami i białym błyskiem, każdy typ wroga wypada innym: niebieski romb = 1 XP (zombie, biegacz, klapa), fioletowy sześciokąt = 3 (Joker), żółty pięciokąt = 5 (Homelander), szary ośmiokąt = 10, czerwony szlifowany klejnot = 25 (bossowie). Gdy na mapie leży za dużo kryształów, najstarsze łączą się w jeden o sumie wartości, w kolorze najwyższego gema, który się mieści. Monety białka (rysowane: złota obwódka i hantla; mała 1, średnia 3, duża 10) to rzadki drop z wrogów: dają białko, doliczane na końcu rundy i pokazane osobno na ekranie końca gry. Przy level upie gra się pauzuje i pokazuje 3 losowe karty: pasywki (tabela poniżej), karty broni (sekcja "Bronie") i Bartkowanie (karta bez slotu). Wersja 3 (krok 30): karty statystyk Obrażenia, Szybkostrzelność, Szybkość ruchu i Max HP zastąpiły pasywki, a Ul jest bronią (start: 2 pszczoły).

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
| Koniczyna z trawnika | +10% szczęścia (rzadsze karty, więcej monet) | 5 | 10 dużych złotych monet łącznie |
| Zeszyt w kratkę | +8% XP | 5 | 30 poziom w rundzie |
| Wór na kryształy | +20% zasięgu przyciągania | 5 | od startu |
| Książka Davida Gogginsa | +5% szansy na trafienie krytyczne | 5 | od startu |
| Płyta Limp Bizkit | +25% obrażeń krytycznych | 5 | od startu |

### Znajdźki czasowe (wersja 3)

Oprócz rzadkich znajdziek z wrogów (OLX, Photoshop) są znajdźki typowe dla gatunku: Magnes z lodówki (wszystkie kryształy lecą do Bartka), Zimny prysznic (zwykli wrogowie stoją i nie zadają obrażeń, boss i klapy nie), Przedtreningówka (x2 szybkostrzelność), Bańka AI (brak obrażeń) i Pierogi w domu („Mamy KFC w domu”, leczenie). Wypadają z wrogów i co ok. 35 s jedna leży sama na mapie, poza ekranem; strzałka na krawędzi ekranu wskazuje najbliższą. Aktywne efekty widać w HUD (ikonka i pasek czasu). Dane w `src/data/pickups.js`, liczby w `config.pickups`.

### Runda

- Licznik 10:00. Przeżyjesz, to wygrałeś.
- Śmierć daje ekran końca ze statystykami (czas, zabici, level) i przycisk "Jeszcze raz".
- Pierwsze uruchomienie (licznik `save.runsPlayed` równy 0) prowadzi z intro prosto do rundy, bez siłowni. Po pierwszej rundzie przycisk "Siłownia" na ekranie końca pulsuje, a od drugiej rundy intro prowadzi do siłowni.
- HUD: panel w lewym górnym rogu (HP z serduszkiem, XP z odznaką poziomu, pasek czołgu), w prawym górnym rogu kolumna: zegar, zabici, białko z monet, monety B; pod nimi pasek bossa, a pod nim aktywne efekty (ikonka, nazwa, pasek czasu); na dole po lewej sloty broni, nad nimi sloty pasywek, oba z poziomem, a nad pasywkami mniejsze ikonki przedmiotów z liczbą. Banery znajdziek na panelu, ok. 3 s, z opisem działania. Wszystko rysowane przez `src/systems/ui.js`.

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
| Likwidacja rasy | Znajdźka "Ogłoszenie z OLX": rzadko wypada, duży napis LIKWIDACJA RASY przy ogłoszeniu ze zdjęciem gołębia, stado gołębi przelatuje przez ekran i zabija wrogów, nad którymi leci, a na koniec resztę widocznych. Hasło nigdy bez gołębia | v2 |
| Mały B | Znajdźka "Photoshop": duży napis MAŁY B jak przy LIKWIDACJA, Bartek kurczy się na 15 s (mniejszy hitbox, szybszy, słabsze strzały). Opis: "Nie każdy w Gigantach jest gigantem." | v2 |
| Pszczoły (B = Bee, Valheim) | Ulepszenie "Ul": pszczoły krążą wokół Bartka (ten sam kod orbity co Kratos). Opis: "Pszczoły są szczęśliwe." Gdy Bartek jest małym B, pszczół jest 2x więcej | v2 |
| Bartkowanie | Losowy absurdalny efekt, który czasem dzieje się sam po level upie, i definicje na ekranie ładowania | v2 |
| Praworządność | Pasywka: zombie przechodzące na czerwonym dostają 2x obrażenia | v2 |

Nazwa i logo Gigantów Programowania oraz cudze postacie zostają tylko w wersji dla znajomych z prywatnym linkiem.

## Bronie

**Zmiana planu:** postacią grywalną jest zawsze zwykły Bartek (`bartek.png`). Zamiast postaci zmieniają się bronie, a warianty Bartka (Joker, Homelander, Uncanny i kolejne) są wrogami, nie postaciami. Lista poniżej to teraz lista broni; nazwa z kolumny "Inspiracja" zostaje jako nazwa broni albo opis karty. Bronie robisz w tej kolejności. (Od kroku 35c Tarcza Kapitana nie ma warunku odblokowania.)

**Zmiana planu (v3): bronie z kart, nie wybór przed rundą.** Jak w gatunku: Bartek zaczyna z jedną bronią (od kroku 35c losowo: Pistolet, Shotgun albo Tarcza Kapitana) i nosi do 3 broni naraz, a Kabura z siłowni dokłada 2 kolejne sloty (`config.weapons.startSlots`, `run.player.weaponSlots`; od kroku 35d). Nowa broń wypada jako karta przy level upie ("NOWA BROŃ"), a kolejne poziomy broni też jako karty z rzadkością (rzadsza karta = większy skok). Karta Obrażenia i Szybkostrzelność, siłownia i znajdźki działają na wszystkie bronie. Która broń w ogóle może wypaść, decyduje jej warunek odblokowania: sprawdzany na końcu rundy i zapisany na stałe w `save.unlocks`. Siłownia nie ma wyboru broni. Bronie to dane w `src/data/weapons.js`; HUD pokazuje w lewym dolnym rogu ikonki posiadanych broni z poziomem.

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

- **Gaz rozweselający** (wersja 3, krok 29): co 3 s chmura spada na jednego z 5 najbliższych wrogów, trwa 2 s, co 0,5 s rani wszystkich w środku; obraca się, nad nią wyskakują rysowane „HA”, na końcu blednie. Poziomy dają obrażenia, kolejne chmury, promień i czas (`config.weapons.gas`). Odblokowanie: „Dlaczego taki poważny?”, czyli 30 zabitych Jokerów w jednej rundzie (`run.killsByType`).
- **Laser z oczu** (wersja 3, krok 29): co 2,5 s promień z oczu Bartka (z okularów) w stronę najbliższego wroga, rani wszystkich na linii na całym zasięgu; rysowany w kodzie (poświata, czerwony promień, białe jądro), gaśnie w 0,26 s. Poziomy dają obrażenia, kolejne promienie (do kolejnych najbliższych wrogów), szerokość i zasięg (`config.weapons.laser`). Odblokowanie: „Wzrok, który zabija”, czyli wygrana runda z pokonanym Wielkim Homelanderem (`run.bossesKilled`).
- **Tarcza Kapitana** (wersja 3): leci do najbliższego wroga, odbija się do kolejnych (nietrafionych w tym rzucie), wraca do Bartka i czeka chwilę; obraca się w locie, przy każdym odbiciu `impacts/metal-clang`. Poziomy dają odbicia, obrażenia i kolejne tarcze (`config.weapons.shield`). Dostępna od startu (od kroku 35c; wcześniej odblokowywana jako ostatnia) i jest jedną z trzech broni startowych. Grafika `assets/captain_shield.png` to eksport z `captain_shield.aseprite`. Debug: `config.debug.giveWeapon` (id albo lista, np. `['gas', 'laser', 'shield']`) odblokowuje bronie i daje je na start.
- **Shotgun** (krok 35c, grafika `assets/Shotgun.png` w ręce Bartka i jako ikonka): co 0,95 s wachlarz 5 śrucin w rozrzucie 40° w najbliższego wroga. Zasięg to 70% zasięgu pistoletu (Okulary z siłowni go zwiększają), śrucina leci najwyżej ten dystans. Śrucina za 10 obrażeń (od kroku 57). Poziomy dają śruciny i obrażenia (`config.weapons.shotgun`). Bez odblokowania, jedna z trzech broni startowych.
- **Topór krasnoluda** (krok 35c, rysowany w kodzie): topór krąży wokół Bartka (`src/systems/orbit.js`, 85 px, 230°/s) i kręci się wokół własnej osi. Każde trafienie odbija wszystkie topory w drugą stronę, nie częściej niż co 150 ms, więc w tłumie topór wahadłowo tnie tam i z powrotem. Rani tego samego wroga najwyżej co 0,4 s. Poziomy dają obrażenia, topory i promień (`config.weapons.axe`). Bez odblokowania, tylko z kart.
- Broń startowa: `config.weapons.start` to lista, gra losuje z niej jedną. Debug: `config.debug.startWeapon` (id) wymusza broń startową.

## Różnorodność podejść (wersja 3, kroki 30–35)

**Problem.** Każda runda wygląda tak samo:
- start zawsze z pistoletem;
- te same 4 karty statystyk, które dają płaskie „+X%”;
- ta sama mapa i bossowie o tych samych minutach;
- brak decyzji, które coś wykluczają.

Gracz bierze wszystko po kolei, więc buildy się nie różnią.

**Cel.** Każda runda ma zmuszać do kilku wyborów, które się wykluczają. Każda ma mieć inny przebieg i powód, żeby zagrać jeszcze raz. Mechaniki biorę ze sprawdzonych gier gatunku: Vampire Survivors (VS), Brotato, Halls of Torment, Hades. Wszystkie liczby siedzą w `config.js`, treść w `src/data/`. Każda rzecz ma flagę lub klawisz w `config.debug`.

### 1. Pasywki ze slotami (krok 30, z VS i Brotato)

- **Pasywki zamiast kart statystyk.** Karty Obrażenia, Szybkostrzelność, Szybkość ruchu i Max HP znikają. W ich miejsce przychodzą **pasywki**: przedmioty z nazwą-memem, poziomami (karty z rzadkością, jak bronie) i limitem **3 slotów**, a Plecak z siłowni dokłada 2 kolejne (`config.passives.startSlots`, `run.player.passiveSlots`; od kroku 35d, wcześniej 4).
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
- **Bartkowanie zostaje kartą bez slotu.** (Po playtestach to już nie karta, patrz sekcja 14.)
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
| Koniczyna z trawnika | szczęście: rzadsze karty, więcej monet | +10% | 5 | zbierz 10 dużych złotych monet (łącznie) |
| Zeszyt w kratkę | zysk XP | +8% | 5 | dojdź do 30 poziomu |
| Wór na kryształy | zasięg przyciągania | +20% | 5 | od startu |
| Książka Davida Gogginsa | szansa na krytyka | +5 pkt proc. | 5 | od startu |
| Płyta Limp Bizkit | obrażenia krytyczne | +25 pkt proc. | 5 | od startu |

Liczniki „łącznie” trzyma `save.stats`, a odblokowania idą do `save.unlocks`, tak jak u broni.

### 2. Kontrola losowania (krok 31, z VS i Brotato)

- **Ekran level upu dostaje trzy przyciski z licznikami:**
  - **Odśwież (R):** nowe trzy karty.
  - **Pomiń (P):** nic nie bierzesz, dostajesz trochę HP.
  - **Wywal (X, potem cyfra):** karta znika z puli do końca rundy.
- **Liczniki na start są małe** (`config.draw`). Siłownia sprzedaje kolejne w nowym ulepszeniu „Plan dnia”.
- **Po co:** Wywalanie pozwala celować w konkretny build, a Odśwież ratuje słabe losowanie.
- **Jak działa (krok 31):**
  - Przyciski stoją pod kartami, każdy z liczbą ładunków; przycisk bez ładunków jest wyszarzony. Na start: 2 Odśwież, 2 Pomiń, 1 Wywal (`config.draw`). Ładunki są w `run.player`, więc liczą się jak inne statystyki: config, potem siłownia.
  - Pomiń leczy o `config.draw.skipHeal` HP i zużywa level up.
  - Wywal: X albo przycisk włącza tryb wywalania (czerwone ramki, podpowiedź pod przyciskami), cyfra albo kliknięcie karty ją wywala, ponowne X anuluje. Klawisze Pomiń i Wywal nie leżą na WASD ani strzałkach, żeby gracz, który jeszcze idzie, nie pominął karty przypadkiem. Wywalona karta trafia do `run.banished`. Nie wraca do końca rundy ani na level upie, ani w skrzyni, ani w „Losowym treningu”. Na jej miejsce wpada nowa karta, inna niż te na ekranie. Wywalona karta broni czy pasywki zabiera też wszystkie jej poziomy. Leczenia (karta-zapychacz) nie da się wywalić.
  - Trzymany klawisz W albo S (ruch) nie odpala przycisków: liczy się tylko świeże wciśnięcie.
  - Siłownia: „Plan dnia”, 3 poziomy, każdy daje +1 Odśwież i +1 Wywal (`config.gym.plan`).
  - Skrzynia nie ma tych przycisków.
  - Debug: `config.debug.drawCharges` (liczba) ustawia wszystkie trzy liczniki na start rundy.

### 3. Ewolucje broni (krok 32, z VS)

- **Warunek:** broń na maksymalnym poziomie plus jej pasywka w slocie.
- **Skąd:** najbliższa skrzynia bossa zamiast kart daje **ewolucję** (od kroku 35b skrzynia elity już nie). Broń zmienia się w mocniejszą wersję w tym samym slocie, a pasywka zostaje.
- **Podpowiedzi:** karta broni pokazuje „Ewolucja: + Pasywka”. Ekran końca gry pokazuje odkryte ewolucje.
- Dane to pole `evolution` w `src/data/weapons.js`.

| Broń | + Pasywka | Ewolucja | Co zmienia |
| --- | --- | --- | --- |
| Pistolet | Bilet miesięczny ZTM | Uzi z bazaru | ciągła seria, pocisk przebija 1 wroga |
| Tarcza Kapitana | Kurtka puchowa | Tarcza Bemowa | tarcze wracają 2,5x szybciej, każde trafienie leczy 1 HP (krok 68) |
| Gaz rozweselający | Karnet na siłownię | Smog nad Bemowem | chmury nie znikają i powoli płyną za najbliższym wrogiem |
| Laser z oczu | Hantle w plecaku | Wzrok Homelandera | ciągły promień, który obraca się za celem |
| Ul | Rosół babci | Pasieka babci | 2x pszczół, a zabici przez pszczoły czasem zostawiają pierogi |
| Shotgun | Kreatyna | Dwururka dziadka | 1,2x śrucin, każda przebija 1 wroga (krok 35c, krok 68) |
| Topór krasnoluda | Buty z bazaru | Młyn krasnoluda | 2x toporów, 1.4x szybciej, 1.3x dalej od Bartka (krok 35c) |

**Jak działa (krok 32):**
- Pole `evolution` broni: `{ passive, id, name, icon, description, evolve? }`, liczby w `config.weapons.<broń>.evolution`. Ewoluowana broń ma `w.evolved`, a jej zwykłe `update` czyta tę flagę.
- Skrzynia: gdy jakaś broń jest gotowa (maksymalny poziom + jej pasywka w slocie), pierwsza karta skrzyni to ewolucja: złota ramka i napis „BROŃ → EWOLUCJA”. Pozostałe karty są losowane jak zwykle. Jedna skrzynia daje jedną ewolucję, kolejność jak w slotach broni. Po ewolucji jest baner „EWOLUCJA: …”, a ikonka w slocie zmienia się na ewoluowaną (złota ramka).
- Liczby (od kroku 68 częściowo inne, sekcja 44): Uzi strzela co 150 ms pociskami za 50% obrażeń, każdy przebija 1 wroga. Tarcza Bemowa wraca do rzutu bez czekania (złota), każde trafienie leczy 1 HP. Smog: tyle chmur, ile chmur ma gaz, nie znikają, każda płynie 60 px/s za innym wrogiem i rani 2x mocniej niż gaz (szara chmura). Wzrok Homelandera: promienie świecą stale, obracają się 200°/s za celem i palą co 200 ms za 30% obrażeń lasera. Pasieka: 2x pszczół, żądła 1,5x mocniejsze, zabity przez pszczołę zostawia pierogi z szansą 4%.
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
| Bartkowanie | Bartkowanie 3x częściej, start z losową pasywką | brak | przeżyj Bartkowanie 10 razy |
| Lenistwo | +30% XP | wrogowie +15% HP | zgiń przed 2:00 trzy razy |

**Jak działa (krok 33):**
- Liczby w `config.plans`, wygląd ekranu w `config.ui.planScreen`. Plan to `{ id, name, plus, minus, unlock, apply(player, run), passive? }`; `passive` to id pasywki na start albo `'random'` (losowa odblokowana).
- Każde wejście do rundy (siłownia, „Jeszcze raz”) idzie przez `startRun` z `PlanScene.js`: przy `save.runsPlayed` 0 prosto do gry, potem przez ekran planów. Wybór kliknięciem albo klawiszami 1-3.
- Plan działa po siłowni, przed kartami rundy (`GameScene.create`). Run-owe przełączniki: `run.commonOnly` (Unc), `run.bartkowanieChance` (Bartkowanie), `run.enemyHpMult` (Lenistwo, tylko zwykli wrogowie, nie bossowie).
- Odblokowania sprawdzane na końcu rundy razem z bronią i pasywkami, trzymane w `save.unlocks`. Liczniki w `save.stats`: `bartkowanie` (Bartkowania, które się wydarzyły) i `earlyDeaths` (przegrane przed 2:00).
- Ekran końca gry pokazuje „Plan: …” i „Nowy plan treningowy: …!”.
- Debug: `config.debug.forcePlan = 'id'` pomija ekran planów i każdą rundę poza pierwszą zaczyna z tym planem (odblokowuje go w zapisie).

### 5. Elity i wydarzenia rundy (krok 34, z Halls of Torment i VS)

- **Elity.** Co `config.elites.everySec` jeden zwykły wróg staje się elitą z losową cechą (`src/data/elites.js`). Elita ma większe HP, kolorową obwódkę i nazwę cechy nad głową, a po śmierci zostawia **małą skrzynię** (1 karta; od kroku 35b bez ewolucji). Cechy:

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
| Chorda nadchodzi | przez 20 s 3x więcej wrogów, wszyscy z jednej strony; przetrwanie daje skrzynię |

- **Bossowie.** Pierwsze trzy sloty losują bossa z puli (`config.boss.slots`). Wielki Homelander jako ostatni zostaje stały.

**Jak działa (krok 34):**
- Elity: liczby w `config.elites`. Co 40 s następny wróg, który pojawia się sam (bez bossów, paczek goblinów i klap), staje się elitą: x5 HP, 1.25x większy, poświata w kolorze cechy (WebGL) i nazwa nad głową. Po śmierci zostawia skrzynię z 1 kartą (od kroku 35b nigdy z ewolucją). Cechy: Szybki +60% prędkości, Pancerny x4 HP (razem x20), Dzielący się: 3 kopie w skali 0.7 z połową HP, Wampir: co sekundę leczy wrogów w promieniu 160 px o 15% ich max HP (bez bossów), Złodziej: idzie do najbliższego kryształu w promieniu 450 px, zabiera te w promieniu 40 px, po śmierci zostawia jeden kryształ wart ich sumę +50%.
- Wydarzenia: liczby w `config.events`. Runda bierze 3 wydarzenia, najpierw te, których nie było w poprzedniej rundzie. Każde startuje w losowej sekundzie między 0:50 a 9:00, co najmniej 60 s po poprzednim i 30 s od każdego slotu bossa. Wydarzenie z czasem trwania ma pasek pod HUD-em.
- Liczby wydarzeń: Burza uderza co 400 ms za 30 obrażeń (przez mnożnik obrażeń broni). Deszcz kryształów to fioletowy kryształ co 60 ms do 380 px od Bartka. Festyn kładzie 3 różne znajdźki 250-450 px od Bartka. Chorda nadchodzi (`config.events.horde`): przez 20 s spawn x3 (mnożony razem z Zakładami z Unc), a każdy punkt na pierścieniu spawnu (też fale i Kontrola biletów) leży w łuku 70° po jednej losowej stronie (`run.hordeAngle`). Na koniec baner „CHORDA ODPARTA!” i skrzynia z 1 kartą (bez ewolucji) 120 px od Bartka.
- Promocja w Żabce: sklep stoi 500-700 px od Bartka przez 45 s, strzałka HUD-u wskazuje go przed innymi znajdźkami. Wejście otwiera `ShopScene`: 3 karty z rzadkością, cena w białku z monet tej rundy (`run.coinProtein`): bez rzadkości 15, zwykła 8, rzadka 15, epicka 25, legendarna 40. Można kupić ile się da, każdą kartę raz. Wydane białko nie wraca na koniec rundy. Po zakupie sklep znika; wyjście bez zakupu zostawia go na mapie, a otwiera się znów, gdy Bartek odejdzie (`events.zabka.leaveDist`) i wróci. Sklep pulsuje i co chwilę wypuszcza zielony pierścień światła (`events.zabka.pulse`, efekt `shopGlow`).
- Bossowie: slot daje minutę, HP (1000, 1600, 2400, 3600), skrzynię i białko. Pule: 2:30 Wielki Zombie, Wielki Uncanny albo Wielki Goblin; 4:30 Wielki Sportakus, Wielki Joker albo Wielki Goblin; 6:30 Wielki Joker, Wielki Sportakus albo Wielki Zombie; 9:00 Wielki Homelander. Ten sam boss nie trafia się dwa razy w rundzie, a skład różni się od poprzedniej rundy.
- Debug: `config.debug.eliteKey` (L: elita obok Bartka, co naciśnięcie kolejna cecha), `config.debug.eventKey` (V, potem 1-8: wydarzenie w kolejności z `events.js`).
- Wydajność: Awaria prądu to jeden obrazek z miękką dziurą, narysowany raz w BootScene. Przy 250 wrogach FPS z nią i bez niej był taki sam (82-88).

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

**Jak działa (krok 35):**
- Zakłady to dane w `src/data/bets.js`, liczby w `config.bets`. Wybrane poziomy siedzą w `save.bets` i działają w każdej rundzie, dopóki gracz ich nie zmieni.
- Siłownia pokazuje przycisk „Zakłady z Unc” (z bieżącą premią) obok „Na Bemowo!” po pierwszej wygranej. Wygrane liczy `save.stats.wins`; stary zapis z odblokowaną Rzeźbą też się liczy. Przycisk otwiera okno `BetsScene` z [−] poziom [+] przy każdym zakładzie, sumą premii i nagrodami. Premia widnieje też na ekranie planu i na ekranie końca gry („zakłady +X%”).
- Działanie: Szybsze zombie mnożą prędkość chodu każdego wroga, też bossów (`z.speed`). Grubsze zombie mnożą HP zwykłych wrogów (`run.enemyHpMult`, razem z planem Lenistwo); HP bossa zależy od slotu. Gęstsza horda mnoży zwykły spawn na sekundę (fale bez zmian). Wcześniejsi bossowie przesuwają każdy slot, a wydarzenia trzymają odstęp od nowych czasów. Bez pierogów: znajdźki z `heals: true` nie wypadają. Dwie karty: level up ma 2 karty (skrzynia i Żabka bez zmian).
- Premia mnoży białko z rundy (zabici, minuty, wygrana, bossowie), monet nie: `proteinForRun` × (1 + suma).
- Nagrody za wygraną (dodatkowa droga, własne warunki zostają): premia od 50% odblokowuje plan Trening z Unc, od 100% wszystkie wciąż zablokowane pasywki.
- Debug: `config.debug.betsUnlocked` pokazuje zakłady bez wygranej.

### 7. Balans późnej gry (krok 35b)

Problem: z nowymi brońmi i ewolucjami po ~2 minutach gra robiła się za łatwa. Rozwiązanie: trudność rośnie z czasem i dostosowuje się po cichu do gracza, a gracz nadal czuje, że rośnie w siłę.

- **Ewolucje tylko od bossów.** Skrzynia elity ma zawsze 1 zwykłą kartę. Ewolucja jest nagrodą za bossa, nie za co drugą elitę.
- **Czytelność ewolucji.** Podpowiedź na kartach pokazuje stan: „Ewolucja: Pistolet 3/5 + Bilet miesięczny ZTM (brak)”, a przy posiadanej pasywce „(masz)”. Gdy broń jest gotowa (max poziom i pasywka w slocie), jej slot i slot pasywki w HUD dostają pulsującą złotą ramkę. Pojawia się też raz baner „BROŃ: GOTOWE DO EWOLUCJI / Pokonaj bossa: jego skrzynia zamieni to w …”. Baner czeka, aż zejdzie baner bossa albo wydarzenia.
- **Elity z dwiema cechami.** Od 5:00 połowa elit ma dwie różne cechy („Szybki + Pancerny”), dwie poświaty i oba efekty. Dotyczy to też Kontroli biletów (`config.elites.doubleAfterSec`, `doubleChance`).
- **Rosnące obrażenia wrogów.** Dotyk każdego wroga (także bossa) zadaje +8% bazowych obrażeń za każdą minutę rundy, czyli x1.8 w 10:00. Pancerz odejmuje się po tym (`config.spawn.damagePerMinutePct`).
- **Ukryta presja Bemowa** (`config.dda`), wartość 0..1. Co 5 s gra patrzy na ostatnie 30 s:
  - **Za łatwo** (Bartek stracił < 10% max HP i średnio < 8 wrogów w promieniu 300 px): presja rośnie o 0.2 na minutę. Działa to dopiero od 1:00 i nie przez 20 s po każdej wziętej karcie (level up, skrzynia, Żabka), żeby gracz poczuł nowe ulepszenie.
  - **Ciężko** (> 30% HP straconego, HP < 35% albo > 30 wrogów wokół): presja spada o 0.1 na minutę.
  - Presja nigdy nie spada poniżej 0, czyli poniżej obecnie ustawionej gry.
  - **Działanie:** spawn i liczebność fal x(1 + presja), HP zwykłych wrogów x(1 + 0.4 × presja). Bossowie bez zmian. Spawn wciąż ogranicza `maxEnemies`.
  - **Nagroda:** średnia presja z rundy × 30% dochodzi do białka (np. +15% przy średniej 0.5). Gracz widzi ją tylko na ekranie końca gry: „Bemowo się zbroiło +X%”. Sama presja jest ukryta.
  - Debug: `config.debug.forcePressure` (liczba) trzyma presję na stałe. Nakładka balansu (`debug.balanceOverlay`) pokazuje presję, mnożniki, utratę HP w oknie, tłok, premię i mnożnik dotyku.

### 8. Poprawki po playtestach (krok 35d)

Zgłoszenia: topór za mocny, czołg przydatny tylko na początku, siłownię da się wymaksować w godzinę, gra za głośna. Nowe mapy i ozdoby ulic idą w kroku 37 i dalej (dzielnice).

- **Topór krasnoluda słabszy:** 8 obrażeń (było 14), ten sam wróg najwyżej co 0,55 s (było 0,4 s), poziomy +3/+4/+4 obrażeń (było +6/+8/+8). Młyn krasnoluda kręci się 1.2x szybciej (było 1.4x).
- **Czołg na całą rundę:** boss, którego dotyka, traci 5% swojego max HP na sekundę (było stałe 50/s, przy ostatnim bossie to 240/s). Przy wejściu do czołgu wszyscy zwykli wrogowie w promieniu 260 px giną od razu (`config.tank.crushRadius`, efekt `bossBoom`). Te zabójstwa nie ładują następnego czołgu.
- **Siłownia na dłużej** (razem ok. 11 000 białka zamiast 1735):
  - Klata, Nogi, Plecy do poziomu 8 (koszty 10, 25, 50, 100, 200, 400, 700, 1000);
  - Okulary i Plan dnia do poziomu 5;
  - **Kabura:** +1 slot broni na poziom, 2 poziomy (250, 600);
  - **Plecak:** +1 slot pasywek na poziom, 2 poziomy (200, 500).
- Sloty: na start 3 broni i 3 pasywek. Przy pełnych slotach karty nowych broni i pasywek nie wypadają, ewolucje działają dalej. HUD rysuje tyle slotów, ile Bartek ma.
- Ekran siłowni: rzędy niższe (112 px), Bartek z cytatem pokazuje się tylko, gdy mieści się nad przyciskiem startu. W pionie przy 8 rzędach się nie mieści, w poziomie tak.
- **Głośność:** `config.audio.masterVolume` 0.4 mnoży wszystkie dźwięki i muzykę (globalna głośność Phasera). Dotyczy też istniejących zapisów; suwaki w ustawieniach działają w tym zakresie.

### 9. Osiedle zamiast szarej kratki (krok 37)

- **Mapa** (`src/systems/map.js`, liczby i kolory w `config.map`): nieskończona siatka kwadratowych bloków 768 px. Każdy blok ma jezdnię 112 px wzdłuż górnej i lewej krawędzi (skrzyżowanie w lewym górnym rogu), więc razem tworzą siatkę ulic. Na jezdniach są przerywane pasy, a na obu końcach każdej jezdni zebra. Działkę otacza chodnik z płytami i krawężnikiem.
- **Rodzaje działek** (losowane z wagą): blok z oknami (dach z wywietrznikami, ściana z oknami, część okien świeci), trawnik z drzewami i wydeptaną ścieżką, parking z miejscami, plac zabaw (piaskownica, zjeżdżalnia, huśtawki). Każdy rodzaj to jedna tekstura rysowana raz w BootScene (`createMapTextures`).
- **Ozdoby** (pula obrazków, bez kolizji, pod postaciami): latarnie co 220 px, kosze, ławki, znaki, zaparkowane auta w różnych kolorach, czasem autobus ZTM, auta na parkingu. Rozkład zależy od seeda z pozycji bloku, więc ten sam blok zawsze wygląda tak samo.
- **Bloki dokładane i zwalniane** wokół Bartka (ekran + 300 px). Zwykle widać 9-12 bloków i ok. 150 ozdób.
- **Światła** na rogu każdego skrzyżowania: zielone 4 s, żółte 1 s, czerwone 4 s, każde w innej fazie.
- **Postacie:** cień pod Bartkiem i pod każdym wrogiem (wróg z puli ma swój cień), lekkie bujanie przy chodzeniu, biały błysk wroga przy trafieniu (60 ms; zamrożenie dalej barwi na niebiesko). Liczby w `config.look`.
- **Ambient:** co 350 ms liść dryfuje nisko nad ziemią gdzieś na ekranie (efekt `ambientLeaf`, kształt `fx_leaf`).
- Szara kratka (`ground`) zniknęła.
- **Wydajność:** czas kroku gry przy 250 wrogach mierzony tak samo przed zmianą i po niej. Przed: ok. 22-33 ms, po: ok. 23-28 ms (panel przeglądarki ukryty, więc liczony czas kroku, nie FPS). Różnica mieści się w szumie.

### 10. Trafienia krytyczne

- Każde trafienie dowolnej broni (wspólne `hurtEnemy`) może być krytyczne. Bazowo 5% szansy i x1,5 obrażeń (`config.player.critChance`, `critMult`).
- Krytyk to złoty wybuch iskier z pierścieniem (efekt `critHit`) i złoty zamiast białego błysk wroga.
- Pasywki: Książka Davida Gogginsa (+5 pkt proc. szansy na poziom) i Płyta Limp Bizkit (+0,25 do mnożnika na poziom). Na maksie: 30% szansy i x2,75.
- Nakładka balansu pokazuje szansę i mnożnik („kryt”).

### 11. Przedmioty, monety B i skrzynki na mapie (z Megabonk)

- **Przedmioty** (`src/data/items.js`, liczby w `config.items`): słabsze od kart, działają do końca rundy, nie zajmują slotów i sumują się bez limitu. `run.items` trzyma id -> ile sztuk.

| Przedmiot | Efekt za sztukę |
|---|---|
| Sterydy | +6 HP na minutę |
| Baton proteinowy | +4% obrażeń |
| Energetyk | -3% czasu odnowienia |
| Skarpety frotte | +3% szybkości chodzenia |
| Rękawiczki na siłkę | +2% szansy na krytyka |
| Zdrapka | +5% szczęścia |
| Plaster | +6 max HP i leczenie o tyle samo |
| Magnes z lodówki | +8% zasięgu przyciągania |

- **Monety B** (srebrne z literą B): wypadają z 5% zabitych (razy szczęście), tylko na tę rundę (`run.bCoins`), nie przechodzą do zapisu. Monety białka są teraz wyłącznie złote, w trzech rozmiarach (1, 3, 10 białka).
- **Skrzynki na mapie** (`config.worldChests`): na każdym bloku osiedla z szansą 35% stoi zamknięta skrzynka (ciemniejsza, z łańcuchem i kłódką) na chodniku. Rozmieszczenie z seeda rundy, więc co rundę gdzie indziej, a otwarta nie wraca. Nad skrzynką moneta B i cena: biała, gdy Bartka stać, czerwona, gdy nie. Wejście w skrzynkę, na którą go stać, otwiera ją: losowy przedmiot na ekranie skrzyni (karta z ikonką).
- **Cena** jest jedna dla wszystkich skrzynek i rośnie z każdą otwartą: `round(5 x 1,3^otwarte)`, czyli 5, 7, 8, 11, 14...
- **Skrzynie elit** dają teraz przedmiot (za darmo, jak dotąd otwierane wejściem). Skrzynie bossów bez zmian: karty i ewolucja. Skrzynia z Chordy dalej daje kartę.
- **Debug:** `config.debug.startBCoins` (liczba monet B na start rundy); klawisz G (`gemKey`) rzuca też 10 monet B.

### 12. UI (krok 36)

- **Karty** level upu, skrzyni i Żabki to jeden wspólny kawałek (`makeCard` w `src/systems/cards.js`): panel z `ui.js` w ramce koloru rzadkości (złota przy ewolucji), nazwa rzadkości nad kartą, ikonka (broni, pasywki, przedmiotu; Bartkowanie ma twarz Bartka, Leczenie serce), w pionie po lewej, w poziomie pod nazwą. Nowa broń albo pasywka ma żółtą plakietkę „NOWA” na rogu. Karty wjeżdżają od dołu jedna po drugiej. Liczby w `config.ui.card`.
- **Ekran tytułowy:** „Kliknij, aby zacząć” to pulsujący przycisk z `ui.js`, „Dotknij albo naciśnij dowolny klawisz” z obrysem. Przy pierwszym uruchomieniu (`save.orientationSet`) zamiast niego jest pytanie „Jak trzymasz ekran?” z przyciskami Pionowo i Poziomo; wybór ustawia orientację i od razu startuje intro. Stary zapis z rozegraną rundą liczy się jako zapytany.
- **Pauza:** Esc albo P, przyciski „Wycisz” i „Wyjdź do menu” (opis w sekcji Zakres).
- **Ekran końca gry:** panel z czasem, poziomem, zabitymi, bossami (x / 4), białkiem z rundy (z premiami zakładów i presji) i z monet, białkiem w siłowni, a pod nim obrażenia każdej broni: ikonka, nazwa (po ewolucji nowa), pasek względem najlepszej, liczba i DPS (obrażenia przez czas, odkąd Bartek ma tę broń: `w.sinceMs`). Obrażenia liczy `run.weaponDamage`: broń ustawia `scene.damageSource` w swoim `update`, pocisk i orbita niosą swoją broń. Liczby w `config.ui.gameOver`.
- **Liczby obrażeń** nad trafionym wrogiem: pula 40 tekstów, unoszą się i znikają w 650 ms, krytyk złoty i większy. Gdy cała pula jest w powietrzu, trafienie nie pokazuje liczby. Wyłącza je `config.ui.damageNumbers.enabled: false`.
- Na telefonie (szerokość 375) karty, pauza i ekran końca mieszczą się w ekranie (gra skaluje się `Scale.FIT`).

### 13. Więcej efektów (krok 38)

Same efekty, bez nowych mechanik. Wszystkie są wpisami w `config.vfx` (lista w sekcji Efekty w „Plan na później”), nowe kształty `fx_blob` (plama), `fx_streak` (smuga) i `fx_dizzy` (krąg gwiazdek). Dane mówią, kto ma jaki efekt: wróg ma `deathVfx` (Joker, Goblin: plama) i `touchVfx` (klapa: iskry z metalu), pasywka i przedmiot mają `vfx` (Gainer, Plaster: leczenie), znajdźka ma `vfx` i `endVfx` (Mały B: kłąb dymu na początku i na końcu). Emiter cząsteczek trzyma najwyżej `config.pools.vfxParticles` (200) naraz, kształty mają pulę `config.pools.vfx` (60), więc pełna horda nie przepełnia efektów.

### Później (po kroku 37 z mapą)

- **Dzielnice** (z map z VS): Bemowo, Jelonki, Górce, z inną paletą ulic, innym miksem wrogów i inną pulą wydarzeń. Odblokowywane wygranymi.
- **Wyzwanie dnia:** ten sam seed dla wszystkich danego dnia.

## Plan na później

### Ikonki na kartach (zrobione w kroku 36, sekcja 12)

- Sloty z siłowni są już zrobione (krok 35d, sekcja 8).
- Już działa i ma tak zostać:
  - przy pełnych slotach broni nie wypadają karty nowych broni, tylko poziomy posiadanych;
  - to samo z pasywkami;
  - ewolucje są nadal możliwe.

### Rzadkość ulepszeń

Przy każdym level upie każda z 3 kart dostaje losową rzadkość: zwykła, rzadka, epicka albo legendarna. Rzadkość mnoży siłę efektu (np. 1x, 1,5x, 2x, 3x) i ma swój kolor ramki karty. Szansa na rzadsze karty rośnie z poziomem. Rzadkości, ich szanse i mnożniki są w `config.js`, a ulepszenia dalej są danymi: `apply(player, scene, mult)` dostaje mnożnik rzadkości jako trzeci argument, a `description` może być funkcją `(mult) => tekst`. Karty bez liczb (Bartkowanie) mają `rarity: false` i są zawsze zwykłe. Zrobione w kroku 22. Pasuje do pola `weight` z kroku 18 (Bartkowanie), ale to osobna rzecz: `weight` decyduje, która karta wypada, a rzadkość decyduje, jak mocna jest.

### Efekty (rysowane w kodzie)

Efekty nie są z pikselowych paczek (bez kontekstu wyglądały słabo). `src/systems/vfx.js` rysuje w `BootScene` małe białe kształty `fx_*` (kropka, iskra, kłąb dymu, pierścień, celownik, gwiazdka, promienie, plus, płatek śniegu, błysk z lufy, łuska), a każdy efekt w `config.vfx` to kilka warstw: wybuch cząsteczek (liczba, prędkość, czas, skala, kolor, grawitacja, kierunek) albo jeden kształt, który rośnie lub maleje i znika. `playVfx(scene, id, x, y, kąt)` działa w każdej scenie.

W grze są: `hitSpark` (trafienie), `deathPoof` (śmierć wroga), `bossBoom` (śmierć bossa), `targetMark` i `dashDust` (doskok Sportakusa), `gemPickup`, `coinPickup`, `starBurst` (legendarna karta, znajdźka), `vacuumPull` (magnes), `frostNova` (zimny prysznic), `holyHeal` (pierogi), `metalClang` (tarcza), `chestOpen` (skrzynia), `muzzleFlash` i `shell` (pistolet), `critHit` (krytyk), `lightning` (Burza).

Dodane w kroku 38:
- `levelUp`: błysk nad Bartkiem przy level upie (gra w `LevelUpScene` nad kartami, bo runda stoi). `maxHpUp`: leczenie przy Gainerze i Plastrze.
- Czołg: `tankDust` (kurz spod gąsienic, za czołgiem, co `tank.dustEveryMs`), `tankBubble` (bańka, gdy czołg znika i Bartek jest chwilę nietykalny).
- `klapaClang`: iskry z metalu, gdy klapa trafi Bartka.
- `smokePuff`: kłąb dymu, gdy Mały B się zmniejsza i wraca.
- Bartkowanie: `squatStars` (gwiazdki krążą nad głowami przy „Zombie robią przysiady”), `moonwalkTrail` (smugi za idącymi tyłem przy „Moonwalk”), kilka losowych wrogów na ekranie co `bartkowanie.fxEveryMs`.
- `heavyHit`: większe iskry, gdy jedno trafienie zabiera co najmniej `look.heavyHitPct` (połowę) życia wroga. `splatGreen` i `splatPurple`: plama na ziemi po Goblinie i Jokerze.
- `evolution`: duży błysk ekranu i promienie przy ewolucji broni, nazwa nowej broni w banerze. `eliteSpawn`: elita się pojawia. `eventStart`: wydarzenie się zaczyna.
- `firework`: fajerwerki na ekranie wygranej, co `ui.fireworkEveryMs`, za panelem.

### 14. Poprawki po playtestach (po kroku 38)

- **Bartkowanie nie jest kartą.** Słaba karta nie była brana i żart przepadał. Teraz po każdym level upie (karta wzięta albo pominięta) jest szansa `bartkowanie.levelUpChance` (25%), że dodatkowo dzieje się losowe Bartkowanie z banerem (`LevelUpScene.done`). Plan Bartkowanie mnoży tę szansę 3x i odblokowuje się po 10 Bartkowaniach. Klawisz debug N + cyfra działa jak wcześniej.
- **Czołg drożeje.** Pierwszy kosztuje 100 zabitych, każdy kolejny 1,5x więcej (`tank.chargeGrowth`: 100, 150, 225...), więc później gracz polega głównie na broniach. Koszt bieżący w `run.tankCost`.
- **Trudność wolniej.** Spawn pod koniec 14 → 12 wrogów na sekundę, HP wrogów +35% → +30% bazowego na minutę. Zasięg przyciągania bez zmian.
- **DPS** na ekranie końca obok obrażeń broni (sekcja 12).
- **Pasek HP bossa** w pionie wchodził na pigułkę z monetami B (dodaną w sekcji 11); teraz leży pod nią (`ui.bossBar.y` 212).
- **Obrys.** Wszyscy wrogowie, kryształy XP, skrzynki i znajdźki mają ciemną krawędź (`look.outline`), żeby nie zlewały się z trawą. Kryształy rysują ją w swojej teksturze, obrazki wrogów oraz skrzynki i znajdźki dostają kopię z obrysem w `BootScene.outlineSprites`. Po playtestach skrzynki i znajdźki są nieco większe, a Shotgun w ręce Bartka ma skalę 1.

### 15. Pomysły do rozważenia (luźne przemyślenia autora, po kroku 38)

Nie są to kroki do zrobienia, tylko lista do przejrzenia przy planowaniu kolejnych wersji. Każdy pomysł przed realizacją dostaje osobny krok z treścią zadania.

**Problemy z obecnej gry:**

**Nowe bronie (wymagają odblokowania; okno wyzwań od kroku 46):**

**Nowe statystyki i karty:**

**Przedmioty:**

**Bossowie, elity, wydarzenia, plany:**

**Ekrany i menu:**

**Pytania techniczne:**
- Brak dźwięku na iPhonie: do sprawdzenia. Najczęstsza przyczyna to przełącznik wyciszenia w iPhonie (wycisza Web Audio) albo dźwięk odblokowany dopiero po dotknięciu ekranu.
- Tabela wyników dla zalogowanych (jedna wspólna, wynik z kroku 83) i anonimowe statystyki rund do balansu: następny krok po koncie z kroku 85.

### 16. Balans końcowy (krok 39)

Zmienione tylko liczby w `config.js`, poza dwiema rzeczami uzgodnionymi przed krokiem: waga kart broni (`weapons.cardWeight`, 2: karta nowej broni i poziomu broni wypada 2x częściej niż pasywka, czytana w `systems/cards.js`) i mnożniki obrażeń Smogu (`gas.evolution.damageMult` 2) i Pasieki (`bees.evolution.damageMult` 1,5).

- **Bronie:** pistolet co 0,5 s (było 0,6); Shotgun 7 obrażeń (było 5); Tarcza poziomy +1 odbicie / +5 / +1 tarcza / +1 odbicie / +5 / +1 odbicie (było z +10 i +2 odbiciami); gaz trwa 2 s (było 3), poziomy +2/+3 obrażeń; laser 15 → 18, Wzrok Homelandera 35% → 30%; Ul 5 obrażeń, promień 85 (było 4 i 70), poziomy +3/+4; Topór poziomy +2/+3/+3; Uzi co 150 ms za 50% (było 120 ms i 60%); Smog płynie 60 px/s (było 45).
- **Trudność:** start spawnu 1,0 wroga/s (było 1,6), krzywa `curvePow` 1,5 (było 0,9: horda rośnie później), obrażenia wrogów +10%/min (było 8%), fale +6 wrogów na falę (było +10).
- **Bossowie:** HP 1600 / 2400 / 3600 (było 2000 / 3000 / 4800), ostatni o 9:00 (było 9:30, miał tylko 30 s okna).

Pomiary botem (kiting, zbieranie kryształów, czołg, gdy gotowy; pojedyncze przebiegi, duży rozrzut):

| Co | Przed | Po |
|---|---|---|
| Nowy gracz (bez siłowni): śmierć | 2:56–5:17 | 3:21–6:44 |
| Białko z rundy nowego gracza | ok. 50–150 | 70–239 (siłownia od 10) |
| Pełna siłownia, start pistolet | — | wygrana (2 z 2) |
| Pełna siłownia, start Shotgun | śmierć 6:24 (śrucina za 6) | śmierć 9:04–9:42 |
| Pełna siłownia, start Tarcza | — | śmierć 7:35–9:12 |
| Horda 250 (limit) | od 3. min | od 6.–9. min |
| Największa utrata HP | min. 6–7 | min. 6–9 |
| Bossowie (dobre buildy) | 30–224 s, 3. i 4. prawie nigdy | 10–47 s, czasem 67–93 s; słabe buildy nie zdążą |
| Ewolucja pistoletu (celowane karty) | ok. 5:00 | 2:46–4:56 |
| Maks. poziom broni dobranej kartą (laser) | 8:57 (waga karty 1) | 5:33 |
| Maks. poziom Shotguna / Tarczy (start, celowane) | — | 5:39 (ewolucja przy skrzyni bossa 6:30) |

Zostaje: ewolucja wymaga skrzyni bossa po zebraniu broni na maks i pasywki, więc bez zabicia bossa 6:30 przychodzi dopiero o 9:00. Bot nie umie grać Ulem ani Toporem (nie wpuszcza wrogów blisko), więc tych dwóch nie da się nim zmierzyć; do sprawdzenia ręcznie. Plany i Zakłady z Unc zmierzone przed tym krokiem (żaden plan nie jest obowiązkowy, Dzień nóg najmocniejszy; Zakłady na 100%: bot ginie 3:48 i 6:07), nie zmieniane.

### 17. Drobne poprawki z listy pomysłów (krok 40)

- **Żabka** nie znika po wizycie bez zakupu i pulsuje światłem (opis w sekcji Wydarzenia, Promocja w Żabce).
- **Bartkowanie** po level upie: baner ma tytuł „BARTKOWANIE!”, a pod nim nazwę efektu i co dało (np. „Odżywka: +5 białka”).
- **Bańka AI** zamiast Bańki (nazwa i baner znajdźki).
- **Gołębie z OLX:** każdy gołąb leci swoim pasem ekranu (`pickups.olx.laneJitter`) i zabija wrogów do `hitRadius` px pod sobą, z piórami (`pigeonHit`). Boss traci swoją część HP raz na stado. Kto po przelocie jest jeszcze na ekranie, też ginie, więc siła znajdźki się nie zmieniła.
- **Dźwięk na iPhonie:** Safari ścisza dźwięk gry, gdy przełącznik z boku telefonu jest na wyciszeniu; `navigator.audioSession.type = 'playback'` (Safari 16.4+) gra mimo to. Dotknięcie ekranu wznawia dźwięk zatrzymany przez iOS (karta w tle, połączenie). Nie sprawdzone na iPhonie.

### 18. Więcej siłowni i trudniej (krok 42)

Playtest po kroku 41: gra zdecydowanie za łatwa.

- **Nowe ulepszenia siłowni** (`src/data/gym.js`, liczby w `config.gym`). Każde daje połowę poziomu podobnej pasywki i ma jej ikonkę:

| Ulepszenie | Na poziom | Poziomy | Ceny |
|---|---|---|---|
| Korepetycje | +5% XP | 5 | 30, 80, 180, 350, 650 |
| Sen 8 godzin | +0,1 HP/s | 5 | 40, 100, 220, 420, 750 |
| Ochraniacze | -1 obrażeń z dotyku (min. 1) | 3 | 150, 400, 900 |
| Talizman z bazaru | +5% szczęścia | 5 | 30, 80, 180, 350, 650 |
| Trener personalny | +2% szansy na kryt | 5 | 40, 100, 220, 420, 750 |

- **Droższe ceny** (ok. 1,7x): Klata, Nogi i Plecy 15, 40, 90, 180, 350, 650, 1100, 1800; Okulary 30–800; Rozgrzewka 120; Plan dnia 50–800; Kabura 400, 1000; Plecak 300, 800. Cała siłownia kosztuje ok. 25 000 białka (było ok. 11 000).
- **Strony w siłowni.** Gdy wiersze nie mieszczą się nad przyciskiem startu, idą na kolejne strony: „<  Strona 1/2  >” pod wierszami albo strzałki na klawiaturze (`ui.gymScreen.pager*`). Pion: 7 wierszy na stronę, poziom: 8 (4 rzędy po 2). Zakup zostaje na tej samej stronie.
- **Trudniej przez całą rundę:** spawn od 1,2 wroga/s (było 1,0) do 14 (było 12), krzywa `curvePow` 1,3 (było 1,5, horda rośnie wcześniej), HP wrogów +40%/min (było 30%), obrażenia +12%/min (było 10%), fale 8 + 8 na falę (było 6 + 6), bossowie 1300 / 2200 / 3200 / 4800 HP (było 1000 / 1600 / 2400 / 3600).

Bot (te same zasady co w sekcji 16, pojedyncze przebiegi):

| Siłownia | Krok 39 | Krok 42 |
|---|---|---|
| Brak (nowy gracz) | śmierć 3:21–6:44 | śmierć 2:21–5:49 (pistolet najdłużej), 28–200 białka |
| Połowa poziomów | — | śmierć 5:30–6:51 |
| Pełna | wygrana prawie bez strat HP | wygrana, na koniec 57–222 HP; straty HP od 6. minuty |

### 19. Bossowie z mocami (krok 43)

Każdy boss co kilka sekund używa swojej mocy (`src/data/bossPowers.js`, liczby w `config.boss.powers`). Większość to ataki z ostrzeżeniem (`src/systems/telegraph.js`): czerwone pole na ziemi z obrysem pulsuje i wypełnia się przez `warnMs`, potem uderza. Bartek w środku obrywa przez `GameScene.hurtPlayer`, czyli tak samo jak od dotyku: obrażenia rosną z czasem rundy, pancerz odejmuje swoje, nietykalność, Bańka AI i czołg chronią. Baner „UWAGA: …” ma pod nazwą bossa podpis jego mocy.

| Boss | Moc | Co ile |
|---|---|---|
| Wielki Zombie | woła hordę: 6 zombie wstaje w kręgu wokół niego | 7 s |
| Wielki Uncanny | gdy Bartek jest do 700 px: pole tuż przy Bartku, po ostrzeżeniu boss się tam przenosi i rani | 7 s |
| Wielki Goblin | beczka na miejsce Bartka: rani i wypuszcza 3 gobliny | 5 s |
| Wielki Sportakus | gdy Bartek jest do 320 px: tupnięcie, fala wokół bossa | 5 s |
| Wielki Joker | 3 wybuchające karty: jedna na Bartku, dwie obok | 6 s |
| Wielki Homelander | 3 lasery z oczu wachlarzem w stronę Bartka, długie na 1100 px | 5 s |

Nowe efekty: `barrelBreak` (drewno i kurz), `stompWave` (pierścień kurzu). Debug: jak wcześniej `config.debug.bossKey` (B, potem cyfra).

### 20. Animacja śmierci (krok 44)

Gdy HP Bartka spada do zera (`GameScene.die`), gra staje: fizyka i zegar sceny się zatrzymują, HUD znika, wszystko poza Bartkiem przez 0,7 s robi się czarne. Kamera najeżdża na Bartka i przybliża się 1,8x, a Bartek przewraca się na bok z odbiciem. Po 2,2 s pojawia się ekran śmierci. W tym czasie nie da się otworzyć pauzy ani wezwać czołgu. Liczby w `config.death`.

### 21. Kostur Czarogeja (krok 45)

Nowa broń (`staff` w `src/data/weapons.js`, liczby w `config.weapons.staff`). Co 1,8 s piorun z nieba uderza najbliższego wroga do 420 px i rani wszystkich w promieniu 40 px od miejsca uderzenia (22 obrażeń). Piorun to poszarpana niebieska linia rysowana w kodzie, z poświatą i białym środkiem, plus efekt `lightningHit`.

- **Poziomy:** +6 obrażeń, +1 piorun, +15 px promienia, +8 obrażeń, +1 piorun, +10 obrażeń. Każdy piorun trafia innego z najbliższych wrogów.
- **Odblokowanie:** „Moc Czarogeja”: zabij 1000 wrogów w jednej rundzie.
- **Ewolucja:** z Kawą z Żabki **Burza nad Bemowem**: każdy piorun przeskakuje na 3 kolejnych wrogów (najbliższy jeszcze nie trafiony, do 220 px).
- Ikony: `weapon_staff` (kostur z kulą i błyskawicą), `weapon_storm` (chmura z błyskawicą).
- Debug: `config.debug.startWeapon` albo `giveWeapon` = `'staff'`.

### 22. Okno wyzwań (krok 46)

W siłowni obok zębatki ustawień jest złoty puchar. Otwiera okno **Wyzwania** (`src/scenes/ChallengesScene.js`, wygląd w `config.ui.challenges`) nad zatrzymaną siłownią. Okno pokazuje każdą broń, pasywkę i plan z warunkiem odblokowania, czyli z polem `unlock` w plikach danych, więc nowa rzecz z warunkiem pojawi się tu sama. Każdy wiersz ma ikonę (plany jej nie mają), rodzaj i nazwę, a pod spodem treść warunku. Zrobione wiersze (w `save.unlocks`) mają zieloną ramkę i dopisek „Zrobione”, a niezrobione mają przygaszoną ikonę. Na górze jest licznik, np. „Zrobione: 3/11”. W poziomie okno ma dwie kolumny. Wróć, Esc albo Enter wracają do siłowni na tej samej stronie.

Bez postępu warunku (np. 12/20 pierogów): okno pokazuje tylko, czy warunek jest spełniony.

### 23. Ekwipunek (krok 47)

Na ekranie pauzy, w wierszu „Bartek”, jest przycisk **Ekwipunek** (albo klawisz I). Otwiera okno `src/scenes/InventoryScene.js` (wygląd w `config.ui.inventory`), a runda dalej stoi. Okno pokazuje:

- **Bronie** (zajęte/wszystkie sloty): ikona, nazwa, poziom; ewoluowana broń ma nazwę i ikonę ewolucji oraz dopisek EWOLUCJA.
- **Pasywki** (zajęte/wszystkie sloty): ikona, nazwa, poziom.
- **Przedmioty**: ikona, nazwa, ile sztuk i co daje jedna; „brak”, gdy nie ma żadnego.
- **Statystyki** z wszystkich źródeł naraz (config, siłownia, karty, przedmioty): HP, regeneracja, pancerz, szybkość, obrażenia, czas odnowienia, obszar, czas działania, dodatkowe pociski, szansa i mnożnik krytyka, szczęście, XP, zasięg zbierania, zasięg pistoletu.

Wróć, Esc, Enter albo I wracają do pauzy. W pionie są 2 kolumny, w poziomie 4 kolumny ekwipunku i 3 kolumny statystyk. Podpowiedź o zmianie ekranu (pion/poziom w siłowni) jest teraz krótsza, obok przycisku.

### 24. Wydarzenie Nightskating (krok 48)

Nowe, dziesiąte wydarzenie rundy (`nightskating` w `src/data/events.js`, liczby w `config.events.nightskating`). Wypada losowo jak pozostałe. Przez 16 s co 2,6 s przez okolicę Bartka przejeżdża rząd 6 zombie na rolkach. Jadą obok siebie, z losowej strony, a środek ich pasa jest do 120 px od Bartka. 0,9 s wcześniej na ziemi świeci czerwony pas, którym pojadą (`warnLine` z `src/systems/telegraph.js`, ten sam wygląd co ataki bossów).

- **Rolkarz** (`skater` w `src/data/enemies.js`, `config.enemies.skater`): zombie pochylony w stronę jazdy, 460 px/s, 8 HP, 12 obrażeń przy dotyku (rosną z czasem rundy jak u innych). Jedzie prosto, jak klapa, i znika daleko za Bartkiem. Nie bywa elitą, a zwykły spawn go nie losuje (`spawnWeight` 0; spawn pomija teraz typy z wagą 0).
- Debug: `config.debug.eventKey`, potem V i cyfra; 9 to Chorda nadchodzi, 0 to Nightskating (wcześniej klawisze sięgały tylko do 8).

Test: Bartek stojący w miejscu przez całe wydarzenie traci dużo HP (rolkarze razem ze zwykłymi wrogami: 216 HP w 1. minucie). Unikanie pasów nie zostało sprawdzone ręcznie.

### 25. Statystyki gracza (krok 49)

W siłowni po zębatce i pucharze jest ikona wykresu. Otwiera okno **Statystyki** (`src/scenes/StatsScene.js`, wygląd w `config.ui.stats`) nad zatrzymaną siłownią. W oknie są sumy i rekordy ze wszystkich rund: rozegrane i wygrane rundy, łączny czas gry, najdłużej przeżyta runda, zabici wrogowie, najwięcej zabitych w jednej rundzie, pokonani bossowie, najwyższy poziom, zdobyte białko, zjedzone pierogi, przyjęte obrażenia, duże złote monety, Bartkowania i odkryte ewolucje (x/8). W poziomie okno ma dwie kolumny. Wróć, Esc albo Enter wracają do siłowni.

- Nowe pola w `save.stats` (`state.js freshStats`): `kills`, `bosses`, `playMs`, `protein`, `bestMs`, `bestKills`. GameOverScene dolicza je po każdej rundzie, także po wyjściu do menu. Starszy zapis dostaje je jako 0 (stąd dopisek w oknie, że liczą się od tej wersji); `loadSave` czyta je jak pozostałe statystyki. „Nowa gra” je zeruje.
- W pionie nad siłownią nie ma już miejsca na napis „Białko:” przed licznikiem, więc znika, gdy nachodziłby na ikony (zostaje moneta w ramce). W poziomie zostaje.

### 26. Łuk (krok 50)

Nowa broń (`bow` w `src/data/weapons.js`, liczby w `config.weapons.bow`). Co 1,2 s strzała leci w najbliższego wroga do 650 px (750 px/s, 20 obrażeń). Przebija 3 wrogów, czyli trafia do 4, ale każdy przebity zabiera jej 30% obrażeń (`falloff` 0,7). Kilka strzał leci wachlarzem co 10°. Strzały mają własną pulę (`config.pools.arrows` 40) i własne trafienia; jedna strzała rani danego wroga tylko raz. Strzała jest rysowana w kodzie: jasne drzewce, stalowy grot, czerwone lotki.

- **Poziomy:** +6 obrażeń, +1 przebicie, +1 strzała, +8 obrażeń, +2 przebicia, +1 strzała.
- **Odblokowanie:** „Szybszy niż Uncanny”: zabij 150 Uncanny w jednej rundzie.
- **Ewolucja:** z Książką Davida Gogginsa **Łuk bez wymówek**: strzały przebijają wszystkich na swojej drodze i nie tracą obrażeń.
- Ikony: `weapon_bow`, `weapon_bow_evo`. Debug: `config.debug.startWeapon` albo `giveWeapon` = `'bow'`.

### 27. Bestiariusz (krok 51)

W siłowni po wykresie jest czaszka. Otwiera okno **Bestiariusz** (`src/scenes/BestiaryScene.js`, wygląd w `config.ui.bestiary`) nad zatrzymaną siłownią. Okno pokazuje każdy rodzaj wroga i każdego bossa z `src/data/enemies.js` (14), z obrazkiem, nazwą, łączną liczbą zabitych ze wszystkich rund i krótkim opisem. Bossowie mają pomarańczową ramkę, a zamiast opisu podpis swojej mocy. Rodzaj jeszcze niepokonany ma czarną sylwetkę, „???” i „Jeszcze nie pokonany.”. Na górze jest licznik „Pokonane rodzaje: x/14”. W poziomie okno ma dwie kolumny.

- Zwykli wrogowie mają w danych `name` i `description`; bossowie biorą nazwę z `config.boss.list`.
- Nowe pole zapisu `save.bestiary` (rodzaj wroga → zabici), dopisywane w GameOverScene z `run.killsByType`; starszy zapis zaczyna od zera, „Nowa gra” je kasuje.
- Ikony za tytułem siłowni (zębatka, puchar, wykres, czaszka) są mniejsze (`ui.settings.gearSize` 46 zamiast 56), żeby w pionie zmieściły się przed licznikiem białka.

### 28. Większe kryształy i monety (krok 52)

Z listy problemów: rzeczy do zbierania były za małe na telefonie. Kryształy XP mają 26 px (było 20, `config.xp.gemSize`), monety białka i monety B 24 px (było 18, `config.coins.size`; mała moneta 0,8x, złota 1,3x tego). Kształty, kolory i zbieranie bez zmian. Strona ma też ikonkę: Bartek (`assets/bartek.png`, `rel="icon"` i `apple-touch-icon` w `index.html`).

### 29. Kostur NekroBartka (krok 53)

Nowa broń (`necro` w `src/data/weapons.js`, liczby w `config.weapons.necro`). Co 2 s, dopóki jest ich mniej niż limit (2 na start), obok Bartka w kłębie dymu wstaje minion: mały, fioletowy Bartek (`bartek.png` 30 px, z odcieniem). Minion żyje 9 s, potem znika w dymie. Biegnie (250 px/s) do najbliższego wroga, który jest do 400 px od Bartka, i bije go co 0,4 s za 11. Gdy wrogów w pobliżu nie ma, wraca na swoje miejsce w kręgu wokół Bartka. Wrogowie minionów nie atakują. Pula `config.pools.minions` 16.

- **Poziomy:** +3 obrażeń, +1 minion, +3 s życia, +4 obrażeń, +1 minion, +5 obrażeń. Pasywki działają: Bilet ZTM dodaje minionów, Karnet na siłownię wydłuża ich życie, Hantle powiększają.
- **Odblokowanie:** „Powrót zza grobu”: zgiń po 8. minucie rundy.
- **Ewolucja:** z Gainerem **Armia NekroBartka**: 2x więcej minionów i już nie znikają.
- Ikony: `weapon_necro` (kostur z czaszką), `weapon_necro_army`. Debug: `config.debug.startWeapon` albo `giveWeapon` = `'necro'`.

### 30. Miecz z anime (krok 54)

Nowa broń (`sword` w `src/data/weapons.js`, liczby w `config.weapons.sword`). Co 1,4 s, gdy jakiś wróg jest do 260 px od Bartka, miecz tnie: wycinek koła wokół Bartka o promieniu 120 px i szerokości 110°, wymierzony w najbliższego wroga. Każdy wróg w wycinku dostaje 11 obrażeń; liczy się też krawędź wroga. Liczba pocisków (Bilet ZTM i poziomy) to liczba cięć pod rząd, co 0,15 s, każde w najbliższego wroga. Cięcie to jasny, przezroczysty wycinek z niebieską krawędzią, który znika przez 0,17 s.

- **Poziomy:** +4 obrażeń, +25 px zasięgu, +1 cięcie, +40° szerokości, +6 obrażeń, +30 px zasięgu. Hantle (obszar) wydłużają ostrze.
- **Odblokowanie:** „Pojedynek”: pokonaj Wielkiego Sportakusa.
- **Ewolucja:** z Płytą Limp Bizkit **Ostrze Senpaia**: każde cięcie to pełny obrót wokół Bartka, 1,5x obrażeń.
- Ikony: `weapon_sword` (katana z czerwoną rękojeścią), `weapon_sword_evo`. Debug: `config.debug.startWeapon` albo `giveWeapon` = `'sword'`.

Wszystkie bronie z listy pomysłów są zrobione.

### 31. Balans nowych broni (krok 55)

Pomiar botem: Bartek stoi w miejscu z nieśmiertelnym HP w 5. minucie (stała fala, bez bossów, elit, wydarzeń i XP), jedna broń, 10 s rozgrzewki, potem 30 s pomiaru. DPS = obrażenia zadane na sekundę, w nawiasie zabicia na sekundę. Przy ok. 10 zabiciach/s tłum się kończy, więc wyniki koło 350–400 DPS to sufit pomiaru, a nie broni.

| Broń | Poziom 1 | Max | Po ewolucji |
|---|---|---|---|
| Pistolet | 18 (0,2) | 67 (1,3), poz. 4 | |
| Shotgun | 28 (0,9) | 87 (2,4) | |
| Gaz | 67 (1,9) | 410 (9,7) | |
| Laser | 61 (1,6) | 248 (7,6) | |
| Pszczoły | 130 (4,1) | 368 (9,2) | |
| Tarcza | 27 (0,4) | 102 (3,0) | |
| Topór | 109 (2,6) | 401 (9,8) | |
| Kostur Czarogeja | 69 (0,9) | 360 (8,1) | 355 (9,9), sufit |
| Łuk przed | 23 (0,4) | 113 (4,3) | |
| **Łuk po** | 35 (1,1) | 178 (4,8) | 304 (8,1) |
| NekroBartek przed | 25 (0,4) | 115 (2,8) | |
| **NekroBartek po** | 44 (1,3) | 132 (5,6) | 296 (7,2) |
| Miecz przed | 157 (4,1) | 372 (9,6), sufit | |
| **Miecz po** | 110 (3,4) | | |

- **Kostur Czarogeja:** bez zmian, mieści się między Laserem a Toporem.
- **Łuk** był najsłabszy obok Tarczy: 14 → 20 obrażeń, przebicie 2 → 3, poziomy obrażeń +4/+5 → +6/+8.
- **NekroBartek** był za słaby jak na odblokowanie w 8. minucie: 7 → 11 obrażeń, cios co 0,5 → 0,4 s, poziomy obrażeń +2/+3/+4 → +3/+4/+5. Bije pojedynczo, więc DPS ma niższy, ale za to dobija silnych wrogów.
- **Miecz** na 1. poziomie bił mocniej niż wszystko inne: 16 → 11 obrażeń. Teraz jest na poziomie Topora i Pszczół.
- **Progi odblokowań** zostały bez zmian (1000 zabić, 150 Uncanny, śmierć po 8. minucie, Wielki Sportakus); bot ich nie mierzył.
- Ze starych broni Shotgun i Tarcza wypadają słabo na maksie. Poprawione w kroku 57 (sekcja 33).

### 32. Rękawice bokserskie (krok 56)

Nowa pasywka (`boxing` w `src/data/passives.js`, liczby w `config.passives.boxing`): +15% obrażeń na poziom, max 5 poziomów, ale tylko dla trafień we wrogów bliżej niż 2,5 wzrostu Bartka, czyli 200 px (`rangeBartek`; liczy się środek wroga). Dostępna od początku, bez odblokowania. Działa na każdą broń, ale najwięcej dają jej Miecz, Topór, Ul i Smog, które zawsze biją z bliska.

- Nowa statystyka gracza `closeDamage` (w `run.player`). Bonus liczony w `GameScene.hurtEnemy`, przed krytykiem, więc krytyk go mnoży.
- Ekwipunek pokazuje „Obrażenia z bliska”.
- Ikona `passive_boxing`: czerwona rękawica z białym mankietem.
- Sprawdzone: z bonusem 30% trafienie za 10 zadaje 13 wrogom 150 i 199 px od Bartka, a 10 wrogowi 260 px dalej. Balansu botem nie mierzono.

### 33. Mocniejszy Shotgun i Tarcza (krok 57)

Ten sam pomiar co w sekcji 31. Po ewolucji obie bronie miały już ok. 300 DPS, słabe były poziom 1 i poziom maksymalny przed ewolucją.

| Broń | Poziom 1 | Max | Po ewolucji |
|---|---|---|---|
| Shotgun przed | 28 (0,9) | 87 (2,4) | 296 (6,6) |
| **Shotgun po** | 43 (1,0) | 180 (4,8) | 369 (7,8) |
| Tarcza przed | 27 (0,4) | 102 (3,0) | 325 (8,4) |
| **Tarcza po** | 42 (0,6) | 168 (4,0) | 338 (9,2), sufit |

- **Shotgun:** obrażenia śruciny 7 → 10, strzał co 1,1 → 0,95 s, wachlarz 50° → 40° (więcej śruciny trafia), poziomy obrażeń +2/+3/+3 → +4/+5/+6.
- **Tarcza:** obrażenia 20 → 26, czas odnowienia 1,8 → 1,4 s, poziomy obrażeń +5/+5 → +8/+8.
- Teraz wszystkie bronie mają na maksie co najmniej ok. 130 DPS. Najsłabszy zostaje pistolet (67 na poz. 4), bo to broń startowa z innymi zasadami.

### 34. Unik: Śliski dres (krok 58)

Nowa statystyka gracza `dodge` (w `run.player`) i pasywka **Śliski dres** (`tracksuit` w `src/data/passives.js`, liczby w `config.passives.tracksuit`): +5% szansy na unik na poziom, max 5 poziomów, nigdy więcej niż 50% (`dodgeMax`). Dostępna od początku. Pancerz już był (Kurtka puchowa, Ochraniacze z siłowni), więc ten krok dodaje tylko unik.

- Unik liczony w `GameScene.hurtPlayer`, więc działa na dotyk wroga i na moce bossów. Uniknięty cios nie rani, ale włącza zwykłą chwilę nietykalności (`config.player.invulnMs`), żeby tłum nie losował co klatkę.
- Nad Bartkiem pojawia się niebieskie „Unik!” (z puli liczb obrażeń; tekst i kolor w `config.ui.damageNumbers`).
- Ekwipunek pokazuje „Unik”. Ikona `passive_tracksuit`: niebieska bluza z białymi paskami.
- Sprawdzone: przy limicie 50% przeszło 49% z 2000 ciosów, a 12 poziomów pasywki zatrzymuje się na 50%.

### 35. Ustawienia: wielkość interfejsu i kamera (krok 59)

Dwa nowe wiersze w ustawieniach (i na ekranie pauzy), takie same jak głośności: [−] pasek [+] i procent, krok 10%. Oba zapisują się w `save` (`uiScale`, `cameraZoom`, sprawdzane w `loadSave`) i zostają po „Nowa gra”, jak głośności. Zakresy w `config.ui.settings`.

- **Wielkość interfejsu** (80–120%): zoom kamery `UIScene` od lewego górnego rogu; HUD układa się na ekranie 1/uiScale razy większym, więc wszystko zostaje przy krawędziach. Joystick i dotknięcie paska czołgu przeliczają pozycję palca. Górna granica 120%: przy 130% w pionie panel HP nachodził na przycisk pauzy. Działa tylko na HUD w rundzie, nie na okna (karty, siłownia, ustawienia).
- **Przybliżenie kamery** (80–120%): zoom kamery `GameScene`; poniżej 100% widać więcej mapy. Żeby wrogowie dalej pojawiali się poza ekranem, pierścień spawnu i start rolkarzy z Nightskatingu są dalej o 1/zoom (`GameScene.offscreenMult`). Mapa dokłada bloki na cały widok, a ciemność z Awarii prądu i czarna zasłona śmierci pokrywają cały ekran przy każdym zoomie.
- W rundzie obie zmiany działają od razu: kamera dostaje nowy zoom, a HUD uruchamia się od nowa (bez napisu powitania).
- W poziomie panel ustawień ma mniejsze wiersze (`layouts.landscape.ui.settings`), żeby pięć wierszy zmieściło się w 720 px.
- Sprawdzone w przeglądarce: kliknięcia +/− zmieniają wartości i zapis, przy 80% kamery żaden z 200 punktów spawnu nie leży w widoku, gra i HUD przy 120% wyglądają poprawnie, panel w poziomie mieści się. Joysticka na telefonie nie sprawdzano.

### 36. Gwizdek WF-isty: częstsze elity (krok 60)

Nowa statystyka gracza `eliteRate` (w `run.player`, 1 = elita co `config.elites.everySec`) i pasywka **Gwizdek WF-isty** (`whistle` w `src/data/passives.js`, liczby w `config.passives.whistle`): +20% częstości elit na poziom, max 5 poziomów, czyli na maksie elita co 20 s zamiast co 40 s. Dostępna od początku. To ryzyko za nagrodę: elita jest groźniejsza, ale zawsze zostawia skrzynkę z przedmiotem.

- Liczone w `GameScene.update` przy spawnie elity: następna za `everySec / eliteRate`. Pierwsza elita rundy przychodzi jak dotąd (40 s), bo pasywka wypada dopiero później.
- Ekwipunek pokazuje „Częstość elit”. Ikona `passive_whistle`: srebrny gwizdek na czerwonym sznurku.
- Sprawdzone botem: bez pasywki elity w 40. i 80. s, z poziomem 5 w 40. i 60. s.

### 37. Sprężyna z długopisu: szybkość pocisków (krok 61)

Nowa statystyka gracza `projectileSpeed` (w `run.player`, 1 = bez zmian) czytana przez `GameScene.weaponSpeed`, tak jak obszar czy czas działania. Pasywka **Sprężyna z długopisu** (`spring` w `src/data/passives.js`, liczby w `config.passives.spring`): +15% szybkości pocisków na poziom, max 5 poziomów. Dostępna od początku.

- Działa na pociski pistoletu (razem z `bulletSpeed` z siłowni), śrut Shotguna, strzały Łuku i lot Tarczy Kapitana (w obie strony). Zasięg się nie zmienia: śrut i strzały lecą tyle samo pikseli, tylko szybciej. Nie dotyczy broni bez pocisków (laser, Kostur, gaz, Smog, pszczoły, topór, miecz, miniony).
- Ekwipunek pokazuje „Szybkość pocisków”. Ikona `passive_spring`: srebrna sprężyna.
- Sprawdzone w przeglądarce, poziom 0 → 5: pistolet 500 → 875 px/s, Shotgun 600 → 1050, Łuk 750 → 1312, Tarcza 650 → 1137 (wszędzie x1,75).

### 38. Bez pikseli w tekstach dla gracza (krok 62)

Piksele nic graczowi nie mówią, więc teksty w grze podają rozmiary względnie:

- **Karty poziomów broni:** przyrost wielkości jako procent wartości startowej broni (helper `share` w `src/data/weapons.js`): gaz „+21% wielkości chmury”, laser „+67% szerokości” i „+23% zasięgu”, Topór „+24% promienia krążenia”, Kostur „+38% promienia uderzenia”, Miecz „+21% zasięgu ostrza”.
- **Rękawice bokserskie:** zasięg w wzrostach Bartka: „wrogom bliżej niż 2,5 Bartka od niego”. W configu `boxing.rangeBartek` 2,5 zamiast `range` 200 px; zasięg w px to `rangeBartek × textures.bartek.height`.
- **Ekwipunek:** „Zbieranie” i „Zasięg pistoletu” jako zmiana względem startu (np. „+20%”), a nie w px.
- Liczby w `config.js` i opisy w tym dokumencie zostają w px (dla dewelopera). Linia debugowa balansu w HUD też.

### 39. Rolki Bartka (krok 63)

Nowa znajdźka (`rollers` w `src/data/pickups.js`, liczby w `config.pickups.rollers`), wypada z wrogów i leży na mapie jak pozostałe (szansa 0,003, odstęp 60 s). Przez 8 s Bartek jeździ na rolkach: jest o 60% szybszy i taranuje wrogów.

- **Taranowanie** (`GameScene.onEnemyTouch`): wróg, który nie jest bossem, przy dotyku nie gryzie, tylko dostaje 25 obrażeń (z bonusami do obrażeń i krytykiem), najwyżej raz na 0,4 s. Chodzący wróg odlatuje od Bartka (420 px/s przez 0,22 s, `z.knockMs`). Boss gryzie normalnie. Czołg i Zimny prysznic mają pierwszeństwo.
- **Wygląd:** zamiast kołysania Bartek pochyla się w stronę jazdy (12°) i zostawia za sobą smugi (`moonwalkTrail`). Baner „ROLKI!”, ikona efektu w HUD i ikona znajdźki `pickup_rollers` (czerwony but na trzech żółtych kółkach).
- Debug: `config.debug.pickupKey`, P zrzuca kolejne znajdźki, w tym rolki.
- Sprawdzone w przeglądarce: prędkość 200 → 320 i z powrotem po 8 s, taranowany wróg dostaje obrażenia i odlatuje, Bartek nie traci HP, drugie dotknięcie w czasie odnowienia nic nie robi.

### 40. Menu główne zamiast siłowni ze wszystkim (krok 64)

Siłownia robiła za menu: ulepszenia, cztery ikony przy tytule, start rundy, Zakłady z Unc i cytat Bartka naraz. Teraz między rundami jest osobne **menu główne** (`src/scenes/MenuScene.js`, liczby w `config.ui.menu`):

- Tytuł „Bemowo Survivors” i białko pod nim.
- Kolumna przycisków: **Na Bemowo!** (duży, Enter), **Siłownia**, **Zakłady z Unc** (z wybranym bonusem; po pierwszej wygranej, jak dotąd), a pod nimi małe przyciski z ikonami po dwa w rzędzie: **Wyzwania**, **Statystyki**, **Bestiariusz**, **Ustawienia** (też Esc).
- Bartek z cytatem i definicją Bartkowania: pod przyciskami w pionie, po lewej w poziomie (`quoteSide`).
- Po pierwszej rundzie pulsuje przycisk Siłownia, żeby gracz znalazł, gdzie wydać białko.

Co się zmieniło gdzie indziej:

- **Siłownia** (`GymScene`) ma tylko tytuł, białko, ulepszenia (ze stronami) i „Wróć” na miejscu dawnego startu; Esc i Enter też wracają do menu. Ikony przy tytule, cytat i przyciski startu zniknęły (`gearSize` usunięty z configu).
- Okna Wyzwania, Statystyki, Bestiariusz i Zakłady z Unc otwierają się nad menu i do niego wracają.
- Ekran tytułowy (gdy były już rundy) i przycisk na ekranie końca rundy (teraz „Menu” zamiast „Siłownia”) prowadzą do menu.
- Sprawdzone w przeglądarce w pionie i poziomie: menu z Zakładami i bez, przejście do siłowni i z powrotem, okno Wyzwań wraca Escape'em do menu.

### 41. Czacha bossa (krok 65)

Na mapie leży czasem duża czacha (biała, czerwone oczy, rysowana w `createMapTextures`, liczby w `config.skulls`). Kto przy niej postoi, wzywa dodatkowego bossa.

- **Gdzie:** na chodniku 10% bloków, które nie mają zamkniętej skrzyni; losowanie z ziarna rundy, jak skrzynie na mapie. Zużyta czacha znika na resztę rundy (`run.usedSkulls`).
- **Wezwanie:** Bartek stoi w promieniu 70 px od czachy, a wokół niej zapełnia się czerwony pierścień. Pełny po 2 s; odejście zeruje licznik. Potem baner „UWAGA: …” i dym, a po 1,5 s boss wstaje w miejscu czachy (`GameScene.updateSkulls`, `summonSkullBoss`).
- **Boss:** losowy z puli ostatniego slotu bossa, który już minął (przed pierwszym: z pierwszego), z HP, skrzynią i białkiem tego slotu. Dochodzi poza planem rundy: zwykli bossowie przychodzą jak dotąd.
- Zabity liczy się do statystyki bossów, więc na końcu rundy może być np. „5 / 4”.
- Debug: `config.debug.skullEverywhere`, czacha na każdym bloku bez skrzyni.
- Sprawdzone w przeglądarce: w 4:40 (po drugim slocie) przyszedł Wielki Goblin z 2200 HP w miejscu czachy; po 1 s pierścień był w połowie; odejście zeruje licznik; po zabiciu skrzynia i +15 białka.

### 42. Ewolucja z każdej skrzyni (krok 66)

Ewolucja czekała na skrzynię bossa, więc często przychodziła na ostatnie kilkadziesiąt sekund rundy. Teraz broń gotowa do ewolucji (maksymalny poziom i jej pasywka w slocie) ewoluuje z **pierwszej otwartej skrzyni dowolnego rodzaju**: bossa, elity, czachy bossa, zamkniętej skrzyni na mapie i skrzyni z wydarzenia.

- Ewolucja zajmuje pierwszą kartę skrzyni. W skrzyni z przedmiotem (elita, mapa) zastępuje ten jeden przedmiot, w skrzyni bossa z kilkoma kartami pozostałe karty losują się jak dotąd. Jedna skrzynia, jedna ewolucja.
- Baner gotowości mówi teraz „Otwórz dowolną skrzynię: zamieni to w …”.
- To zmienia decyzję „Ewolucje tylko od bossów” z sekcji 7 (krok 35b).
- W kodzie zniknął parametr `evolution` z `dropChest`, `openChest` i `ChestScene`.
- Sprawdzone w przeglądarce: Tarcza na maksymalnym poziomie z pasywką, skrzynia elity dała kartę „TARCZA KAPITANA → EWOLUCJA” i broń ewoluowała, a następna skrzynia elity znowu dała zwykły przedmiot.

### 43. Bronie krótkiego zasięgu (krok 67)

Pomiar z sekcji 31 robiono na stojąco w tłumie, a tam Ul i Topór są najmocniejsze. W grze gracz ucieka od wrogów, więc tym razem bot **ucieka i krąży**: 5. minuta, prawdziwe pojawianie się wrogów, bez bossów, elit i wydarzeń, broń na maksymalnym poziomie, 10 s rozgrzewki i 30 s pomiaru. Dwa warianty: ostrożny (ucieka od wrogów bliżej niż 220 px) i odważny (przepuszcza ich do 120 px). Wyniki są mocno rozrzucone, więc przy zmienianych broniach i Łuku w tabeli jest średnia z 2–3 przebiegów, przy reszcie jeden przebieg. Liczby to DPS:

| Broń | Ucieczka 220 px | Ucieczka 120 px |
|---|---|---|
| Pistolet (poz. 4) | 58 | 32 |
| Shotgun | 26 | 31 |
| Tarcza | 42 | 129 |
| Łuk | 87 | 77 |
| Laser | 55 | 76 |
| Kostur Czarogeja | 65 | 43 |
| NekroBartek | 7 | 36 |
| Gaz (Smog) | 97 | 92 |
| **Ul przed** | 11 | 59 |
| **Ul po** | 42 | 95 |
| **Topór przed** | 11 | 82 |
| **Topór po** | 48 | 58 |
| **Miecz przed** | 40 | 28 |
| **Miecz po** | 70 | 140 |

- Kłopotem był **zasięg**, nie obrażenia. Orbity na 85 px nie sięgały wrogów idących za uciekającym Bartkiem.
- **Ul:** orbita 85 → 110 px, obrażenia 5 → 7, poziomy obrażeń +3/+4 → +4/+5.
- **Topór:** orbita 85 → 110 px (z ewolucją 143 px).
- **Miecz:** zasięg cięcia 120 → 150 px.
- **Gaz (Smog)** bez zmian: rzuca chmury na 350 px i wypada najlepiej z wszystkich.
- Na stojąco w 5. minucie Ul i Topór dalej biją najmocniej (634 i 560 DPS na maksie), więc nie podnosiłem ich bardziej.
- Słabo przy ucieczce wypadają też Shotgun i NekroBartek; bez zmian w tym kroku.

**Poprawka do kroku 65:** pierścień czachy był widoczny tylko w pierwszej rundzie po wczytaniu strony. Scena zostaje ta sama między rundami, więc zostawał zniszczony pierścień z poprzedniej rundy. Teraz w nowej rundzie robi się nowy i rysuje się nad wrogami (`skulls.ringDepth` 0,5 → 3), żeby tłum go nie zasłaniał.

### 44. Słabsze ewolucje (krok 68)

Po kroku 66 ewolucje przychodzą wcześniej, a część z nich zwiększała obrażenia broni 3–4,6 razy. Cel: ewolucja daje mniej więcej 1,7–2,5x obrażeń broni na maksymalnym poziomie.

**Pomiar.** Bieg z uciekającym botem (sekcja 43) okazał się za bardzo rozrzucony do porównywania proporcji. Stosunek mierzy więc stały test: 30 nieśmiertelnych wrogów przypiętych 60–300 px od Bartka, broń na maksie, 5 s rozgrzewki i 20 s pomiaru. Liczby to DPS na maksie → DPS po ewolucji:

| Ewolucja | Przed | Po | Co zmienione |
|---|---|---|---|
| Uzi z bazaru | 4,6x (bieg) | 76 → 140 (1,8x) | strzał co 150 → 220 ms, pocisk 50% → 40% obrażeń pistoletu |
| Dwururka dziadka | 3,1x | 229 → 563 (2,5x) | 2x → 1,2x śruciny (zaokrąglone) |
| Tarcza Bemowa | 2,7x | 228 → 377 (1,7x) | zamiast rzutu bez czekania czas odnowienia x0,4 (2,5x szybciej); dalej leczy |
| Wzrok Homelandera | 3,0x | 117 → 267 (2,3x) | pieczenie co 200 ms 30% → 18% obrażeń lasera |
| Burza nad Bemowem | 2,7x | 260 → 495 (1,9x) | piorun przeskakuje na 1 wroga zamiast 3, do 160 px zamiast 220 |
| Ostrze Senpaia | 3,5x | 271 → 504 (1,9x) | pełny obrót za 0,8x obrażeń zamiast 1,5x |
| Smog | | 228 → 542 (2,4x) | bez zmian |
| Młyn krasnoluda | | 119 → 242 (2,0x) | bez zmian |
| Pasieka babci | | 250 → 432 (1,7x) | bez zmian |
| Armia NekroBartka | | 217 → 370 (1,7x) | bez zmian |
| Łuk bez wymówek | | 164 → 206–295 (1,3–1,4x) | bez zmian; próba ze stratą obrażeń na wrogu cofnięta, bo w tym teście i tak wypada najsłabiej |

- Opisy kart ewolucji liczą się z configu: „1,2x więcej śrutu”, „2,5x szybciej”, „na kolejnego wroga”, „0,8x obrażeń”.
- Wcześniejsze opisy Burzy nad Bemowem i Ostrza Senpaia w sekcjach o nowych broniach podają stare liczby; aktualne są w tej tabeli.

### 45. Shotgun i NekroBartek (krok 69)

W pomiarze z ucieczką (sekcja 43) obie bronie były najsłabsze. Tym razem bot robił po 4 przebiegi na wariant, 5. minuta, broń na maksie. DPS przy ucieczce od wrogów bliżej niż 220 px / 120 px:

| Broń | Przed | Po |
|---|---|---|
| Łuk (dla porównania) | 94 / 59 | |
| Laser (dla porównania) | 79 / 109 | |
| Pistolet, poz. 4 (dla porównania) | 39 / 34 | |
| **NekroBartek** | 8 / 15 | 70 / 87 |
| **Shotgun** | 49 / 43 | 74 / 65 |

- **NekroBartek miał błąd, a nie złe liczby.** Minion podchodził dokładnie na zasięg ciosu i w tej samej klatce wróg goniący Bartka odsuwał się o kilka pikseli. W następnej klatce minion znowu tylko szedł, więc ruchomego wroga prawie nigdy nie uderzał. Bił tylko stojących, dlatego test z przypiętymi wrogami tego nie pokazał. Teraz uderza też w klatce, w której dojdzie (`updateMinion` w `src/data/weapons.js`). Liczby bez zmian.
- **Shotgun:** obrażenia śruciny 10 → 12, zasięg 0,7 → 0,85 zasięgu pistoletu (280 → 340 px). Uciekający Bartek ma wrogów zwykle dalej niż 280 px, więc Shotgun często nie miał do kogo strzelać.
- Poprawka minionów działa też po ewolucji (Armia NekroBartka), więc ta ewolucja jest teraz w grze mocniejsza niż w tabeli z sekcji 44.

### 46. Banery wyżej, ogłoszenie z OLX do pominięcia (krok 70)

- **Banery** („GOTOWE DO EWOLUCJI”, „UWAGA: boss”, znajdźki, wydarzenia) stały w pionie na wysokości 400 z 1280, tuż nad Bartkiem, i zasłaniały walkę. Teraz panel banera zaczyna się zaraz pod HUD-em, tam gdzie wiersze efektów (`UIScene.effectTop`). Tytuł ma 40 px zamiast 52, podpis 22 zamiast 26. `banner.y` zniknął z configu, także z układu poziomego.
- **Ogłoszenie z OLX** (gołębie) zamyka się kliknięciem albo dotknięciem; bez tego jak dotąd po 2 s. Gołębie lecą od razu po zamknięciu (`showOlxAd` w `src/systems/olx.js`).
- Sprawdzone w przeglądarce w pionie i w poziomie: baner pod HUD-em, Bartek odsłonięty; kliknięcie zamyka kartę OLX po 0,5 s, gra rusza i lecą gołębie; bez kliknięcia karta znika sama.

### 47. Karty bez limitu po maksie (krok 71)

Gdy bronie i pasywki były na maksie, a sloty pełne, level up dawał już tylko Leczenie. Teraz brakujące karty uzupełniają **małe bonusy bez limitu** (`overflowUpgrades` w `src/data/upgrades.js`, liczby w `config.upgrade.overflow`). Każdy to około 40% poziomu odpowiadającej pasywki i ma rzadkość:

| Karta | Ikona jak | Daje (zwykła) |
|---|---|---|
| Dodatkowa seria | Kreatyna | +4% obrażeń wszystkich broni |
| Drugie espresso | Kawa z Żabki | -3% czasu odnowienia |
| Rozgrzewka | Buty z bazaru | +3% szybkości chodzenia |
| Dokładka | Gainer | +10 max HP i leczenie o tyle samo |
| Rozciąganie | Hantle w plecaku | +4% obszaru broni |
| Dłuższe ręce | Wór na kryształy | +8% zasięgu przyciągania |
| Leczenie | serce | +20 HP, jak dotąd |

- Pojawiają się tylko wtedy, gdy zwykła pula nie wystarcza na wszystkie karty (`drawUpgrades` w `src/systems/cards.js`), więc nie rozwadniają kart broni i pasywek.
- Losowane bez powtórzeń. Można je wywalić (Wywal) na resztę rundy, poza Leczeniem.
- Działa tak samo w skrzyniach, gdy zabraknie kart.
- Sprawdzone w przeglądarce: z bronią na maksie i bez wolnych slotów level up pokazał 3 różne karty z tej listy, z rzadkością (legendarna Dokładka: +30 max HP), a wybrana Dodatkowa seria dodała 4% obrażeń.

### 48. Mniej bazowego HP (krok 72)

Bartek zaczyna z **80 HP zamiast 100** (`config.player.maxHp`). Karty i ulepszenia HP liczą się teraz bardziej: Gainer (+20 na poziom) to +25% zamiast +20%, Dokładka (+10) to +12,5%, a Plecak w siłowni (+10 na poziom) działa jak dotąd. Zwykły wróg (6 obrażeń) zabija teraz w 14 dotknięciach zamiast 17, Homelander (20) w 4 zamiast 5. Ukryta presja (DDA) dalej zwalnia, gdy Bartek ma mało HP.

**Pomiar botem nie rozstrzygnął.** Bot ucieka przed wrogami, a w wolnej chwili idzie po kryształy do 250 px, bierze losowe karty i gra bez siłowni. Ginie po 1,5–3,5 minuty, dużo szybciej niż żywy gracz, a rozrzut (73–283 s) jest większy niż różnica między wariantami:

| Bazowe HP | Rundy | Średni czas przeżycia |
|---|---|---|
| 100 | 4 | 165 s |
| 80 | 4 | ok. 140 s |
| 70 | 4 | 172 s |

Dlatego zmiana jest umiarkowana (80, nie 70). Do sprawdzenia w grze: czy pierwsze 2–3 minuty nie są za trudne.

- Sprawdzone w przeglądarce: nowa runda startuje z 80/80 HP, bez błędów w konsoli.

### 49. Rzadkie przedmioty, które rosną z rundą (krok 73)

Przedmioty (`src/data/items.js`) dostały **rzadkość**. Skrzynia z przedmiotem (elita, skrzynia na mapie) losuje najpierw rzadkość tak jak karty: wagi z `config.rarity`, rosnące z poziomem, a szczęście się liczy. Potem bierze losowy przedmiot tej rzadkości (`drawItem`). Karta w skrzyni ma ramkę i napis rzadkości. Osiem dotychczasowych przedmiotów jest zwykłych.

Cztery nowe nie dają stałej liczby, tylko rosną z tym, co się dzieje w rundzie (liczby w `config.items`, każda kopia liczy się osobno):

| Przedmiot | Rzadkość | Efekt |
|---|---|---|
| Skarbonka | rzadka | +1% obrażeń za każde 5 zebranych monet B (wydane też się liczą) |
| Paragon z Żabki | rzadka | +2% szybkości chodzenia za każdą otwartą skrzynię (każdego rodzaju, od początku rundy) |
| Zeszyt z kreskami | epicka | +1% obrażeń za każde 100 zabitych wrogów (od początku rundy) |
| Medal z zawodów | legendarna | +10% obrażeń i -5% czasu odnowienia za każdego pokonanego bossa (także z czachy) |

- Mechanizm: przedmiot ma `scale: { source(run), every, apply(player, steps) }`. `updateItems` co klatkę dolicza kroki, których jeszcze nie było (`run.itemSteps`). Liczniki w rundzie: `run.bCoinsTotal` (monety B zebrane) i `run.chestsTotal` (otwarte skrzynie, liczone w `ChestScene`).
- Szansa na poziomie 1: ok. 81% zwykły, 15% rzadki, 3,5% epicki, 0,4% legendarny. Na poziomie 20: 53% / 31% / 13% / 3%.
- Debug: `config.debug.forceRarity` wymusza rzadkość także przedmiotów.
- Ikony rysowane w `BootScene`: różowa świnka, paragon, kartka z kreskami, złoty medal na wstążce.
- Sprawdzone w przeglądarce: Skarbonka (12 monet B), dwa Zeszyty (250 zabić), Medal (1 boss) i Paragon (3 skrzynie) dały razem +16% obrażeń, +6% szybkości i -5% czasu odnowienia. Kolejna klatka niczego nie dolicza drugi raz, a 300 zabić dokłada +2%. Skrzynia z wymuszoną legendą pokazała Medal w pomarańczowej ramce.

### 50. Drzewo Klon Bartek (krok 74)

Na mapie rośnie czasem świecące drzewo: turkusowa korona z różową poświatą i białymi iskrami, inne niż drzewa w parku (`clone_tree` w `createMapTextures`, liczby w `config.cloneTrees`).

- **Gdzie:** na chodniku 6% bloków, które nie mają ani zamkniętej skrzyni, ani czachy bossa. Losowane z ziarna rundy, jak skrzynie.
- **Działanie:** Bartek podchodzi na 60 px i otwiera się okno **KLON BARTEK** (`src/scenes/CloneScene.js`, gra stoi). Pokazuje do 3 przedmiotów, które da się sklonować: takich, przy których Bartek ma jakiś inny przedmiot tej samej rzadkości. Wybór daje jeszcze jedną kopię wybranego i zabiera jedną kopię losowego innego przedmiotu tej rzadkości. Baner mówi, co przybyło i co drzewo zabrało, a drzewo znika do końca rundy (`run.usedCloneTrees`).
- **Nie teraz** (albo Esc) zamyka okno, a drzewo zostaje. Okno otworzy się znowu dopiero po odejściu i ponownym podejściu.
- Bez pary przedmiotów jednej rzadkości baner mówi: „Potrzebujesz dwóch różnych przedmiotów tej samej rzadkości”.
- **Zabieranie przedmiotów:** każdy przedmiot ma teraz `apply(player, k)`, gdzie k = -1 cofa jedną kopię. `takeItem` w `src/data/items.js` zabiera kopię, a rosnące przedmioty oddają swoje kroki w `updateItems`.
- Debug: `config.debug.cloneTreeEverywhere`, drzewo na każdym bloku bez skrzyni i czachy.
- Sprawdzone w przeglądarce:
  - bez przedmiotów: baner z wyjaśnieniem;
  - z Batonem, Skarpetami i Skarbonką okno pokazało tylko Baton i Skarpety (Skarbonka nie ma pary rzadkiej);
  - klon Batonu dał 2 Batony (obrażenia 1,04 → 1,08), zabrał Skarpety (szybkość 206 → 200), a drzewo zniknęło;
  - Esc zostawił drzewo;
  - zabrany Paragon oddał swoje +6% szybkości.

### 51. Rzadkie przedmioty rzadziej i z sufitem (krok 75)

Rzadkie przedmioty wypadały za często i rosły bez końca.

- **Rzadkość przedmiotu** ma własne wagi `config.items.rarityWeights` (zwykły 100, rzadki 10, epicki 3, legendarny 0,6). Nie rosną z poziomem, tylko szczęście je mnoży. Przy szczęściu 1 przez całą rundę: ok. 88% zwykły, 9% rzadki, 2,5% epicki, 0,6% legendarny. Karty dalej mają swoje wagi z `config.rarity`.
- **Wolniejszy wzrost i sufit na kopię** (`maxSteps`, w opisie „maks.”):

| Przedmiot | Było | Teraz |
|---|---|---|
| Skarbonka | +1% obrażeń za 5 monet B | +1% za 10 monet B, maks. 12% |
| Paragon z Żabki | +2% szybkości za skrzynię | +1% za skrzynię, maks. 10% |
| Zeszyt z kreskami | +1% obrażeń za 100 zabić | +1% za 200 zabić, maks. 15% |
| Medal z zawodów | +10% obrażeń i -5% odnowienia za bossa | +5% i -3% za bossa, maks. 4 bossów |

- Sufit liczy się dla każdej kopii osobno: dwie Skarbonki dają razem maks. 24%.
- Sprawdzone w przeglądarce: 20 000 losowań dało 88% / 8,8% / 2,5% / 0,6%. Skarbonka przy 1000 monet B dała +12%, dwa Medale przy 6 bossach dały +40% obrażeń i 0,97^8 czasu odnowienia.
- Czachy bossów: szansa się nie zmieniła od kroku 65 (10% bloków bez skrzyni, czyli ok. 6,5% wszystkich). Na 400 sprawdzonych miejscach mapy było 132 czachy i 76 drzew Klon Bartek, zgodnie z tą szansą; drzewa nie zabierają miejsca czachom.

### 52. Ewolucje jeszcze słabsze (krok 76)

Po kroku 68 ewolucje dalej były za mocne. Liczby w `config.weapons.*.evolution`:

| Ewolucja | Było | Teraz |
|---|---|---|
| Uzi z bazaru | strzał co 220 ms | co 260 ms |
| Tarcza Bemowa | 0,4x czasu odnowienia (2,5x szybciej) | 0,55x (1,8x szybciej) |
| Smog nad Bemowem | 2x obrażeń | 1,5x |
| Wzrok Homelandera | 18% obrażeń lasera co 200 ms | 14% |
| Pasieka babci | żądła 1,5x mocniejsze | 1,2x |
| Młyn krasnoluda | 2x toporów, 1,2x szybciej | 1,5x toporów (zaokrąglone), 1,1x szybciej |
| Armia NekroBartka | 2x minionów | 1,5x minionów (zaokrąglone) |
| Ostrze Senpaia | 0,8x obrażeń | 0,65x |

- Bez zmian: Dwururka dziadka, Burza nad Bemowem i Łuk bez wymówek, bo te ewolucje i tak dawały najmniej.
- Liczba toporów i minionów po ewolucji jest zaokrąglana (`Math.round` w `data/weapons.js`), a opisy pokazują „1,5x”.
- Sprawdzone w przeglądarce: Młyn przy 3 toporach dał 5, Armia przy 4 minionach dała 6, a opisy ewolucji pokazują nowe liczby. W konsoli są tylko znane błędy 404.
- Nie zmierzone: o ile spadły obrażenia na sekundę każdej ewolucji.

### 53. Nowe plany treningowe (krok 77)

Dwa nowe plany w `src/data/plans.js` (liczby w `config.plans`). Oba trzeba odblokować, a ich wyzwania pokazują się same w oknie wyzwań.

| Plan | Plus | Minus | Odblokowanie |
|---|---|---|---|
| Trening w parze | podwójne skrzynie i białko z bossów | każdy boss przychodzi z drugim bossem | pokonaj 4 bossów w jednej rundzie |
| Obóz elit | elity 2,5x częściej (więcej skrzyń z przedmiotami) | każda elita ma dwie cechy | zabij 10 elit w jednej rundzie |

- **Trening w parze:** `run.bossPairs`. `drawBosses` dokłada każdemu bossowi partnera: innego bossa z puli tego samego miejsca w kolejce, a gdy pula ma tylko jednego (Homelander), drugiego takiego samego. Partner ma 70% HP (`pair.partnerHpMult`), własną skrzynię i białko. Baner mówi „UWAGA: X I Y”, pasek HP pokazuje głównego bossa, a po jego śmierci następnego żywego. Czachy na mapie przywołują dalej jednego bossa.
- **Obóz elit:** `eliteRate` x2,5 i `run.eliteTwoTraits`. Pierwsza elita przychodzi jak zwykle po 40 s, kolejne co 16 s.
- Nowy licznik `run.elitesKilled` (do odblokowania Obozu elit).
- Debug: `config.debug.forcePlan` ('pair' albo 'eliteCamp').
- Sprawdzone w przeglądarce:
  - kolejka z planem Trening w parze: Wielki Uncanny 1300 + Wielki Zombie 910, …, Homelander 4800 + Homelander 3360;
  - o 2:30 baner „UWAGA: WIELKI UNCANNY I WIELKI ZOMBIE” i dwóch bossów na mapie; po zabiciu obu: 2 bossów w `bossesKilled`, 20 białka;
  - Obóz elit: częstość elit 2,5, elita z dwiema cechami (Pancerny + Szybki) już w pierwszej minucie;
  - ekran planów mieści teksty obu planów.
- Nie sprawdzone: czy da się przejść całą rundę z Treningiem w parze (dwóch Homelanderów naraz o 9:00).

### 54. Dwa sloty broni na start (krok 78)

Bartek zaczyna z 2 slotami broni (było 3, `config.weapons.startSlots`). Kolejne kupuje się w siłowni: Kabura ma teraz 3 poziomy za 150, 400 i 1000 białka (było 2 poziomy za 400 i 1000), więc z pełną Kaburą jest 5 slotów, jak wcześniej.

- Kto miał już kupioną Kaburę, zachowuje poziom, ale ma o jeden slot mniej, dopóki nie dokupi trzeciego poziomu.
- Sprawdzone w przeglądarce: bez Kabury runda ma 2 sloty broni, HUD rysuje 2 pola w rzędzie broni, opis Kabury mówi „na start 2”.

### 55. Lista map i Fort Bema (krok 79)

Po kliknięciu „Na Bemowo!” (albo „Zagraj ponownie”) pokazuje się **lista map** (`src/scenes/MapScene.js`), a dopiero po wyborze mapy plan treningowy. Pierwsza runda w życiu nadal startuje od razu na Jelonkach.

- Mapy to dane w `src/data/maps.js`: `{ id, name, description, kinds, streets, unlock }`. Wybrana mapa idzie przez rejestr gry (`registry 'map'`) do `run.map`.
- **Jelonki:** dotychczasowe osiedle, otwarte od początku.
- **Fort Bema:** odblokowuje się po wygranej rundzie na Jelonkach (zapis w `save.unlocks`, ekran końca rundy pisze „Nowa mapa: Fort Bema!”, wyzwanie jest w oknie wyzwań). Zablokowana karta jest przygaszona i mówi, co ją otwiera.
- Wygląd Fortu Bema (`config.map.fortBema`, rysowany w `createMapTextures`): ta sama siatka bloków, ale zamiast ulic żwirowe alejki, bez świateł, aut i autobusów. Trzy rodzaje bloków:
  - park: drzewa i ścieżka na skos;
  - łąka: kwiaty i kilka drzew;
  - fort: fosa z wodą dookoła dziedzińca, ceglane mury z bramami, okrągłe baszty w rogach i drewniany most na każdym boku.
- **Fosa jest przeszkodą:** 8 niewidzialnych stref fizyki na każdy blok z fortem (`walls` w `systems/map.js`, używane ponownie, gdy bloki znikają i wracają). Zatrzymuje Bartka i idących wrogów; przejść można tylko mostem. Pociski lecą nad wodą.
- Skrzynie, czachy i drzewa Klon Bartek leżą na Forcie Bema tak samo jak na Jelonkach.
- Debug: `config.debug.unlockMaps` otwiera wszystkie mapy na liście.
- Sprawdzone w przeglądarce:
  - lista: Jelonki z [1], Fort Bema przygaszony z napisem „Zablokowana. Wygraj rundę na Jelonkach”, kliknięcie w zablokowaną nic nie robi;
  - warunek: wygrana na Jelonkach odblokowuje, przegrana nie, wygrana na Forcie nie;
  - po odblokowaniu wybór Fortu Bema prowadzi do planu, a runda ma `run.map = 'fortBema'`;
  - Bartek idący w fosę staje na brzegu, a mostem przechodzi;
  - przy 157 wrogach co najwyżej 4 naraz stały w wodzie (wepchnięci przez tłum albo zrodzeni w niej);
  - Jelonki wyglądają jak przedtem; w konsoli tylko znane błędy 404.
- Nie sprawdzone: układ poziomy listy map.

### 56. Poziomy trudności map (krok 80)

Każda mapa ma 5 poziomów trudności (`config.difficulty`). Na start otwarty jest poziom 1. Wygrana na najwyższym otwartym poziomie danej mapy otwiera następny i od razu go wybiera.

- Każdy poziom powyżej 1 daje idącym wrogom +25% HP, +15% częstszy spawn i +25% białka z rundy. Poziom 5: +100% HP, +60% spawnu, +100% białka. Bonus dolicza się razem z Zakładami z Unc i presją Bemowa (`proteinForRun`).
- **Wybór:** na karcie mapy w `MapScene` jest wiersz „Trudność 2/3: +25% białka” ze strzałkami < i >. Bez otwartego poziomu 2 wiersz mówi „Trudność 1. Wygraj tu, by otworzyć 2”.
- **Zapis:** `save.difficulty[mapId] = { max, picked }`, przycinane przy odczycie (`data/maps.js`). „Nowa gra” je czyści.
- **Koniec rundy:** wiersz „Białko z rundy” pokazuje np. „trudność 3 +50%”, a po odblokowaniu pojawia się „Nowy poziom trudności: Jelonki 4 (+75% białka)!”.
- Debug: `config.debug.unlockMaps` otwiera też wszystkie poziomy (bez zapisu w save).
- Sprawdzone w przeglądarce: kliknięcie > zmieniło poziom 2 → 3 bez startu rundy; runda na poziomie 3 miała HP wrogów x1,5, spawn x1,3 i +50% białka (90 → 135 przy tej samej rundzie); wygrana na poziomie 3 otworzyła poziom 4; w konsoli tylko znane błędy 404.

### 57. Odrzut (krok 81)

Nowa statystyka `run.player.knockback` (prędkość odepchnięcia w px/s, na start 0). Gdy jest większa od zera, każde trafienie bronią odpycha idącego wroga od Bartka (`hurtEnemy` w `GameScene`): wróg leci z tą prędkością przez 160 ms (`config.knockback.ms`), tak jak przy taranowaniu na Rolkach. Ten sam wróg może zostać odepchnięty najwyżej raz na 450 ms (`everyMs`), żeby szybkie bronie nie przyszpilały tłumu. Bossowie nie są odpychani.

- **Kapeć mamy** (nowa pasywka, 5 poziomów, od początku dostępna): +80 odrzutu na poziom, razy mnożnik rzadkości karty.
- **Gumka recepturka** (nowy zwykły przedmiot): +40 odrzutu za kopię; Klon Bartek umie ją zabrać jak inne.
- Ekwipunek (pauza) pokazuje wiersz „Odrzut”.
- Ikony rysowane w `BootScene`: różowy kapeć z białym paskiem, gumka recepturka.
- Sprawdzone w przeglądarce: bez odrzutu zombie zbliżył się o 17 px przez 0,2 s, z odrzutem 320 odleciał o 52 px (320 x 0,16 s); drugie trafienie w ciągu 0,45 s go nie odepchnęło; ikony się rysują; w konsoli tylko znane błędy 404.
- Nie sprawdzone: odczucie w grze i balans (czy 80 na poziom to dużo).

### 58. Podręcznik do informatyki (krok 82)

Nowy rzadki przedmiot w `src/data/items.js`, inny niż pasywka Zeszyt w kratkę: rośnie z poziomem Bartka, jak Skarbonka czy Zeszyt z kreskami (`scale`, liczby w `config.items.textbook`).

- +2% XP i +1% obrażeń za każde 5 poziomów Bartka, licząc od początku rundy, każda kopia osobno.
- Sufit: 8 kroków na kopię (poziom 40), czyli maks. +16% XP i +8% obrażeń.
- Ikona rysowana w `BootScene`: niebieska książka z żółtym </> na okładce.
- Klon Bartek może go sklonować albo zabrać (para z innym rzadkim przedmiotem).
- Sprawdzone w przeglądarce: na poziomie 4 nic, na 5: +2% XP i +1% obrażeń, na 12: +4% / +2%, na 40 i 60: +16% / +8% (sufit); druga kopia podwaja (+32% / +16%), a zabrana oddaje swoją część; ikona się rysuje; w konsoli tylko znane błędy 404.

### 59. Etapy, portal i dogrywka (krok 83)

Mapa dzieli się na 3 etapy po 10 minut. W każdym etapie są wszyscy czterej bossowie. Liczby siedzą w `config.stages`.

- **Portal.** Gdy zginie ostatni boss etapu (i żaden inny boss nie chodzi po mapie), 260 px od Bartka pojawia się portal na 10 s. Miejsce jest losowane z pominięciem fosy Fortu Bema, a strzałka HUD wskazuje go pierwszego. Portal to znajdźka `stagePortal` z `src/data/pickups.js`, która nie wypada z wrogów. Wejście od razu zaczyna kolejny etap na tej samej mapie:
  - zegar etapu startuje od 10:00, a fale, bossowie i wydarzenia są losowane od nowa;
  - zwykli wrogowie z mapy znikają;
  - HP wrogów rośnie o +30% na etap, a spawn o +30%;
  - bossowie mają ×2,5 HP na każdy kolejny etap.
- **Dogrywka.** Zaczyna się, gdy portal zgaśnie albo gdy czas etapu minie przed zabiciem bossów. Trwa 10 minut, zegar robi się czerwony, a pod licznikami jest napis „Dogrywka, etap X/3”.
  - Co 15 s, oprócz zwykłego spawnu, wchodzi horda Uncanny: 20 sztuk i +25% więcej z każdą kolejną hordą, z HP +35% za każdą wcześniejszą hordę. Limit wrogów na mapie nadal obowiązuje.
  - Kto przetrwa dogrywkę, przechodzi do następnego etapu.
- **Wygrana.** Runda jest wygrana dopiero po ukończeniu trzeciego etapu, portalem albo dogrywką. Białko za wygraną (20) jest teraz płacone za każdy ukończony etap, czyli maks. 60.
- **Wynik.** Każde zabójstwo dodaje mnożnik etapu (×1; ×1,5; ×2) razy +25% za każdy poziom trudności powyżej 1. Dogrywka liczy się z mnożnikiem swojego etapu. Ekran końca pokazuje etap (z czasem dogrywki), wynik i DPS całej rundy. DPS tylko się wyświetla, do wyniku się nie liczy.
- **Dwa zegary.**
  - `run.elapsedMs` liczy całą rundę. Od niego zależą wzrost HP i obrażeń wrogów, pojawianie się typów wrogów, elity, odblokowania i białko za minuty.
  - `run.stageMs` liczy bieżący etap. Od niego zależą bossowie, wydarzenia, fale, krzywa spawnu i zegar w HUD.
- **Debug:** `config.debug.portalKey`: klawisz O otwiera portal przy Bartku. J przesuwa też zegar etapu i dogrywki.
- **Sprawdzone w przeglądarce:**
  - po śmierci czterech bossów portal stoi 260 px od Bartka;
  - wejście w portal: etap 2, wrogowie z mapy znikają, HP i spawn ×1,3, bossowie ×2,5 HP, nowe wydarzenia;
  - koniec czasu etapu: dogrywka, w której hordy rosną (HP Uncanny od 45 do 108), a zabójstwo daje 1,5 punktu;
  - koniec dogrywki: etap 3;
  - zgaszony portal: dogrywka;
  - koniec dogrywki na etapie 3: wygrana, ekran końca z etapem, wynikiem i DPS;
  - na Forcie Bema żaden z 60 portali nie stanął w fosie;
  - w konsoli są tylko znane błędy 404.
- **Nie sprawdzone:** balans (czy etap 3 i dogrywka są do przejścia) oraz ekran końca w poziomie z wieloma broniami (doszły 3 wiersze).

### 60. Wynik bez sufitu: dogrywka bez końca (krok 84)

Krok 83 miał sufit wyniku. Runda trwała najwyżej 3 × (10 + 10) minut, a wrogów było skończenie wielu, więc każdy mocny build kończył z tym samym wynikiem. Ostatni etap działa teraz inaczej:

- **Mapa zaliczona.** Na ostatnim etapie śmierć jego bossów oznacza wygraną (`run.mapCleared`): odblokowania, białko za etap i fajerwerki. Wygraną zostaje także wtedy, gdy Bartek potem zginie albo gracz wyjdzie z pauzy. Bossowie mogą zginąć także już w dogrywce, wtedy pojawia się baner „MAPA ZALICZONA”.
- **Portal-wyjście.** Portal ostatniego etapu kończy rundę z wygraną (tytuł „Przetrwałeś!”).
- **Dogrywka bez końca.** Zaczyna się, gdy portal zgaśnie albo gdy czas ostatniego etapu minie. Nie ma końca: zegar liczy w górę na czerwono, a pod licznikami jest napis „Dogrywka bez końca”.
  - Każda kolejna horda ma ×1,12 HP i ×1,08 obrażeń dotyku względem poprzedniej (`config.stages.overtime.endless`). Rośnie wykładniczo, bo liczbę wrogów i tak trzyma limit 250.
  - Lepszy build po prostu trwa dłużej, więc wynik nie ma sufitu.
  - Po śmierci ekran końca pokazuje „Mapa zaliczona!” i czas dogrywki.
- **Dogrywki etapów 1 i 2 bez zmian.** Trwają 10 minut, liniowy wzrost, potem następny etap.
- **Obrażenia dotyku** każdego wroga mnoży `touchMult` (1 poza hordami dogrywki bez końca).
- **Sprawdzone w przeglądarce:**
  - bossowie etapu 3: „MAPA ZALICZONA”, 3 zaliczone etapy, portal;
  - zgaszony portal: dogrywka bez końca, która trwa po 11:40, z 31 hordami i limitem 250 wrogów;
  - śmierć: wygrana z tytułem „Mapa zaliczona!”;
  - wejście w portal-wyjście: wygrana „Przetrwałeś!”;
  - w konsoli są tylko znane błędy 404.
- **Nie sprawdzone:** jak długo realny build wytrzymuje dogrywkę bez końca (to kwestia balansu `hpGrowth` i `damageGrowth`).

### 61. Konto: logowanie, nick i zapis w chmurze (krok 85)

Nowy przycisk **Konto** w menu otwiera okno `AccountScene` nad menu. Za konto odpowiada Firebase (`src/systems/online.js`). SDK w przypiętej wersji 12.6.0 ładuje się z CDN Google 1,5 s po starcie gry. Gra na nie nie czeka, a bez sieci lub przy zablokowanym CDN działa jak dotąd, a okno pokazuje „Brak połączenia” i przycisk ponowienia.

- **Logowanie przez Google** (popup; przy zablokowanym popupie przekierowanie). Gra nie trzyma haseł i nie wysyła e-maili. Sesja przetrwa zamknięcie przeglądarki.
- **Nick:** 3–16 znaków (litery, także polskie, cyfry, `_`). Jest unikalny bez względu na wielkość liter, bo rezerwuje go dokument `nicks/{nick małymi}` w jednej transakcji z profilem `users/{uid}`, a stary nick się zwalnia. Pole tekstowe to element HTML (Phaser DOM), więc telefon pokazuje klawiaturę. Na czas pisania gra nie przechwytuje klawiszy, a M nie wycisza.
- **Zapis w chmurze:** `saves/{uid}` przechowuje cały postęp (białko, siłownia, odblokowania, statystyki, zakłady, trudności, bestiariusz). Ustawienia urządzenia (dźwięk, skala, kamera, orientacja) zostają lokalne. Po każdym zapisie postęp leci do chmury 3 s później (jedna wysyłka na serię zapisów).
- **Rozstrzyganie po zalogowaniu** (urządzenie pamięta swoją ostatnią synchronizację w `bemowo-survivors-sync`):
  - zmieniła się tylko chmura: brany jest zapis z chmury;
  - zmieniło się tylko urządzenie: wysyłany jest zapis z urządzenia;
  - zmieniło się jedno i drugie: gracz wybiera w oknie („Z chmury: 12 rund, 340 białka” / „Z tego urządzenia: …”);
  - na nowym urządzeniu bez rozegranych rund od razu brany jest zapis z chmury.
- **Wylogowanie** zostawia postęp na urządzeniu. **Usuń konto:** Google prosi o ponowne potwierdzenie, potem znikają zapis w chmurze, nick, profil i samo konto. Postęp na urządzeniu zostaje.
- **Bezpieczeństwo:**
  - `src/firebaseConfig.js` jest w repo. Te wartości z założenia są publiczne, bo trafiają do przeglądarki każdego gracza.
  - Dane chronią reguły `firestore.rules`: każdy widzi i zmienia tylko swój profil i zapis; nick musi pasować do wzoru i być zarezerwowany na siebie; znacznik czasu zapisu ustawia serwer; wszystko inne jest zamknięte.
  - Do tego dochodzi ograniczenie klucza API do domen gry i opcjonalnie App Check (`appCheckSiteKey`).
  - Analytics nie jest używany.
- **Polityka prywatności:** `privacy.html` (link w oknie konta). Opisuje jakie dane, po co, gdzie, jak długo, prawa z RODO i kontakt przez zgłoszenie w repozytorium.
- **Debug:** `config.debug.offline` (Firebase się nie ładuje) i `config.debug.forceSyncConflict` (logowanie z zapisem w chmurze zawsze pyta, który zachować).
- **Sprawdzone w przeglądarce:**
  - SDK się ładuje (stan „ready”);
  - okno bez logowania, z formularzem nicku, zalogowane i z konfliktem wygląda dobrze;
  - walidacja nicku („ab”, „zły nick”);
  - zapis nicku bez prawdziwego logowania odrzucony przez Firestore z komunikatem;
  - w polu da się wpisać W, A, S, D i M, a M nie wycisza;
  - po zamknięciu okna przechwytywanie klawiszy wraca;
  - zamiana postępu zostawia ustawienia urządzenia;
  - przycisk Konto z ikoną w menu;
  - `privacy.html` odpowiada.
- **Nie sprawdzone (wymaga twojego konta Google i wklejonych reguł):** prawdziwe logowanie, zapis nicku, synchronizacja między urządzeniami i usuwanie konta.

### 62. Logowanie e-mailem i numer wersji (krok 86)

Testy na telefonach po kroku 85 pokazały, że logowanie przez Google nie działa:

- **iPhone, gra z ekranu początkowego:** okno Google w ogóle się nie otwiera. Akcja czekała bez końca i blokowała wszystkie przyciski, nawet „Wróć”.
- **Chrome na Androidzie:** po wyborze konta telefon przeładował kartę gry i wynik logowania przepadł.
- **Zapasowe przekierowanie:** przy grze na github.io i stronie logowania na firebaseapp.com przeglądarki blokują to, czego ono potrzebuje (pamięć innej domeny).

Zmiany:

- **Logowanie e-mailem i hasłem** (Firebase Email/Password) działa w samej stronie, bez okien i przekierowań, więc działa wszędzie. Okno Konto: „Zaloguj e-mailem” otwiera formularz (pola e-mail i hasło), a w nim „Zaloguj”, „Załóż konto”, „Nie pamiętam hasła” (Firebase wysyła link) i „Wstecz”. Błędy Firebase są po polsku (zły e-mail lub hasło, za krótkie hasło, konto już istnieje, za dużo prób, brak połączenia). Pole e-maila jest typu `email`, a pole hasła `password`, więc menedżery haseł działają.
- **Google:** w grze uruchomionej z ekranu iPhone'a (`navigator.standalone`) zamiast przycisku jest wyjaśnienie, że trzeba użyć e-maila albo Safari. Gdzie indziej logowanie przez Google zostaje, jako okno (popup). Przekierowania już nie ma; zablokowane okno daje komunikat „Zaloguj się e-mailem”.
- **„Wróć”, „Wstecz” i „Anuluj” działają zawsze,** także gdy inna akcja wciąż czeka na odpowiedź. Druga akcja w tym czasie jest ignorowana.
- **Usuń konto:** konto z hasłem potwierdza się hasłem, konto Google oknem Google.
- **Wersja:** `config.version` to numer kroku. Menu pokazuje w prawym dolnym rogu `v0.86`, więc widać, która wersja jest wgrana (GitHub Pages i telefon trzymają starą w pamięci podręcznej). Każdy krok podbija ten numer (zasada w `CLAUDE.md`).
- `privacy.html` opisuje teraz logowanie e-mailem (hasło trzyma Google jako skrót, a e-mail z linkiem do zmiany hasła przychodzi tylko na prośbę gracza).
- **Sprawdzone w przeglądarce:**
  - okno bez logowania ma przyciski „Zaloguj e-mailem”, „Zaloguj przez Google”, „Polityka”, „Wróć”;
  - formularz ma pole e-mail (z fokusem) i pole hasła;
  - przy akcji, która nigdy nie odpowiada, „Zaloguj” jest ignorowane, a „Wróć” zamyka okno;
  - pusty e-mail daje „To nie jest poprawny adres e-mail.”;
  - `v0.86` widać w rogu menu;
  - w konsoli są tylko znane błędy 404 i jeden 400 (odpowiedź serwera na test z pustym e-mailem).
- **Nie sprawdzone:** prawdziwe założenie konta i logowanie (wymaga włączenia Email/Password w konsoli) oraz wygląd na iPhonie z ekranu początkowego.

### 63. Wielkość menu (krok 87)

W ustawieniach jest nowy suwak **Wielkość menu** (80–130%, `save.menuScale`, ustawienie tego urządzenia, nie trafia do chmury). Dotychczasowy suwak nazywa się teraz **Wielkość interfejsu w grze** i dalej zmienia tylko HUD.

- Suwak zmienia rozmiar każdego ekranu poza rundą: tytuł, menu, siłownię, mapy, plany, karty ulepszeń, skrzynie, sklep, ekran końca rundy i okna (statystyki, wyzwania, bestiariusz, konto…). Ekran powiększa się względem swojego środka przez zoom kamery (`systems/layout.js`, `watchMenuScale` przy każdym `create`).
- Nie zmienia się rozmiar rundy, HUD-u, ekranu ładowania ani samego okna ustawień, żeby za duże menu dało się zawsze cofnąć. Menu pod ustawieniami zmienia się na żywo.
- **Zmniejszanie** działa na każdym ekranie. **Powiększanie** idzie tylko tak daleko, jak pozwala zawartość, z odstępem 28 px od krawędzi. Ekran, który już wypełnia całość (np. siłownia), zostaje w 100%, a ekran z luzem rośnie. W pionie większość ekranów jest szeroka, więc urośnie niewiele (menu o ok. 5%, statystyki o ok. 11%).
- Numer wersji w rogu menu jest przypięty do rogu ekranu (dane `corner`), więc przy każdej wielkości pozostaje widoczny.
- W poziomie wiersze ustawień są niższe (72 px), żeby 6 wierszy zmieściło się na ekranie.
- **Sprawdzone w przeglądarce:**
  - przyciski + i − zmieniają `menuScale` (od 80% do 110%), a menu pod ustawieniami zmienia się od razu;
  - restart menu zachowuje wielkość;
  - kliknięcie w powiększony przycisk „Siłownia” trafia;
  - przy 130%: menu ×1,05, statystyki ×1,11, konto ×1,24, siłownia ×1,0, nic nie jest ucięte;
  - przy 80% wszystko jest zmniejszone;
  - w konsoli są tylko znane błędy 404.
- **Nie sprawdzone:** wygląd w poziomie i na telefonie.


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
