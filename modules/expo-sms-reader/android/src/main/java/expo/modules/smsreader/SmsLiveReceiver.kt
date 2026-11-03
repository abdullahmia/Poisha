package expo.modules.smsreader

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony

/**
 * Catches messages as they arrive while the app is in the foreground, so a
 * transaction appears in the review queue within a moment of paying rather than
 * on next launch.
 *
 * This is a latency optimisation and nothing more. It is registered
 * dynamically, so it dies with the process; anything it misses is picked up by
 * the next inbox scan. That property is worth protecting — it means a dropped
 * broadcast can never cost the user a transaction.
 */
class SmsLiveReceiver(private val onMessage: (Bundle) -> Unit) : BroadcastReceiver() {

  override fun onReceive(context: Context?, intent: Intent?) {
    if (intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    try {
      val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
      if (parts.isEmpty()) return

      // Bank and bKash alerts routinely exceed 160 characters and arrive as
      // several PDUs. Reading only parts[0] yields a truncated body, and a body
      // cut off mid-sentence is worse than no body at all: the amount regex
      // happily matches whatever number survived, usually the balance.
      val body = parts.joinToString("") { it.messageBody.orEmpty() }
      if (body.isBlank()) return

      val sender = parts[0].displayOriginatingAddress.orEmpty()
      val timestamp = parts[0].timestampMillis

      // `timestampMillis` IS the SMSC time, i.e. the provider's `date_sent`.
      // Passing it as both arguments makes this path hash identically to the
      // inbox scan that will later see the same message.
      onMessage(SmsInboxReader.toBundle(sender, body, timestamp, timestamp))
    } catch (_: Exception) {
      // A malformed PDU from one carrier must never take down the host app.
    }
  }
}
