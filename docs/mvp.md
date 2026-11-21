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

- Ruch WASD i strzałkami, 100 HP.
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
- **Shotgun** (krok 35c, grafika `assets/Shotgun.png` w ręce Bartka i jako ikonka): co 1,1 s wachlarz 5 śrucin w rozrzucie 50° w najbliższego wroga. Zasięg to 70% zasięgu pistoletu (Okulary z siłowni go zwiększają), śrucina leci najwyżej ten dystans. Śrucina za 7 obrażeń. Poziomy dają śruciny i obrażenia (`config.weapons.shotgun`). Bez odblokowania, jedna z trzech broni startowych.
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
| Tarcza Kapitana | Kurtka puchowa | Tarcza Bemowa | tarcze bez czekania, każde trafienie leczy 1 HP |
| Gaz rozweselający | Karnet na siłownię | Smog nad Bemowem | chmury nie znikają i powoli płyną za najbliższym wrogiem |
| Laser z oczu | Hantle w plecaku | Wzrok Homelandera | ciągły promień, który obraca się za celem |
| Ul | Rosół babci | Pasieka babci | 2x pszczół, a zabici przez pszczoły czasem zostawiają pierogi |
| Shotgun | Kreatyna | Dwururka dziadka | 2x śrucin, każda przebija 1 wroga (krok 35c) |
| Topór krasnoluda | Buty z bazaru | Młyn krasnoluda | 2x toporów, 1.4x szybciej, 1.3x dalej od Bartka (krok 35c) |

**Jak działa (krok 32):**
- Pole `evolution` broni: `{ passive, id, name, icon, description, evolve? }`, liczby w `config.weapons.<broń>.evolution`. Ewoluowana broń ma `w.evolved`, a jej zwykłe `update` czyta tę flagę.
- Skrzynia: gdy jakaś broń jest gotowa (maksymalny poziom + jej pasywka w slocie), pierwsza karta skrzyni to ewolucja: złota ramka i napis „BROŃ → EWOLUCJA”. Pozostałe karty są losowane jak zwykle. Jedna skrzynia daje jedną ewolucję, kolejność jak w slotach broni. Po ewolucji jest baner „EWOLUCJA: …”, a ikonka w slocie zmienia się na ewoluowaną (złota ramka).
- Liczby: Uzi strzela co 150 ms pociskami za 50% obrażeń, każdy przebija 1 wroga. Tarcza Bemowa wraca do rzutu bez czekania (złota), każde trafienie leczy 1 HP. Smog: tyle chmur, ile chmur ma gaz, nie znikają, każda płynie 60 px/s za innym wrogiem i rani 2x mocniej niż gaz (szara chmura). Wzrok Homelandera: promienie świecą stale, obracają się 200°/s za celem i palą co 200 ms za 30% obrażeń lasera. Pasieka: 2x pszczół, żądła 1,5x mocniejsze, zabity przez pszczołę zostawia pierogi z szansą 4%.
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
- Jaki jest sens ewolucji, jeśli przychodzi na ostatnie kilkadziesiąt sekund? Częściowo zrobione w kroku 39 (sekcja 16): karty broni z wagą 2, mocniejsze Smog i Pasieka. Zostaje to, że ewolucja czeka na skrzynię bossa.
- Bronie krótkiego zasięgu (Topór, Ul, Smog) zawsze mają dużo gorsze liczby niż bronie dalekiego zasięgu. Częściowo zrobione w kroku 56 (sekcja 32): pasywka Rękawice bokserskie.
- Może mniej bazowego HP, żeby karta Max HP miała sens.

**Nowe bronie (wymagają odblokowania; okno wyzwań od kroku 46):**

**Nowe statystyki i karty:**
- Odrzut jako statystyka broni, z kartami i przedmiotami, które go zwiększają.
- Prędkość pocisków jako pasywka i statystyka broni.
- Unik i pancerz.
- Pasywka na częstsze elity.
- Bonus do XP z „Podręcznika do informatyki”: istnieje już jako pasywka Zeszyt w kratkę, więc tylko jeśli ma być czymś innym (np. przedmiotem).

**Przedmioty:**
- Przedmioty wyższej rzadkości mają ciekawsze, złożone efekty zamiast większych liczb, np. więcej obrażeń za każdą srebrną monetę albo większa prędkość za każdą otwartą skrzynkę.
- Drzewo „Klon Bartek” na mapie (musi się wyróżniać od tła): klonuje wybrany przedmiot, poświęcając losowy inny przedmiot tej samej rzadkości.

**Bossowie, elity, wydarzenia, plany:**
- Więcej planów treningowych, w tym plany z kilkoma bossami naraz i z większą liczbą elit.
- Bartek bardzo lubi jeździć na rolkach: wykorzystać to (np. znajdźka, plan albo ultimate).
- Po przejściu mapy: możliwość zwiększenia zarabianego białka razem z poziomem trudności (jak poziomy trudności po wygranej).

**Ekrany i menu:**
- Lepsze menu główne zamiast siłowni, w której jest wszystko.
- Ustawienia: wielkość GUI i odległość kamery.

**Pytania techniczne:**
- Brak dźwięku na iPhonie: do sprawdzenia. Najczęstsza przyczyna to przełącznik wyciszenia w iPhonie (wycisza Web Audio) albo dźwięk odblokowany dopiero po dotknięciu ekranu.
- Zbieranie statystyk gry od graczy i Firebase (wyniki graczy, tabela wyników dla zalogowanych mailem): możliwe na GitHub Pages przez Firebase z poziomu przeglądarki, ale to backend, logowanie i dane osobowe graczy (RODO), więc osobna decyzja.

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
- Ze starych broni Shotgun i Tarcza wypadają słabo na maksie. Tego kroku to nie dotyczyło.

### 32. Rękawice bokserskie (krok 56)

Nowa pasywka (`boxing` w `src/data/passives.js`, liczby w `config.passives.boxing`): +15% obrażeń na poziom, max 5 poziomów, ale tylko dla trafień we wrogów do 200 px od Bartka (liczy się środek wroga). Dostępna od początku, bez odblokowania. Działa na każdą broń, ale najwięcej dają jej Miecz, Topór, Ul i Smog, które zawsze biją z bliska.

- Nowa statystyka gracza `closeDamage` (w `run.player`). Bonus liczony w `GameScene.hurtEnemy`, przed krytykiem, więc krytyk go mnoży.
- Ekwipunek pokazuje „Obrażenia z bliska”.
- Ikona `passive_boxing`: czerwona rękawica z białym mankietem.
- Sprawdzone: z bonusem 30% trafienie za 10 zadaje 13 wrogom 150 i 199 px od Bartka, a 10 wrogowi 260 px dalej. Balansu botem nie mierzono.

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
