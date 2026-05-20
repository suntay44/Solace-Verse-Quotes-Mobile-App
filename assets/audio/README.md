# Audio Library

Local audio is intentionally grouped by category so the app can isolate playback from the user's preference:

```txt
assets/audio/
  ambient/
    ambient_meditation.m4a
    ambient_bible.m4a
    ambient_quote.m4a
  meditation/
    meditation_01.m4a
    meditation_02.m4a
    meditation_03.m4a
    meditation_04.m4a
    meditation_05.m4a
  bible/
    bible_01.m4a
    bible_02.m4a
    bible_03.m4a
    bible_04.m4a
    bible_05.m4a
  quotes/
    quote_01.m4a
    quote_02.m4a
    quote_03.m4a
    quote_04.m4a
    quote_05.m4a
```

`data/categories.json` defines each category's folder and default ambient track.
`data/quotes.json` defines the exact voiceover and ambient paths for each daily selection.
