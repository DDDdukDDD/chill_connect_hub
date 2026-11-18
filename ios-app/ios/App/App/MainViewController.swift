import UIKit
import Capacitor

/// The app's web view (Main.storyboard). Registers the app's own plugins, which live in this target rather than in npm.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WebAuthPlugin())
    }
}
