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
assets/bartek.png
src/main.js              konfiguracja Phaser.Game i lista scen
src/config.js            WSZYSTKIE liczby balansu
src/state.js             obiekt run (reset co rundę) i obiekt save (trwały, na razie pusty)
src/data/upgrades.js     tablica ulepszeń jako dane
src/scenes/BootScene.js
src/scenes/GameScene.js
src/scenes/UIScene.js
src/scenes/LevelUpScene.js
src/scenes/GameOverScene.js
docs/mvp.md
```

Nowy plik tylko wtedy, gdy zadanie tego wymaga. Jedna scena na plik.

## Zasady twarde

1. **Liczby tylko w `src/config.js`.** Żadnych magicznych liczb w scenach: HP, prędkości, cooldowny, krzywa XP, spawn, limity.
2. **Ulepszenia jako dane.** Każde ulepszenie to obiekt `{ id, name, description, maxStack, apply(player) }` w `src/data/upgrades.js`. Dodanie ulepszenia nie może wymagać zmiany kodu scen.
3. **Stan rundy osobno od zapisu.** Wszystko, co resetuje się co rundę, siedzi w `run`. Obiekt `save` jest zarezerwowany na przyszłe trwałe postępy (siłownia, odblokowania) i na razie nic do niego nie zapisuj.
4. **Pooling.** Pociski, wrogowie i kryształy XP to `Phaser.Physics.Arcade.Group` z `maxSize`. Używaj ponownie obiektów (`get`, `setActive`, `setVisible`), nie twórz i nie niszcz ich w każdej klatce.
5. **Ruch zależny od czasu.** Wszystko, co się porusza lub odlicza, korzysta z `delta` albo z fizyki Arcade, nigdy z liczby klatek.
6. **Tylko bieżący krok.** Robisz wyłącznie to, co jest w treści zadania. Funkcje z listy "Poza MVP" w `docs/mvp.md` są zakazane, nawet jeśli wydają się łatwe.
7. **Grafika zastępcza.** Do czasu, aż zadanie powie inaczej: Bartek to statyczny obrazek całego Bartka z `bartek.png` (ładowany w `BootScene`), zombie to zielone koła, biegacz to jasnozielone koło, pociski to małe białe kropki, kryształy XP to niebieskie romby. Wszystko poza Bartkiem rysuj przez `Graphics` i `generateTexture` w `BootScene`.
8. **Teksty w grze po polsku.**

## Koniec każdego zadania

- Gra uruchamia się bez błędów w konsoli przeglądarki.
- Sprawdź kryteria "Gotowe, gdy" z treści zadania. Jeśli masz dostęp do przeglądarki, sprawdź je sam. Jeśli nie, napisz dokładnie, co mam przetestować.
- Na koniec podaj krótko: jakie pliki zmieniłeś, co działa, co zostało świadomie pominięte.
- **Nie rób commitów.** Commituję sam po przetestowaniu.
- Jeśli coś w zadaniu jest niejasne albo sprzeczne z `docs/mvp.md`, zapytaj, zanim zaczniesz.
