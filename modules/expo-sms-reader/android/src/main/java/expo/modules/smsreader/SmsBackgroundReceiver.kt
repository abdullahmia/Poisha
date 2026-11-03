package expo.modules.smsreader

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Nudges the user when a transaction message arrives with the app closed.
 *
 * It does NOT parse, and that is the whole design. Running the TypeScript
 * parser here would need a second JS runtime with its own `expo-sqlite` handle,
 * colliding with the module-scope singleton the app already holds open — and
 * on the Xiaomi/Realme/Oppo/Vivo devices this feature is actually aimed at, an
 * unwhitelisted sideloaded receiver gets throttled or killed within days.
 *
 * So this posts a notification and stops. The real parse still happens on next
 * foreground, via the content-provider scan. That keeps exactly one parsing
 * code path, keeps it fixable over the air, and — most importantly — makes a
 * missed wake-up completely harmless rather than a lost transaction.
 */
class SmsBackgroundReceiver : BroadcastReceiver() {

  companion object {
    private const val CHANNEL_ID = "sms-detected"
    private const val CHANNEL_NAME = "Detected transactions"

    // Fixed id: three messages in a row should replace one notification, not
    // stack three identical ones in the shade.
    private const val NOTIFICATION_ID = 7714
  }

  override fun onReceive(context: Context?, intent: Intent?) {
    if (context == null) return
    if (intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    try {
      val prefs = SmsAlertPrefs.read(context)
      if (!prefs.enabled) return

      // The user can revoke notification permission independently. Posting into
      // a void is harmless but pointless; checking also avoids the log noise.
      if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return

      val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
      if (parts.isEmpty()) return

      val body = parts.joinToString("") { it.messageBody.orEmpty() }
      val sender = parts[0].displayOriginatingAddress.orEmpty()
      if (body.isBlank()) return

      // Without this, every text from a friend would notify. The hints come
      // from JS so the filter stays correctable without a new install.
      if (!looksLikeTransaction(sender, body, prefs)) return

      ensureChannel(context)
      post(context, prefs)
    } catch (_: Exception) {
      // A malformed PDU or an OEM quirk must never crash the host app from a
      // background broadcast, where the user has no context for the crash.
    }
  }

  private fun looksLikeTransaction(sender: String, body: String, prefs: SmsAlertPrefs.Snapshot): Boolean {
    if (prefs.senderHints.isEmpty() && prefs.keywordHints.isEmpty()) return false

    val normalizedSender = SmsHash.normalizeSender(sender)
    if (prefs.senderHints.any { normalizedSender.contains(it.uppercase()) }) return true

    val lowerBody = body.lowercase()
    return prefs.keywordHints.any { lowerBody.contains(it.lowercase()) }
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    // Created here rather than relying on the JS-side channel setup: this
    // receiver runs in a process where the JS bundle may never have been
    // evaluated, so it cannot assume any channel already exists.
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return

    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_DEFAULT).apply {
        description = "A bank message arrived that looks like a transaction"
        enableVibration(false)
      }
    )
  }

  private fun post(context: Context, prefs: SmsAlertPrefs.Snapshot) {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }

    val pending = launch?.let {
      PendingIntent.getActivity(
        context,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }

    // The message body is deliberately NOT included. A lock-screen notification
    // is visible to anyone holding the phone, and the amount is exactly the
    // thing the app's PIN lock exists to keep behind a PIN.
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.stat_notify_chat)
      .setContentTitle(prefs.title)
      .setContentText(prefs.body)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setAutoCancel(true)
      .apply { pending?.let { setContentIntent(it) } }
      .build()

    NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
  }
}
