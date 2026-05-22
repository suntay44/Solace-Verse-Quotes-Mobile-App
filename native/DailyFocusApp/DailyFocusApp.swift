import SwiftUI

@main
struct DailyFocusApp: App {
    @AppStorage("preferredCategory") private var preferredCategory = "Meditation"
    @AppStorage("isOnboardingCompleted") private var isOnboardingCompleted = false
    @StateObject private var repository = DataRepository.shared
    @StateObject private var audioManager = AudioManager.shared

    var body: some Scene {
        WindowGroup {
            Group {
                if isOnboardingCompleted {
                    DailyQuoteView()
                        .environmentObject(repository)
                        .environmentObject(audioManager)
                } else {
                    OnboardingView()
                }
            }
            .onOpenURL(perform: handleDeepLink)
        }
    }

    private func handleDeepLink(_ url: URL) {
        guard url.scheme == "dailyfocus",
              url.host == "play",
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return
        }

        let queryItems = components.queryItems ?? []
        let category = queryItems.first(where: { $0.name == "category" })?.value
        let idValue = queryItems.first(where: { $0.name == "id" })?.value

        guard let category,
              let idValue,
              let id = Int(idValue),
              let selection = repository.selection(withID: id),
              selection.category.caseInsensitiveCompare(category) == .orderedSame else {
            return
        }

        preferredCategory = category
        audioManager.startPlayback(
            bgMusicTrack: selection.ambientAudioPath,
            voiceoverTrack: selection.voiceAudioPath
        )
    }
}

struct DailyQuoteView: View {
    @AppStorage("preferredCategory") private var preferredCategory = "Meditation"
    @EnvironmentObject private var repository: DataRepository
    @EnvironmentObject private var audioManager: AudioManager

    var body: some View {
        let selection = repository.getDailySelection(for: preferredCategory)

        VStack(alignment: .leading, spacing: 24) {
            Text(preferredCategory == "Bible" ? "Bible Verses" : preferredCategory)
                .font(.caption.bold())
                .foregroundStyle(.secondary)

            if let selection {
                Text(selection.text)
                    .font(.largeTitle.bold())
                Text(selection.referenceOrAuthor)
                    .font(.headline)
                    .foregroundStyle(.secondary)

                Button(audioManager.isPlaying ? "Pause" : "Play") {
                    if audioManager.isPlaying {
                        audioManager.pausePlayback()
                    } else {
                        audioManager.startPlayback(
                            bgMusicTrack: selection.ambientAudioPath,
                            voiceoverTrack: selection.voiceAudioPath
                        )
                    }
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
        }
        .padding(24)
    }
}
