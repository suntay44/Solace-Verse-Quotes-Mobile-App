import Foundation

struct QuoteOrVerse: Codable, Identifiable, Hashable {
    let id: Int
    let text: String
    let referenceOrAuthor: String
    let category: String
    let categoryID: String
    let voiceAudioFileName: String
    let voiceAudioPath: String
    let ambientAudioFileName: String
    let ambientAudioPath: String
}

struct QuoteCategoryConfig: Codable, Identifiable, Hashable {
    let id: String
    let category: String
    let label: String
    let audioFolder: String
    let defaultAmbientAudioFileName: String
    let defaultAmbientAudioPath: String
}
