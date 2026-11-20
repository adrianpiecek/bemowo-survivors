# Bemowo Survivors

Memowa gra w stylu Vampire Survivors o Bartku z Bemowa. Pełna specyfikacja MVP jest w `docs/mvp.md`. Przeczytaj ją przed każdym zadaniem.

## Stack

- Phaser 3 (najnowsza wersja 3.x) jako plik `lib/phaser.min.js`, ładowany zwykłym `<script>`. Fizyka Arcade.
- Czysty JavaScript, moduły ES (`<script type="module">`).
- Bez npm, bez bundlera, bez TypeScriptu, bez frameworków.
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
assets/Coin_Gems/        animowane gemy XP i monety (CC0)
assets/effects/          animowane efekty (CC0), sprite-sheet.png + manifest.json na efekt
src/main.js              konfiguracja Phaser.Game i lista scen
src/config.js            WSZYSTKIE liczby balansu
src/state.js             obiekt run (reset co rundę), obiekt save (trwały), loadSave, writeSave
src/data/upgrades.js     tablica ulepszeń jako dane
src/data/enemies.js      typy wrogów jako dane (od kroku 15)
src/data/pickups.js      znajdźki jako dane (od kroku 12)
src/data/gym.js          ulepszenia siłowni jako dane (od kroku 11)
src/systems/             wspólne mechaniki: efekty czasowe, orbita, efekty wizualne (vfx.js) itp.
src/scenes/BootScene.js
src/scenes/GameScene.js
src/scenes/UIScene.js
src/scenes/LevelUpScene.js
src/scenes/GameOverScene.js
src/scenes/GymScene.js   (od kroku 11)
src/scenes/ChestScene.js (od kroku 26, skrzynia po bossie)
src/scenes/TitleScene.js (od kroku 19)
assets/audio/            (od kroku 19)
docs/mvp.md
```

Nowy plik tylko wtedy, gdy zadanie tego wymaga. Jedna scena na plik.

## Zasady twarde

1. **Liczby tylko w `src/config.js`.** Żadnych magicznych liczb w scenach: HP, prędkości, cooldowny, krzywa XP, spawn, limity.
2. **Ulepszenia jako dane.** Każde ulepszenie to obiekt `{ id, name, description, maxStack, apply(player) }` w `src/data/upgrades.js` (opcjonalnie `weight`, domyślnie 1; `apply` dostaje też GameScene jako drugi argument, gdy potrzebuje sceny, i mnożnik rzadkości karty jako trzeci; `description` może być funkcją mnożnika). Dodanie ulepszenia nie może wymagać zmiany kodu scen.
3. **Stan rundy osobno od zapisu.** Wszystko, co resetuje się co rundę, siedzi w `run`. Trwałe postępy (białko, siłownia, odblokowania) siedzą w `save`, zapisywanym w localStorage przez `loadSave()` i `writeSave()` z `src/state.js`. Każdy dostęp do localStorage w try/catch. Statystyki rundy liczone są zawsze w tej kolejności: wartości z `config.js`, potem bonusy z siłowni, potem ulepszenia z bieżącej rundy.
4. **Pooling.** Pociski, wrogowie i kryształy XP to `Phaser.Physics.Arcade.Group` z `maxSize`. Używaj ponownie obiektów (`get`, `setActive`, `setVisible`), nie twórz i nie niszcz ich w każdej klatce.
5. **Ruch zależny od czasu.** Wszystko, co się porusza lub odlicza, korzysta z `delta` albo z fizyki Arcade, nigdy z liczby klatek.
6. **Tylko bieżący krok.** Robisz wyłącznie to, co jest w treści zadania. Funkcje z przyszłych kroków są zakazane, nawet jeśli wydają się łatwe.
7. **Grafika.** Wszystko ładowane w `BootScene`. Gracz to zawsze zwykły Bartek z `bartek.png`. Wrogowie idący do gracza to warianty Bartka (statyczne obrazki: `zombie.png`, `uncanny.png`, `joker.png`, `homelander.png`); nowy wróg tego typu to nowy wariant Bartka. Czołg to `czołg.png`, gołębie to animacja z `assets/Pigeons/`, kryształy XP to animowane gemy z `assets/Coin_Gems/`. Efekty wizualne bierz z `assets/effects/` przez `src/systems/vfx.js`: dopisz efekt do `config.vfx`, nie ładuj całej paczki. Grafiki pixel-art dostają filtr `NEAREST`. Wszystko, czego nie ma w assetach (pociski, klapa, znajdźki, tło), rysuj przez `Graphics` i `generateTexture` w `BootScene`, dopóki zadanie nie powie inaczej.
8. **Teksty w grze po polsku.**
9. **Treść jako dane.** Typy wrogów (`src/data/enemies.js`), znajdźki (`src/data/pickups.js`) i ulepszenia siłowni (`src/data/gym.js`) to tablice obiektów, tak jak ulepszenia. Wspólne mechaniki (np. orbita, efekty czasowe) trafiają do `src/systems/` i są używane ponownie, a nie kopiowane.
10. **Debug.** Każdy krok, który dodaje rzadkie zdarzenie, dodaje też klawisz lub flagę w `config.debug`, żeby dało się je wywołać od razu. Wszystkie flagi debug są domyślnie wyłączone.

## Koniec każdego zadania

- Gra uruchamia się bez błędów w konsoli przeglądarki.
- Sprawdź kryteria "Gotowe, gdy" z treści zadania. Jeśli masz dostęp do przeglądarki, sprawdź je sam. Jeśli nie, napisz dokładnie, co mam przetestować.
- Na koniec podaj krótko: jakie pliki zmieniłeś, co działa, co zostało świadomie pominięte.
- **Nie rób commitów.** Commituję sam po przetestowaniu.
- Jeśli coś w zadaniu jest niejasne albo sprzeczne z `docs/mvp.md`, zapytaj, zanim zaczniesz.