package expo.modules.smsreader

import android.content.Context

/**
 * The only state the background receiver can see.
 *
 * A manifest receiver wakes the process without a JS runtime, so it can read
 * neither AsyncStorage nor anything else the app normally keeps its settings
 * in. Everything it needs is mirrored here from TypeScript.
 *
 * The filter hints and the notification copy live here rather than being
 * hardcoded in Kotlin for one reason: native code can only ship as a fresh
 * install, while TypeScript ships with `eas update`. Keeping these on the JS
 * side of the line means the wording and the sender list stay fixable.
 */
object SmsAlertPrefs {

  private const val FILE = "expo_sms_reader_prefs"
  private const val KEY_ENABLED = "background_alerts_enabled"
  private const val KEY_SENDERS = "sender_hints"
  private const val KEY_KEYWORDS = "keyword_hints"
  private const val KEY_TITLE = "notification_title"
  private const val KEY_BODY = "notification_body"
  private const val SEPARATOR = ""

  data class Snapshot(
    val enabled: Boolean,
    val senderHints: List<String>,
    val keywordHints: List<String>,
    val title: String,
    val body: String
  )

  fun write(
    context: Context,
    enabled: Boolean,
    senderHints: List<String>,
    keywordHints: List<String>,
    title: String,
    body: String
  ) {
    context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_ENABLED, enabled)
      .putString(KEY_SENDERS, senderHints.joinToString(SEPARATOR))
      .putString(KEY_KEYWORDS, keywordHints.joinToString(SEPARATOR))
      .putString(KEY_TITLE, title)
      .putString(KEY_BODY, body)
      .apply()
  }

  fun read(context: Context): Snapshot {
    val prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
    return Snapshot(
      enabled = prefs.getBoolean(KEY_ENABLED, false),
      senderHints = prefs.getString(KEY_SENDERS, "").orEmpty().split(SEPARATOR).filter { it.isNotBlank() },
      keywordHints = prefs.getString(KEY_KEYWORDS, "").orEmpty().split(SEPARATOR).filter { it.isNotBlank() },
      title = prefs.getString(KEY_TITLE, "").orEmpty(),
      body = prefs.getString(KEY_BODY, "").orEmpty()
    )
  }
}
