import StoreKit
import SwiftUI

struct OnboardingView: View {
    @AppStorage("preferredCategory") private var preferredCategory = "Meditation"
    @AppStorage("isOnboardingCompleted") private var isOnboardingCompleted = false
    @State private var page = 0
    @State private var founderProduct: Product?
    @State private var purchaseError: String?

    private let productID = "com.dailyfocus.foundersedition"

    var body: some View {
        TabView(selection: $page) {
            introScreen.tag(0)
            categorySelection.tag(1)
            supportScreen.tag(2)
            widgetInstructions.tag(3)
        }
        .tabViewStyle(.page(indexDisplayMode: .automatic))
        .task {
            await loadFounderProduct()
        }
    }

    private var introScreen: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Daily Focus")
                .font(.caption.weight(.bold))
                .foregroundStyle(.secondary)

            Text("A daily voice of calm, scripture, and perspective.")
                .font(.largeTitle.bold())

            Text("Listen to one simple reflection each day, then keep it close with a Home Screen or Lock Screen widget. Tap the widget any time to open the app and start the audio moment.")
                .font(.body)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 12) {
                Label("Daily quotes, verses, and meditations", systemImage: "sparkles")
                Label("Voiceover with ambient background audio", systemImage: "waveform")
                Label("A widget built for quick daily listening", systemImage: "rectangle.inset.filled")
            }
            .font(.headline)

            Button("Begin") {
                page = 1
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding(24)
    }

    private var categorySelection: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Daily Focus")
                .font(.caption.weight(.bold))
                .foregroundStyle(.secondary)

            Text("Choose your daily focus.")
                .font(.largeTitle.bold())

            ForEach(["Meditation", "Bible", "Quote"], id: \.self) { category in
                Button {
                    preferredCategory = category
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(label(for: category))
                                .font(.headline)
                            Text(description(for: category))
                                .font(.subheadline)
                                .foregroundStyle(preferredCategory == category ? .white.opacity(0.8) : .secondary)
                        }
                        Spacer()
                        if preferredCategory == category {
                            Image(systemName: "checkmark.circle.fill")
                        }
                    }
                    .padding()
                    .foregroundStyle(preferredCategory == category ? .white : .primary)
                    .background(preferredCategory == category ? Color.green.opacity(0.75) : Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }

            Button("Continue") {
                page = 2
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding(24)
    }

    private var supportScreen: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Support the App (Founder's Edition)")
                .font(.largeTitle.bold())

            Text(founderProduct?.displayPrice ?? "$1.99")
                .font(.system(size: 52, weight: .black))

            Text("A one-time payment that helps keep this project calm, private, and login-free.")
                .font(.body)
                .foregroundStyle(.secondary)

            if let purchaseError {
                Text(purchaseError)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            Button("Pay \(founderProduct?.displayPrice ?? "$1.99")") {
                Task { await purchaseFounderEdition() }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            Button("Continue for Free / Skip") {
                page = 3
            }
            .buttonStyle(.plain)
        }
        .padding(24)
    }

    private var widgetInstructions: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Add the widget.")
                .font(.largeTitle.bold())

            instructionRow(number: 1, text: "Long-press your Home Screen or Lock Screen.")
            instructionRow(number: 2, text: "Tap Edit or the add button.")
            instructionRow(number: 3, text: "Choose Daily Focus and place the widget.")

            Button("Finish") {
                isOnboardingCompleted = true
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding(24)
    }

    private func instructionRow(number: Int, text: String) -> some View {
        HStack(spacing: 14) {
            Text("\(number)")
                .font(.headline)
                .frame(width: 34, height: 34)
                .background(Color.green.opacity(0.18))
                .clipShape(Circle())
            Text(text)
                .font(.body)
        }
    }

    private func loadFounderProduct() async {
        do {
            founderProduct = try await Product.products(for: [productID]).first
        } catch {
            purchaseError = "Could not load StoreKit product."
        }
    }

    private func purchaseFounderEdition() async {
        guard let founderProduct else {
            page = 3
            return
        }

        do {
            let result = try await founderProduct.purchase()
            if case .success(let verification) = result,
               case .verified(let transaction) = verification {
                await transaction.finish()
            }
            page = 3
        } catch {
            purchaseError = error.localizedDescription
        }
    }

    private func label(for category: String) -> String {
        category == "Bible" ? "Bible Verses" : category == "Quote" ? "Daily Quotes" : "Meditation"
    }

    private func description(for category: String) -> String {
        switch category {
        case "Bible": return "A daily verse for prayer and reflection."
        case "Quote": return "Short encouragement for a clear, steady day."
        default: return "Quiet prompts for breath, grounding, and calm."
        }
    }
}
