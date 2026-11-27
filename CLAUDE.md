# Bemowo Survivors

Memowa gra w stylu Vampire Survivors o Bartku z Bemowa. Pełna specyfikacja MVP jest w `docs/mvp.md`. Przeczytaj ją przed każdym zadaniem.

## Stack

- Phaser 3 (najnowsza wersja 3.x) jako plik `lib/phaser.min.js`, ładowany zwykłym `<script>`. Fizyka Arcade.
- Czysty JavaScript, moduły ES (`<script type="module">`).
- Bez npm, bez bundlera, bez TypeScriptu, bez frameworków.
- Wyjątek: SDK Firebase (konto, zapis w chmurze) ładowane dynamicznym `import()` z CDN Google w przypiętej wersji (`config.online.sdk`), tylko w `src/systems/online.js`. Gra musi działać bez niego.
- Hosting docelowy: GitHub Pages. Wszystkie ścieżki do plików muszą być względne (`./assets/...`, nigdy `/assets/...`).

## Uruchamianie

```
python -m http.server 8000
```

Gra działa pod `http://localhost:8000`. Nie otwieraj `index.html` bezpośrednio z dysku, bo moduły ES tego nie obsługują.

## Struktura plików

```
index.html
lib/phaser.min.js
assets/bartek.png        grywalny Bartek (zawsze ten sam, zmieniają się bronie)
assets/zombie.png        wrogowie: warianty Bartka
assets/uncanny.png
assets/joker.png
assets/homelander.png
assets/czołg.png         Bartek w czołgu (ultimate)
assets/Pigeons/          animacja gołębia, 3 klatki
src/main.js              konfiguracja Phaser.Game i lista scen
src/config.js            WSZYSTKIE liczby balansu
src/state.js             obiekt run (reset co rundę), obiekt save (trwały), loadSave, writeSave
src/data/upgrades.js     tablica ulepszeń jako dane
src/data/enemies.js      typy wrogów jako dane (od kroku 15)
src/data/pickups.js      znajdźki jako dane (od kroku 12)
src/data/gym.js          ulepszenia siłowni jako dane (od kroku 11)
src/data/elites.js       cechy elit jako dane (od kroku 34)
src/data/events.js       wydarzenia rundy jako dane (od kroku 34)
src/data/bets.js         Zakłady z Unc jako dane (od kroku 35)
src/data/plans.js        plany treningowe jako dane (od kroku 33)
src/data/bossPowers.js   moce bossów jako dane (od kroku 43)
src/data/maps.js         mapy jako dane (od kroku 79)
src/systems/             wspólne mechaniki: efekty czasowe, orbita, efekty wizualne rysowane w kodzie (vfx.js) itp.
src/systems/ui.js        wspólny wygląd UI: font, panele, paski, przyciski
src/systems/online.js    (od kroku 85) Firebase: logowanie Google, nick, zapis w chmurze
src/firebaseConfig.js    (od kroku 85) publiczna konfiguracja projektu Firebase
src/scenes/BootScene.js
src/scenes/GameScene.js
src/scenes/UIScene.js
src/scenes/LevelUpScene.js
src/scenes/GameOverScene.js
src/scenes/GymScene.js   (od kroku 11; od kroku 64 tylko ulepszenia)
src/scenes/MenuScene.js  (od kroku 64, menu główne między rundami)
src/scenes/SettingsScene.js pauza i głośność
src/scenes/ChestScene.js (od kroku 26, skrzynia po bossie)
src/scenes/CloneScene.js (od kroku 74, drzewo Klon Bartek)
src/scenes/ShopScene.js  (od kroku 34, sklep z wydarzenia Promocja w Żabce)
src/scenes/BetsScene.js  (od kroku 35, okno Zakładów z Unc w siłowni)
src/scenes/ChallengesScene.js (od kroku 46, okno wyzwań w siłowni)
src/scenes/InventoryScene.js (od kroku 47, ekwipunek z ekranu pauzy)
src/scenes/StatsScene.js (od kroku 49, statystyki gracza w siłowni)
src/scenes/BestiaryScene.js (od kroku 51, bestiariusz w siłowni)
src/scenes/AccountScene.js (od kroku 85, okno Konto z menu)
src/scenes/LeaderboardScene.js (od kroku 88, tabela wyników z menu)
src/scenes/MapScene.js   (od kroku 79, wybór mapy przed planem)
src/scenes/PlanScene.js  (od kroku 33, wybór planu przed rundą)
src/scenes/TitleScene.js (od kroku 19)
assets/audio/            (od kroku 19)
docs/mvp.md
firestore.rules          (od kroku 85) reguły bazy, wklejane w konsoli Firebase
privacy.html             (od kroku 85) polityka prywatności
```

Nowy plik tylko wtedy, gdy zadanie tego wymaga. Jedna scena na plik.

## Zasady twarde

1. **Liczby tylko w `src/config.js`.** Żadnych magicznych liczb w scenach: HP, prędkości, cooldowny, krzywa XP, spawn, limity.
2. **Ulepszenia jako dane.** Każde ulepszenie to obiekt `{ id, name, description, maxStack, apply(player) }` w `src/data/upgrades.js` (opcjonalnie `weight`, domyślnie 1; `apply` dostaje też GameScene jako drugi argument, gdy potrzebuje sceny, i mnożnik rzadkości karty jako trzeci; `description` może być funkcją mnożnika). Dodanie ulepszenia nie może wymagać zmiany kodu scen.
3. **Stan rundy osobno od zapisu.** Wszystko, co resetuje się co rundę, siedzi w `run`. Trwałe postępy (białko, siłownia, odblokowania) siedzą w `save`, zapisywanym w localStorage przez `loadSave()` i `writeSave()` z `src/state.js`. Każdy dostęp do localStorage w try/catch. Statystyki rundy liczone są zawsze w tej kolejności: wartości z `config.js`, potem bonusy z siłowni, potem ulepszenia z bieżącej rundy.
4. **Pooling.** Pociski, wrogowie i kryształy XP to `Phaser.Physics.Arcade.Group` z `maxSize`. Używaj ponownie obiektów (`get`, `setActive`, `setVisible`), nie twórz i nie niszcz ich w każdej klatce.
5. **Ruch zależny od czasu.** Wszystko, co się porusza lub odlicza, korzysta z `delta` albo z fizyki Arcade, nigdy z liczby klatek.
6. **Tylko bieżący krok.** Robisz wyłącznie to, co jest w treści zadania. Funkcje z przyszłych kroków są zakazane, nawet jeśli wydają się łatwe.
7. **Grafika.** Wszystko ładowane w `BootScene`. Gracz to zawsze zwykły Bartek z `bartek.png`. Wrogowie idący do gracza to warianty Bartka (statyczne obrazki: `zombie.png`, `uncanny.png`, `joker.png`, `homelander.png`); nowy wróg tego typu to nowy wariant Bartka. Czołg to `czołg.png`, gołębie to animacja z `assets/Pigeons/`, Tarcza Kapitana to `captain_shield.png`. Wszystko inne rysujesz sam przez `Graphics` i `generateTexture` w `BootScene`: kryształy XP (wielokąty z fasetami i błyskiem), monety, pistolet w ręce Bartka, pociski, klapa, znajdźki, tło i ulice. Efekty wizualne też są rysowane w kodzie: warstwy cząsteczek i kształtów w `config.vfx`, odtwarzane przez `playVfx` z `src/systems/vfx.js`; nowy efekt to nowy wpis w `config.vfx` (i ewentualnie nowy kształt `fx_*` w `createVfxTextures`). Nie używaj pikselowych paczek efektów. Grafiki pixel-art dostają filtr `NEAREST`.
8. **Teksty w grze po polsku.**
9. **Treść jako dane.** Typy wrogów (`src/data/enemies.js`), znajdźki (`src/data/pickups.js`) i ulepszenia siłowni (`src/data/gym.js`) to tablice obiektów, tak jak ulepszenia. Wspólne mechaniki (np. orbita, efekty czasowe) trafiają do `src/systems/` i są używane ponownie, a nie kopiowane.
10. **Debug.** Każdy krok, który dodaje rzadkie zdarzenie, dodaje też klawisz lub flagę w `config.debug`, żeby dało się je wywołać od razu. Wszystkie flagi debug są domyślnie wyłączone.

## Koniec każdego zadania

- Podbij `config.version` do numeru kroku (menu pokazuje `v0.<krok>` w rogu).
- Gra uruchamia się bez błędów w konsoli przeglądarki.
- Sprawdź kryteria "Gotowe, gdy" z treści zadania. Jeśli masz dostęp do przeglądarki, sprawdź je sam. Jeśli nie, napisz dokładnie, co mam przetestować.
- Na koniec podaj krótko: jakie pliki zmieniłeś, co działa, co zostało świadomie pominięte.
- **Nie rób commitów.** Commituję sam po przetestowaniu.
- Jeśli coś w zadaniu jest niejasne albo sprzeczne z `docs/mvp.md`, zapytaj, zanim zaczniesz.