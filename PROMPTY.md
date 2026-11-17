# Bemowo Survivors: prompty dla agenta

Jak używać:
- Jeden prompt = jedna nowa sesja agenta.
- Po każdym kroku grasz sam 2 minuty. Dobrze: commit. Źle: `git reset --hard` i ten sam krok od nowa z doprecyzowanym promptem. Nie nakładaj poprawek na poprawki.
- Zanim zaczniesz krok 0: wrzuć do repo `CLAUDE.md`, `docs/mvp.md` (eksport dokumentu MVP) i `assets/bartek-head.png` (wycięta głowa Bartka, przezroczyste tło, ok. 128x128 px).

---

## Krok 0: szkielet projektu

```
Krok 0 z docs/mvp.md: szkielet projektu. Przeczytaj CLAUDE.md i docs/mvp.md.

Zrób:
- Pobierz Phaser 3 (najnowsza 3.x, plik phaser.min.js) do lib/. Jeśli nie masz dostępu do sieci, napisz mi, skąd go pobrać.
- index.html, src/main.js i puste sceny BootScene, GameScene, UIScene, LevelUpScene, GameOverScene ze struktury w CLAUDE.md. Rozdzielczość 1280x720, skalowanie FIT, wyśrodkowane, czarne tło.
- src/config.js z tymi wartościami startowymi:
  player: speed 200, maxHp 100, invulnMs 500
  pistol: fireRateMs 800, range 400, bulletSpeed 500, bulletDamage 5, bulletsPerShot 1
  zombie: speed 60, hp 10, contactDamage 10
  runner: speed 120, hp 4, contactDamage 10, appearsAtSec 120
  spawn: startIntervalMs 1000, minIntervalMs 200, ringMinRadius 700, ringMaxRadius 800, maxEnemies 150
  xp: gemValue 1, magnetRadius 80, gemSpeed 400, baseToLevel 5, perLevel 5
  run: durationSec 600
  pools: bullets 100, enemies 150, gems 300
- src/state.js eksportujący funkcję newRun() zwracającą świeży obiekt run oraz pusty obiekt save.
- src/data/upgrades.js eksportujący pustą tablicę.
- BootScene generuje tekstury zastępcze z CLAUDE.md, ładuje bartek-head.png i przechodzi do GameScene.

Nie rób: ruchu, wrogów, strzelania ani żadnej logiki gry.

Gotowe, gdy: gra startuje na localhost:8000 z czarnym ekranem i bez błędów w konsoli.
```

## Krok 1: ruch i kamera

```
Krok 1 z docs/mvp.md: ruch gracza i kamera. Przeczytaj CLAUDE.md.

Zrób:
- Bartek (żółty prostokąt z głową z bartek-head.png) w GameScene, z ciałem fizyki Arcade.
- Ruch WASD i strzałkami z prędkością config.player.speed. Ruch po skosie znormalizowany, żeby nie był szybszy.
- Kamera podąża za graczem.
- Powtarzalne tło (TileSprite z prostej tekstury trawy lub chodnika), żeby było widać ruch. Świat bez granic: tło przesuwa się razem z kamerą.

Nie rób: wrogów, strzelania, HUD.

Gotowe, gdy: Bartek chodzi płynnie we wszystkich 8 kierunkach, po skosie nie jest szybszy, tło widocznie się przesuwa.
```

## Krok 2: spawn zombie

```
Krok 2 z docs/mvp.md: zombie idące do gracza. Przeczytaj CLAUDE.md.

Zrób:
- Pula wrogów (pooling, maxSize config.pools.enemies).
- Spawn zwykłego zombie co config.spawn.startIntervalMs w losowym punkcie pierścienia wokół gracza (promień od ringMinRadius do ringMaxRadius), czyli poza ekranem.
- Nie spawnuj, gdy aktywnych wrogów jest config.spawn.maxEnemies.
- Każdy aktywny zombie idzie w stronę gracza z prędkością config.zombie.speed.
- Zombie lekko się rozpychają między sobą, żeby nie zlewały się w jeden punkt (kolizja wróg-wróg w Arcade).

Nie rób: obrażeń, HP, strzelania, biegaczy, rosnącego tempa spawnu.

Gotowe, gdy: zombie pojawiają się spoza ekranu, idą do gracza, nie nakładają się w jedną kropkę, a po 2 minutach jest ich maksymalnie 150.
```

## Krok 3: obrażenia i game over

```
Krok 3 z docs/mvp.md: kolizje, HP, nietykalność, game over. Przeczytaj CLAUDE.md.

Zrób:
- HP gracza w obiekcie run, start config.player.maxHp.
- Dotyk zombie zadaje config.zombie.contactDamage. Po trafieniu gracz jest nietykalny przez config.player.invulnMs i miga w tym czasie.
- Przy HP 0 przejście do GameOverScene z napisem "Tu spoczywa Bartosz", pod spodem małym drukiem "(Bartłomiej)", oraz przyciskiem "Jeszcze raz", który zaczyna nową rundę przez newRun().
- Tymczasowo wyświetl HP liczbą w rogu ekranu (właściwy HUD przyjdzie w kroku 8).

Nie rób: strzelania, XP, paska HP, statystyk na ekranie śmierci.

Gotowe, gdy: stanie w hordzie zabija Bartka w kilka sekund, a nie w jednej klatce; "Jeszcze raz" daje czystą rundę z pełnym HP i bez starych zombie.
```

## Krok 4: pistolet

```
Krok 4 z docs/mvp.md: pistolet z auto-celowaniem. Przeczytaj CLAUDE.md.

Zrób:
- Pula pocisków (pooling, maxSize config.pools.bullets).
- Co config.pistol.fireRateMs strzał w najbliższego aktywnego zombie w zasięgu config.pistol.range. Brak celu w zasięgu = brak strzału.
- Pocisk leci z config.pistol.bulletSpeed, zadaje config.pistol.bulletDamage, znika po pierwszym trafieniu albo po wyjściu daleko poza ekran.
- HP zombie z config.zombie.hp. Zombie z HP 0 wraca do puli.
- Licznik zabitych w obiekcie run.
- Statystyki parametrów broni trzymaj na obiekcie gracza lub w run (np. run.stats.fireRateMs), kopiowane z config na start rundy, żeby ulepszenia w kroku 6 mogły je zmieniać.

Nie rób: ulepszeń, XP, dźwięków, efektów cząsteczkowych.

Gotowe, gdy: zombie giną od 2 strzałów, Bartek sam celuje w najbliższego, przy 150 wrogach gra nie zwalnia wyraźnie.
```

## Krok 5a: kryształy XP

```
Krok 5a z docs/mvp.md: kryształy XP, magnes, pasek XP. Przeczytaj CLAUDE.md.

Zrób:
- Pula kryształów (pooling, maxSize config.pools.gems).
- Zabity zombie zostawia kryształ o wartości config.xp.gemValue.
- Kryształ w promieniu config.xp.magnetRadius od gracza leci do niego z config.xp.gemSpeed i po dotarciu dodaje XP do run.
- Poziom gracza w run. Próg na następny poziom: baseToLevel + perLevel * (level - 1). Nadwyżka XP przechodzi na następny poziom.
- Tymczasowo wyświetl poziom i XP liczbami pod HP.

Nie rób: pauzy, kart ulepszeń, żadnego efektu awansu poza zmianą liczby.

Gotowe, gdy: kryształy zostają po zombie, przyciągają się z bliska, poziom rośnie, a kolejne poziomy wymagają coraz więcej XP.
```

## Krok 5b: level up z pauzą

```
Krok 5b z docs/mvp.md: level up z pauzą. Przeczytaj CLAUDE.md.

Zrób:
- Przy awansie GameScene się pauzuje (scene.pause) i uruchamia się LevelUpScene nad nią.
- LevelUpScene pokazuje na razie 3 puste karty z napisem "Ulepszenie" i reaguje na kliknięcie oraz klawisze 1, 2, 3.
- Wybór karty zamyka LevelUpScene i wznawia GameScene.
- Czas rundy i cooldowny nie mogą biec w trakcie pauzy.
- Jeśli gracz zdobył kilka poziomów naraz, karty pokazują się po kolei, raz na każdy poziom.

Nie rób: prawdziwych ulepszeń (krok 6), animacji kart.

Gotowe, gdy: przy awansie wszystko staje, wybór karty wznawia grę bez przeskoku pozycji wrogów, podwójny awans daje dwa ekrany kart.
```

## Krok 6: ulepszenia jako dane

```
Krok 6 z docs/mvp.md: 5 ulepszeń jako dane i ekran kart. Przeczytaj CLAUDE.md, zwłaszcza zasadę 2.

Zrób:
- W src/data/upgrades.js 5 ulepszeń zgodnie z tabelą w docs/mvp.md:
  Obrażenia +25%, Szybkostrzelność +15%, Dodatkowy pocisk +1, Szybkość ruchu +10%, Max HP +20 z leczeniem o 20.
  Każde maxStack 5, każde z apply(player) zmieniającym statystyki rundy z kroku 4.
- Poziom każdego ulepszenia zapisany w run.upgrades.
- LevelUpScene losuje 3 różne ulepszenia spośród tych, które nie osiągnęły maxStack. Jeśli dostępnych jest mniej niż 3, pokazuje tyle, ile jest. Jeśli zero, daje leczenie.
- Karta pokazuje nazwę, opis i obecny poziom, np. "2/5".
- Dodatkowy pocisk = kolejne pociski lecą w kolejnych najbliższych zombie albo wachlarzem w stronę najbliższego, wybierz prostsze i napisz które.
- Przy awansie nad Bartkiem pojawia się na 1,5 s dymek "Muchacho!".

Nie rób: nowych ulepszeń poza tymi 5, zapisu do save, grafik kart.

Gotowe, gdy: każde ulepszenie wyraźnie zmienia grę, nie da się wziąć żadnego 6 razy, a dodanie 6. ulepszenia wymagałoby tylko dopisania obiektu w upgrades.js. Pokaż mi ten plik w podsumowaniu, sprawdzę go sam.
```

## Krok 7: biegacz i runda na czas

```
Krok 7 z docs/mvp.md: biegacz, rosnący spawn, licznik, wygrana. Przeczytaj CLAUDE.md.

Zrób:
- Biegacz jako drugi typ wroga z wartości config.runner, pojawiający się od config.runner.appearsAtSec. Ta sama pula co zombie, typ jako właściwość obiektu.
- Odstęp spawnu maleje liniowo od startIntervalMs do minIntervalMs w ciągu config.run.durationSec.
- Licznik rundy odlicza od 10:00 w dół, liczony w czasie gry (nie biegnie w pauzie).
- Po 10:00 ekran wygranej w GameOverScene z napisem "Bemowo obronione!" i przyciskiem "Jeszcze raz".
- Na ekranie śmierci i wygranej statystyki: czas przetrwania, liczba zabitych, poziom.
- Do testów dodaj w config.js flagę debugSpeed (domyślnie 1), która mnoży upływ czasu rundy, żebym mógł sprawdzić koniec rundy bez czekania 10 minut.

Nie rób: bossów, innych typów wrogów, znajdziek.

Gotowe, gdy: biegacze pojawiają się od 2:00, po kilku minutach jest wyraźnie trudniej, z debugSpeed 10 runda kończy się wygraną po minucie.
```

## Krok 8: HUD i memy

```
Krok 8 z docs/mvp.md: HUD i memy. Przeczytaj CLAUDE.md.

Zrób:
- UIScene jako osobna warstwa nad GameScene, uruchamiana razem z nią. Usuń tymczasowe liczby z kroków 3 i 5a.
- HUD: pasek HP nad Bartkiem lub w rogu, pasek XP na całej szerokości u góry ekranu, poziom, licznik czasu, liczba zabitych.
- Na start rundy na środku ekranu duży napis "Witamy na Bemowie", widoczny przez 2 s i znikający płynnie.
- Upewnij się, że dymek "Muchacho!" z kroku 6 nie jest zasłaniany przez HUD.
- Wszystkie teksty czytelne na jasnym i ciemnym tle (obrys albo cień).

Nie rób: intra, muzyki, dźwięków, ekranu tytułowego.

Gotowe, gdy: ktoś, kto pierwszy raz widzi grę, bez pytania wie, ile ma HP, ile zostało do poziomu i ile czasu do końca.
```

## Krok 9: deploy

```
Krok 9 z docs/mvp.md: przygotowanie do GitHub Pages. Przeczytaj CLAUDE.md.

Zrób:
- Sprawdź, że wszystkie ścieżki w projekcie są względne i że gra działa uruchomiona z podkatalogu (np. python -m http.server z katalogu nadrzędnego i adres /nazwa-repo/).
- Ustaw w config.js debugSpeed z powrotem na 1.
- Dodaj README.md: jedno zdanie o grze, sterowanie, jak uruchomić lokalnie.
- Napisz mi krok po kroku, jak włączyć GitHub Pages dla tego repo (Settings, Pages, gałąź main, katalog root).

Nie rób: nowych funkcji, zmian w balansie.

Gotowe, gdy: gra działa z podkatalogu bez błędów 404 w konsoli. Potem sam otwieram link na drugim komputerze.
```
