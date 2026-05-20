import AVFoundation
import Foundation

@MainActor
final class AudioManager: NSObject, ObservableObject, AVAudioPlayerDelegate {
    static let shared = AudioManager()

    @Published private(set) var isPlaying = false
    @Published private(set) var lastErrorMessage: String?

    private var backgroundPlayer: AVAudioPlayer?
    private var voiceoverPlayer: AVAudioPlayer?

    override private init() {
        super.init()
    }

    func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.allowBluetooth])
            try session.setActive(true)
        } catch {
            lastErrorMessage = "Audio session setup failed: \(error.localizedDescription)"
        }
    }

    func startPlayback(bgMusicTrack: String, voiceoverTrack: String) {
        configureAudioSession()
        stopPlayback()

        do {
            backgroundPlayer = try makePlayer(for: bgMusicTrack)
            voiceoverPlayer = try makePlayer(for: voiceoverTrack)

            backgroundPlayer?.numberOfLoops = -1
            voiceoverPlayer?.numberOfLoops = 0
            voiceoverPlayer?.delegate = self

            backgroundPlayer?.volume = 0.45
            voiceoverPlayer?.volume = 1.0

            backgroundPlayer?.prepareToPlay()
            voiceoverPlayer?.prepareToPlay()

            backgroundPlayer?.play()
            voiceoverPlayer?.play()
            isPlaying = true
            lastErrorMessage = nil
        } catch {
            stopPlayback()
            lastErrorMessage = error.localizedDescription
        }
    }

    func pausePlayback() {
        backgroundPlayer?.pause()
        voiceoverPlayer?.pause()
        isPlaying = false
    }

    func stopPlayback() {
        backgroundPlayer?.stop()
        voiceoverPlayer?.stop()
        backgroundPlayer = nil
        voiceoverPlayer = nil
        isPlaying = false
    }

    func setVolume(bgVolume: Float, voiceoverVolume: Float) {
        backgroundPlayer?.volume = max(0, min(bgVolume, 1))
        voiceoverPlayer?.volume = max(0, min(voiceoverVolume, 1))
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            if player === voiceoverPlayer {
                voiceoverPlayer = nil
            }
        }
    }

    private func makePlayer(for fileName: String) throws -> AVAudioPlayer {
        let file = NSString(string: fileName)
        let directory = file.deletingLastPathComponent
        let rawResource = file.deletingPathExtension
        let resource = directory == "." ? rawResource : rawResource
        let ext = file.pathExtension.isEmpty ? "m4a" : file.pathExtension

        guard let url = Bundle.main.url(forResource: resource, withExtension: ext) ??
                Bundle.main.url(forResource: file.lastPathComponent, withExtension: nil) ??
                Bundle.main.url(forResource: fileName, withExtension: nil) else {
            throw AudioManagerError.missingFile(fileName)
        }

        return try AVAudioPlayer(contentsOf: url)
    }
}

enum AudioManagerError: LocalizedError {
    case missingFile(String)

    var errorDescription: String? {
        switch self {
        case .missingFile(let fileName):
            return "Audio file not found in bundle: \(fileName)"
        }
    }
}
