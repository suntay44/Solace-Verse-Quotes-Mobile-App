# Audio Library

Local audio is intentionally grouped by category so the app can isolate playback from the user's preference:

```txt
assets/audio/
  ambient/
    ambient_meditation_01.mp3
    ambient_meditation_02.mp3
    ambient_meditation_03.mp3
    ambient_bible_01.mp3
    ambient_bible_02.mp3
    ambient_bible_03.mp3
    ambient_quote_01.mp3
    ambient_quote_02.mp3
    ambient_quote_03.mp3
  meditation/
    meditation_01.mp3
    meditation_02.mp3
    meditation_03.mp3
    meditation_04.mp3
    meditation_05.mp3
  bible/
    bible_01.mp3
    bible_02.mp3
    bible_03.mp3
    bible_04.mp3
    bible_05.mp3
  quotes/
    quote_01.mp3
    quote_02.mp3
    quote_03.mp3
    quote_04.mp3
    quote_05.mp3
```

`data/categories.json` defines each category's folder and default ambient track.
`data/quotes.json` defines the exact voiceover and ambient paths for each daily selection. Ambient tracks rotate `01`, `02`, `03`, then repeat inside each category.
