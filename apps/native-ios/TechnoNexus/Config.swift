import Foundation

enum Config {
    static func value(for key: String) -> String {
        guard let value = Bundle.main.infoDictionary?[key] as? String else {
            fatalError("Secret key \(key) not found in Info.plist")
        }
        return value.replacingOccurrences(of: "\\", with: "")
    }

    static var supabaseUrl: String {
        return value(for: "SUPABASE_URL")
    }

    static var supabaseKey: String {
        return value(for: "SUPABASE_KEY")
    }
}
