import Foundation
import AuthenticationServices
import Capacitor

/// Social sign-in in the system sheet (iPhone step 2, 2026-11-18). Google refuses sign-in inside an embedded web view,
/// so the site calls `WebAuth.start({ url, scheme })` (lib/nativeAuth.ts): the sheet opens the site's own sign-in start,
/// and when the site sends it to `chillwaa://auth?...` the sheet closes and that URL comes back to the page, which trades
/// its code for a session (lib/members/appAuth.ts). Only Chillwaa's own https pages can be opened.
@objc(WebAuthPlugin)
public class WebAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    public let identifier = "WebAuthPlugin"
    public let jsName = "WebAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise)
    ]

    private static let allowedHosts: Set<String> = ["www.chillwaa.com", "chillwaa.com"]
    private var session: ASWebAuthenticationSession?

    @objc func start(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw), url.scheme == "https",
              let host = url.host, WebAuthPlugin.allowedHosts.contains(host) else {
            call.reject("This sign-in address is not allowed")
            return
        }
        let scheme = call.getString("scheme") ?? "chillwaa"
        DispatchQueue.main.async {
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { [weak self] callbackURL, error in
                self?.session = nil
                if let callbackURL = callbackURL {
                    call.resolve(["url": callbackURL.absoluteString])
                } else if let authError = error as? ASWebAuthenticationSessionError, authError.code == .canceledLogin {
                    call.resolve(["cancelled": true])
                } else {
                    call.reject(error?.localizedDescription ?? "Sign-in failed")
                }
            }
            session.presentationContextProvider = self
            // Shares Safari's sign-ins, so a member already signed in to Google there only picks the account
            session.prefersEphemeralWebBrowserSession = false
            self.session = session
            if !session.start() {
                self.session = nil
                call.reject("Could not open sign-in")
            }
        }
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return bridge?.viewController?.view.window ?? ASPresentationAnchor()
    }
}
