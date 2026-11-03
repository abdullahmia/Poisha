package expo.modules.smsreader

import java.security.MessageDigest

/**
 * Stable identity for a message, used as the dedup key in SQLite.
 *
 * Deliberately NOT the provider's `_id`: that is a row id local to one
 * telephony database and is reassigned when the user restores their phone, so
 * every message would re-queue after a device migration.
 *
 * The timestamp component is the SMSC time (`date_sent`) when the provider has
 * one. That matters because the live broadcast path only ever sees
 * `SmsMessage.getTimestampMillis()`, which IS the SMSC time — hashing on the
 * provider's `date` there instead would give the same message two different
 * hashes and queue it twice. Some OEMs leave `date_sent` at 0, hence the
 * fallback to `date`.
 */
object SmsHash {

  fun compute(sender: String, body: String, timestampMs: Long): String {
    val material = "${normalizeSender(sender)}$body$timestampMs"
    val digest = MessageDigest.getInstance("SHA-256").digest(material.toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { "%02x".format(it) }
  }

  /**
   * The same bank reaches the inbox as `bKash`, `16247` or `+88016247`
   * depending on route, and an unnormalized hash would treat those as three
   * different senders.
   *
   * Follows the same shape as `normalizeSender` in sms-parser.util.ts, but byte
   * parity with it is not required and should not be relied on: the hash never
   * leaves Kotlin, and the only invariant that matters is that the inbox-scan
   * and live-broadcast paths here agree with each other.
   */
  fun normalizeSender(sender: String): String {
    val upper = sender.uppercase().filter { it.isLetterOrDigit() }
    val withoutCountry = upper.removePrefix("0088").let {
      if (it == upper) upper.removePrefix("880") else it
    }
    val trimmed = withoutCountry.trimStart('0')
    return trimmed.ifEmpty { upper }
  }
}
