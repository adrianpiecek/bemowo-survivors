MUZZLE FLASH PIXEL FX v1 - pixel-art gun flashes, rapid fire and a brass shell
===============================================================================

One effect, gunfire seen from the side: two muzzle flashes, a rapid-fire loop
and an ejected shell. 4 animations on transparent sprite sheets at native size
(64x32 cells), and a matching shot sound. Free for any game, commercial or not
(CC0, below).

ANIMATIONS
  shot         5 frames   247 ms  a pistol shot: a white-hot flash at the
                                  barrel, a tongue of flame forward and a few
                                  sparks (plays once, ends empty)
  shot-big     7 frames   361 ms  a heavy shot (rifle, shotgun): a longer
                                  flame, a fireball that breaks up at the
                                  barrel and more sparks (plays once, ends
                                  empty)
  auto         6 frames   300 ms  rapid fire: three flashes of different
                                  shapes, one every 100 ms (seamless loop)
  shell       23 frames  1150 ms  a brass casing flips up out of the gun,
                                  tumbles, lands 13 px below the barrel (its
                                  first touch dips a pixel lower), bounces a
                                  pixel, lies still on its side and is gone
                                  (plays once, ends empty)

  The frames' pivot is the barrel's tip, (20, 14) in the 64x32 cell, with the
  flash pointing right: put it on your gun's muzzle. It isn't the cell's
  centre, so in Godot 4 keep Centered on and set the AnimatedSprite2D's Offset
  to (12, 2) (or turn Centered off and set Offset to (-20, -14)), and in Unity
  slice with a Custom Pivot of X 0.3125, Y 0.5625 (Unity measures from the
  bottom). Draw the flash under the gun sprite (a lower z_index in Godot), so
  the little of the flash that spills back hides behind the barrel. Play shot
  or shot-big on each shot, or auto on a loop while the trigger is held. To
  face left, mirror the sprite about the pivot (in Godot a scale.x of -1, not
  Flip H, which mirrors about the cell's centre); rotate the flashes the same
  way to aim up or down. The shell starts 6 px behind the muzzle (where a gun's
  ejection port is) and lands on a floor 13 px below it (cell row 27), so it
  suits a gun held 13 px above the character's feet (about waist height on a 32
  px character). Keep the shell upright (mirror it, never rotate it, or it
  falls sideways), and spawn one shell sprite per shot, freeing it when its
  animation finishes; with auto, one on each of frames 0, 2 and 4. For casings
  that stay on the ground, hold shell's last lying frame (shell-21) instead of
  letting it end.

FOLDERS
  sheets/          fx-muzzle.png (RGBA), its atlas (JSON) and a Godot 4
                   SpriteFrames (.tres). The flames have a one-pixel dark-red
                   halo, for dark backgrounds; the sparks and the shell have
                   none.
  sheets-no-halo/  fx-muzzle-clean: the same frames without the halo, for light
                   or busy backgrounds.
  previews/        a GIF of each animation at 4x on a dark background with a
                   plain stand-in pistol, drawn over the flashes as advised
                   above and under the shell (the pistol is only in the
                   previews); auto plays three loops, then a 300 ms pause, as
                   when the trigger is let go
  recipe/          the Pixelbolt recipe that draws every frame (see MAKE YOUR
                   OWN)
  sounds/          fx-muzzle-shot.wav, for shot and shot-big (see SOUND)
  pieces.json      the animations, frame counts, cell size and lengths

USING THE SHEETS
  Every frame's rectangle and duration (ms) is in the atlas JSON; the sheet is
  a grid of equal cells, left to right, top to bottom. Frames run 40 to 80 ms
  in shot and shot-big (fast at the flash, slower as it fades) and 50 ms in
  auto and shell. Scale only by whole numbers (2x, 3x, 4x) with
  nearest-neighbour filtering.
  Godot 4: copy a .tres and the PNG beside it into your project and set an
    AnimatedSprite2D's Sprite Frames to the .tres and its Offset to (12, 2)
    (the pivot isn't the cell's centre; see above); the animation names are
    shot, shot-big, auto, shell. For crisp pixels set the node's Texture Filter
    to Nearest.
  Unity (we tested the files in Godot 4 only): import the PNG as Sprite (2D and
    UI), Sprite Mode Multiple, Filter Mode Point, Compression None; in the
    Sprite Editor use Slice > Grid By Cell Size 64x32 with Pivot Custom, Custom
    Pivot X 0.3125, Y 0.5625 (it sets every sprite at once) and tick Keep Empty
    Rects, so one-shots keep their empty last frame. That also keeps the spare
    cells at the end of the sheet: use the frames the atlas lists, in its
    order.
  Phaser and PixiJS (untested): the atlas follows TexturePacker's JSON (Hash)
    layout, with each frame's 0-1 pivot (the barrel's tip, 0.3125 across and
    0.4375 down; in pixels under points.anchor_px), "animations" as lists of
    frame names and a "loops" map. Build each animation from those lists;
    neither loader reads the per-frame durations.
  The one-shots' frames have different lengths: in Phaser give each frame its
  duration in anims.create, in PixiJS use {texture, time} frames, and in Unity
  key the clip from the atlas's durations.

SOUND
  fx-muzzle-shot.wav goes with shot, and fits shot-big too (both flashes are
  brightest on frame 0, and both animations start with two 40 ms frames): 247
  ms, the same length as shot. Start it on the same tick as frame 0. You hear a
  soft, low, rounded "pomf" with a little puff of air on top: it is loudest in
  frame 0, while the flash is brightest, fades with the flame over frames 1 and
  2, and is nearly gone by frame 4, the empty frame. It is a soft,
  cartoon-style shot, not a realistic gunshot: it has no crack or bang. Being
  low, it loses about 5 dB or more on phone and laptop speakers, and 14 dB or
  more on the smallest ones (estimates): if your game is played mostly on
  phones, check it there and raise it if needed (its true peak is -16.8 dBTP,
  so it has room). With shot-big (361 ms) it ends before the animation does,
  during frame 5, when only a 3-pixel spark is left. It doesn't loop: auto (a
  flash every 100 ms) and shell have no sound of their own. With auto, play it
  once when the trigger is pressed, not on every flash: ten a second is far too
  busy.
  The timing assumes each frame plays for its atlas duration, as the Godot
  .tres does. In Phaser give each frame its duration in anims.create, in PixiJS
  use {texture, time} frames, and in Unity key the clip from the atlas's
  durations.
  Mono WAV, 48 kHz, 16-bit, mastered quiet (about -27 LUFS on its loudest 100
  ms) so it sits under music: start at 100 % and mix down rather than adding
  gain (phones are the one exception: see above).

LICENCE
  CC0 1.0 Universal (public domain dedication): see LICENSE.txt. Use the art
  and the sound in any project, commercial or not, change them, no permission
  needed. Credit isn't required, but it is appreciated:
    "Pixel FX by Skulitom Rivskiy, made with Pixelbolt (github.com/skulitom/Pixelbolt)"

MAKE YOUR OWN
  recipe/fx-muzzle.fx.json is the whole effect as a Pixelbolt recipe: shapes,
  colour ramps and particle settings. Change colours or sizes, then rebuild
  with Node 20 or newer, in the recipe folder:
    npx pixelbolt@0.16.0 compile fx-muzzle.fx.json --out fx-muzzle.pixel.json
    npx pixelbolt@0.16.0 render fx-muzzle.pixel.json --out fx-muzzle
  Pixelbolt's own atlas has the same frames, with the same 0-1 anchor and
  pivot. It keeps the anchor's pixel point under "anchorPx" (the shipped atlas:
  points.anchor_px) and gives the animations as objects, not as the shipped
  lists and "loops" map. Keep the shipped atlas when only the colours change.
  The no-halo sheet is the same recipe with every look's "halo" removed.

HOW IT WAS MADE (AI DISCLOSURE)
  Made by AI agents with Pixelbolt (MIT). A language model (Anthropic's Claude)
  wrote the recipe from Pixelbolt's shape layers: the shapes' sizes and timing,
  colour ramps, glow and particle settings. Pixelbolt, our MIT-licensed
  pixel-art engine (version 0.16.0), then drew every frame with its own
  algorithms (no machine learning). No image model was used, and nothing was
  traced or sampled from anyone else's art. The sound was made by AI agents
  too: Claude designed it and wrote the code that synthesises it from a low
  sine tone and a narrow band of filtered noise in Python (NumPy and SciPy),
  timed to the frames. No AI audio model, samples or recordings were used.

LINKS
  Pixelbolt (make effects like these from JSON recipes): https://github.com/skulitom/Pixelbolt
  Try it in your browser: https://skulitom.github.io/Pixelbolt/playground/
