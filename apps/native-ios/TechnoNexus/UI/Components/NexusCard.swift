import SwiftUI

struct NexusCard<Content: View>: View {
    var borderColor: Color = .white.opacity(0.1)
    let content: Content
    
    init(borderColor: Color = .white.opacity(0.1), @ViewBuilder content: () -> Content) {
        self.borderColor = borderColor
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(24)
            .background(Color.glassWhite)
            .cornerRadius(32)
            .overlay(
                RoundedRectangle(cornerRadius: 32)
                    .stroke(borderColor, lineWidth: 1)
            )
    }
}
