# DailyFocusMobileApp

This workspace contains two layers:

- `App.tsx` and `src/`: an Expo Go preview for testing onboarding, daily rotation, local persistence, and widget-style deep link playback state.
- `native/`: isolated Swift source for the real iOS implementation with SwiftUI, StoreKit 2, AVFoundation, WidgetKit, and AppIntents.

## Expo Go Preview

Run:

```bash
npm run start
```

Then scan the QR code with Expo Go. The preview persists:

- `preferredCategory`
- `isOnboardingCompleted`
- `lastSelectedDate`
- `currentDailyIDs`

Expo Go cannot run a WidgetKit extension, StoreKit 2 purchase sheet, custom AVFoundation manager, or Lock Screen audio behavior. The preview simulates those flows so the product shape is easy to test before opening Xcode.

## Native iOS Setup Notes

When creating the Xcode app target, add these files to the main app target:

- `native/DailyFocusApp/QuoteOrVerse.swift`
- `native/DailyFocusApp/DataRepository.swift`
- `native/DailyFocusApp/AudioManager.swift`
- `native/DailyFocusApp/OnboardingView.swift`
- `native/DailyFocusApp/DailyFocusApp.swift`
- `data/quotes.json`
- `data/categories.json`
- audio files matching the `voiceAudioPath` and `ambientAudioPath` values listed in `data/quotes.json`

Add `native/DailyFocusWidget/DailyQuoteWidget.swift`, `native/DailyFocusApp/QuoteOrVerse.swift`, `native/DailyFocusApp/DataRepository.swift`, `data/categories.json`, and `data/quotes.json` to the widget extension target.

Local audio is grouped by user preference:

- `assets/audio/meditation`: Meditation voiceovers
- `assets/audio/bible`: Bible verse voiceovers
- `assets/audio/quotes`: Daily quote voiceovers
- `assets/audio/ambient`: category-specific looping background tracks

Configure these native capabilities/settings in Xcode:

- URL scheme: Target Info -> URL Types -> add `dailyfocus`.
- Background audio: main app target -> Signing & Capabilities -> Background Modes -> Audio, AirPlay, and Picture in Picture.
- App Group: add `group.com.dailyfocus.app` to both the main app and widget extension so `UserDefaults` daily IDs are shared.
- StoreKit product: create a non-consumable IAP with product ID `com.dailyfocus.foundersedition` priced at `$1.99`.
# Solace-Verse-Quotes-Mobile-App
