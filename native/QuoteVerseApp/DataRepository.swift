import Foundation
import SwiftUI

final class DataRepository: ObservableObject {
    static let shared = DataRepository()

    @Published private(set) var quotes: [QuoteOrVerse] = []
    @Published private(set) var categories: [QuoteCategoryConfig] = []

    private let calendar: Calendar
    private let userDefaults: UserDefaults
    private let lastSelectedDateKey = "lastSelectedDate"
    private let currentDailyIDsKey = "currentDailyIDs"

    init(
        userDefaults: UserDefaults = UserDefaults(suiteName: "group.com.quoteverse.app") ?? .standard,
        calendar: Calendar = .current
    ) {
        self.userDefaults = userDefaults
        self.calendar = calendar
        self.quotes = Self.loadQuotesFromBundle()
        self.categories = Self.loadCategoriesFromBundle()
    }

    static func loadQuotesFromBundle(bundle: Bundle = .main) -> [QuoteOrVerse] {
        guard let url = bundle.url(forResource: "quotes", withExtension: "json") else {
            assertionFailure("quotes.json was not found in the app bundle.")
            return []
        }

        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([QuoteOrVerse].self, from: data)
        } catch {
            assertionFailure("Failed to decode quotes.json: \(error)")
            return []
        }
    }

    static func loadCategoriesFromBundle(bundle: Bundle = .main) -> [QuoteCategoryConfig] {
        guard let url = bundle.url(forResource: "categories", withExtension: "json") else {
            assertionFailure("categories.json was not found in the app bundle.")
            return []
        }

        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([QuoteCategoryConfig].self, from: data)
        } catch {
            assertionFailure("Failed to decode categories.json: \(error)")
            return []
        }
    }

    func categoryConfig(for category: String) -> QuoteCategoryConfig? {
        categories.first { $0.category.caseInsensitiveCompare(category) == .orderedSame }
    }

    func selection(withID id: Int) -> QuoteOrVerse? {
        quotes.first { $0.id == id }
    }

    func selections(for category: String) -> [QuoteOrVerse] {
        guard let categoryID = categoryConfig(for: category)?.id else { return [] }
        return quotes.filter {
            $0.category.caseInsensitiveCompare(category) == .orderedSame &&
            $0.categoryID == categoryID
        }
    }

    func getDailySelection(for category: String) -> QuoteOrVerse? {
        let categoryItems = selections(for: category)
        guard !categoryItems.isEmpty else { return nil }

        let today = calendar.startOfDay(for: Date())
        let lastSelectedDate = userDefaults.object(forKey: lastSelectedDateKey) as? Date
        var currentDailyIDs = userDefaults.dictionary(forKey: currentDailyIDsKey) as? [String: Int] ?? [:]

        if let lastSelectedDate, calendar.isDate(lastSelectedDate, inSameDayAs: today) {
            if let cachedID = currentDailyIDs[category],
               let cachedSelection = selection(withID: cachedID),
               cachedSelection.category.caseInsensitiveCompare(category) == .orderedSame {
                return cachedSelection
            }
        } else {
            currentDailyIDs = [:]
        }

        guard let nextSelection = categoryItems.randomElement() else { return nil }
        currentDailyIDs[category] = nextSelection.id
        userDefaults.set(today, forKey: lastSelectedDateKey)
        userDefaults.set(currentDailyIDs, forKey: currentDailyIDsKey)

        return nextSelection
    }
}
