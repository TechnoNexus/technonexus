import SwiftUI

struct DashboardView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("NEXUS DASHBOARD")
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .kerning(2)
                        .foregroundColor(.neonCyan)
                    
                    HStack(spacing: 8) {
                        Text("TECHNO")
                            .font(.system(size: 32, weight: .black))
                            .foregroundColor(.white)
                        Text("NEXUS")
                            .font(.system(size: 32, weight: .black))
                            .foregroundColor(.neonCyan)
                    }
                }
                .padding(.top, 40)
                
                Spacer().frame(height: 24)
                
                // Modules
                NexusModule(
                    title: "NEXUS ARCADE",
                    description: "High-performance multiplayer gaming hub.",
                    accentColor: .neonCyan,
                    status: "LIVE"
                )
                
                NexusModule(
                    title: "NEXUS FORGE",
                    description: "Open-source repositories and automation.",
                    accentColor: .electricViolet,
                    status: "SYNCED"
                )
                
                NexusModule(
                    title: "NEXUS COOK",
                    description: "AI Chef platform for culinary innovation.",
                    accentColor: Color.yellow,
                    status: "EXTERNAL"
                )
                
                Spacer().frame(height: 100)
            }
            .padding(24)
        }
        .background(Color.darkBg.edgesIgnoringSafeArea(.all))
    }
}

struct NexusModule: View {
    let title: String
    let description: String
    let accentColor: Color
    let status: String
    
    var body: some View {
        NexusCard(borderColor: accentColor.opacity(0.3)) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(title)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Text(status)
                        .font(.system(size: 8, weight: .black, design: .monospaced))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(accentColor.opacity(0.1))
                        .foregroundColor(accentColor)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(accentColor.opacity(0.2), lineWidth: 1)
                        )
                }
                
                Text(description)
                    .font(.system(size: 14))
                    .foregroundColor(.slateGray)
                    .lineSpacing(4)
                
                Spacer().frame(height: 12)
                
                Button(action: { /* Navigate */ }) {
                    Text("ENTER MODULE")
                        .font(.system(size: 10, weight: .black, design: .monospaced))
                        .kerning(2)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(accentColor.opacity(0.1))
                        .foregroundColor(accentColor)
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(accentColor.opacity(0.3), lineWidth: 1)
                        )
                }
            }
        }
    }
}
