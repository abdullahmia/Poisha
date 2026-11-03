package expo.modules.smsreader

import android.Manifest
import android.content.Context
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.provider.Telephony
import androidx.core.content.ContextCompat
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ScanOptions : Record {
  @Field var sinceMs: Double = 0.0
  @Field var limit: Int = 200
  @Field var senderHints: List<String> = emptyList()
  @Field var keywordHints: List<String> = emptyList()
}

class BackgroundAlertOptions : Record {
  @Field var enabled: Boolean = false
  @Field var senderHints: List<String> = emptyList()
  @Field var keywordHints: List<String> = emptyList()
  @Field var title: String = ""
  @Field var body: String = ""
}

/**
 * Reads bank transaction SMS off the device.
 *
 * Deliberately dumb. It returns raw sender/body/timestamp triples and does no
 * interpretation whatsoever — every regex, every rule, every heuristic lives in
 * TypeScript. That split is not stylistic: adding this module changes the EAS
 * fingerprint, so native code can only ship as a fresh install, while the
 * parser can be corrected with an `eas update` the day a bank changes its
 * wording. Anything smart put in here becomes un-fixable.
 */
class SmsReaderModule : Module() {

  private var liveReceiver: SmsLiveReceiver? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoSmsReader")

    Events("onSmsReceived")

    // Tablets and other non-telephony devices have no SMS provider at all, so
    // the feature must hide rather than prompt for a permission it can't use.
    Function("isAvailable") {
      context.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)
    }

    // Cheap and synchronous so the scan loop can gate on it every run — the
    // user can revoke READ_SMS at any time, and Android auto-revokes it for
    // apps left unused.
    Function("hasGrantedPermissions") {
      appContext.permissions?.hasGrantedPermissions(Manifest.permission.READ_SMS) ?: false
    }

    AsyncFunction("getPermissionsAsync") { promise: expo.modules.kotlin.Promise ->
      Permissions.getPermissionsWithPermissionsManager(
        appContext.permissions,
        promise,
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS
      )
    }

    AsyncFunction("requestPermissionsAsync") { promise: expo.modules.kotlin.Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        appContext.permissions,
        promise,
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS
      )
    }

    // AsyncFunction, not Function: the body runs on the module queue, which
    // keeps the cursor walk and the SHA-256 hashing off the JS thread. A
    // synchronous version of this would jank every scan.
    AsyncFunction("scanInboxAsync") { options: ScanOptions ->
      SmsInboxReader.scan(
        context = context,
        sinceMs = options.sinceMs.toLong(),
        limit = options.limit.coerceIn(1, 500),
        senderHints = options.senderHints,
        keywordHints = options.keywordHints
      )
    }

    // Mirrors the background-notification settings into SharedPreferences,
    // which is the only storage the manifest receiver can reach — it wakes a
    // process with no JS runtime, so it can't read AsyncStorage.
    AsyncFunction("setBackgroundAlertsAsync") { options: BackgroundAlertOptions ->
      SmsAlertPrefs.write(
        context = context,
        enabled = options.enabled,
        senderHints = options.senderHints,
        keywordHints = options.keywordHints,
        title = options.title,
        body = options.body
      )
    }

    // Fires when the first JS listener attaches and the last one detaches —
    // exactly the lifetime the receiver should have, with no manual start/stop
    // API for a caller to get wrong.
    OnStartObserving("onSmsReceived") {
      if (liveReceiver != null) return@OnStartObserving

      val receiver = SmsLiveReceiver { payload -> sendEvent("onSmsReceived", payload) }
      liveReceiver = receiver

      // RECEIVER_EXPORTED is mandatory, not optional: on targetSdk 34+ an
      // unflagged registerReceiver throws SecurityException at runtime, and
      // SMS_RECEIVED is a system broadcast, so exported is the correct flag.
      ContextCompat.registerReceiver(
        context,
        receiver,
        IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION),
        ContextCompat.RECEIVER_EXPORTED
      )
    }

    OnStopObserving("onSmsReceived") {
      unregisterLiveReceiver()
    }

    OnDestroy {
      unregisterLiveReceiver()
    }
  }

  private fun unregisterLiveReceiver() {
    val receiver = liveReceiver ?: return
    liveReceiver = null
    try {
      context.unregisterReceiver(receiver)
    } catch (_: Exception) {
      // Already gone — the context was torn down before we got here.
    }
  }
}
