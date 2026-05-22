import AppIntents
import SwiftUI
import WidgetKit

struct DailyQuoteEntry: TimelineEntry {
    let date: Date
    let category: String
    let selection: QuoteOrVerse?
}

struct DailyQuoteConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Daily Quote"
    static var description = IntentDescription("Shows the current daily quote, verse, or meditation.")

    @Parameter(title: "Category", default: "Meditation")
    var category: String
}

struct DailyQuoteProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> DailyQuoteEntry {
        DailyQuoteEntry(date: Date(), category: "Meditation", selection: nil)
    }

    func snapshot(for configuration: DailyQuoteConfigurationIntent, in context: Context) async -> DailyQuoteEntry {
        entry(for: configuration)
    }

    func timeline(for configuration: DailyQuoteConfigurationIntent, in context: Context) async -> Timeline<DailyQuoteEntry> {
        let entry = entry(for: configuration)
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 6, to: Date()) ?? Date().addingTimeInterval(21_600)
        return Timeline(entries: [entry], policy: .after(refreshDate))
    }

    private func entry(for configuration: DailyQuoteConfigurationIntent) -> DailyQuoteEntry {
        let repository = DataRepository(userDefaults: UserDefaults(suiteName: "group.com.dailyfocus.app") ?? .standard)
        let category = configuration.category.isEmpty ? "Meditation" : configuration.category
        return DailyQuoteEntry(
            date: Date(),
            category: category,
            selection: repository.getDailySelection(for: category)
        )
    }
}

struct DailyQuoteWidgetView: View {
    let entry: DailyQuoteEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label(for: entry.category))
                .font(.caption.bold())
                .foregroundStyle(.secondary)

            Text(entry.selection?.text ?? "Your daily selection is ready.")
                .font(.headline)
                .lineLimit(5)

            Spacer(minLength: 4)

            Text(entry.selection?.referenceOrAuthor ?? "Daily Focus")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .containerBackground(.fill.tertiary, for: .widget)
        .widgetURL(widgetURL)
    }

    private var widgetURL: URL? {
        guard let selection = entry.selection else { return nil }
        var components = URLComponents()
        components.scheme = "dailyfocus"
        components.host = "play"
        components.queryItems = [
            URLQueryItem(name: "category", value: selection.category),
            URLQueryItem(name: "id", value: String(selection.id)),
        ]
        return components.url
    }

    private func label(for category: String) -> String {
        category == "Bible" ? "Bible Verses" : category == "Quote" ? "Daily Quotes" : category
    }
}

struct DailyQuoteWidget: Widget {
    let kind = "DailyQuoteWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: DailyQuoteConfigurationIntent.self, provider: DailyQuoteProvider()) { entry in
            DailyQuoteWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Focus")
        .description("Tap your daily selection to open the app and begin playback.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

@main
struct DailyQuoteWidgetBundle: WidgetBundle {
    var body: some Widget {
        DailyQuoteWidget()
    }
}
