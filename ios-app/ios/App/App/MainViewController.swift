import UIKit
import Capacitor

/// The app's web view, made by SceneDelegate (Main.storyboard names it too, but the scene builds its own window). Registers the app's own plugins, which live in this target rather than in npm.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WebAuthPlugin())
    }
}
