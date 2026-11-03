package expo.modules.smsreader

import android.content.Context
import android.os.Bundle
import android.provider.Telephony

/**
 * Reads candidate transaction messages out of `content://sms/inbox`.
 *
 * The pre-filter is the whole point of doing this in Kotlin. A real inbox holds
 * thousands of messages; without it every one of them would be marshalled
 * across the bridge and run through forty regexes on the JS thread. Filtering
 * here typically reduces a 200-message batch to under ten.
 */
object SmsInboxReader {

  fun scan(
    context: Context,
    sinceMs: Long,
    limit: Int,
    senderHints: List<String>,
    keywordHints: List<String>
  ): List<Bundle> {
    val projection = arrayOf(
      Telephony.Sms._ID,
      Telephony.Sms.ADDRESS,
      Telephony.Sms.BODY,
      Telephony.Sms.DATE,
      Telephony.Sms.DATE_SENT
    )

    // ASC, not DESC: the caller advances a watermark over this batch, so it has
    // to consume oldest-first or it would skip everything between the newest
    // message and the cursor it started from.
    val sortOrder = "${Telephony.Sms.DATE} ASC LIMIT $limit"

    val upperSenders = senderHints.map { it.uppercase() }
    val lowerKeywords = keywordHints.map { it.lowercase() }
    val results = mutableListOf<Bundle>()

    // Returns null on a device with no telephony stack — don't assert on it.
    val cursor = context.contentResolver.query(
      Telephony.Sms.Inbox.CONTENT_URI,
      projection,
      "${Telephony.Sms.DATE} > ?",
      arrayOf(sinceMs.toString()),
      sortOrder
    ) ?: return results

    cursor.use {
      val addressIdx = it.getColumnIndex(Telephony.Sms.ADDRESS)
      val bodyIdx = it.getColumnIndex(Telephony.Sms.BODY)
      val dateIdx = it.getColumnIndex(Telephony.Sms.DATE)
      val dateSentIdx = it.getColumnIndex(Telephony.Sms.DATE_SENT)

      while (it.moveToNext()) {
        val sender = if (addressIdx >= 0) it.getString(addressIdx).orEmpty() else ""
        val body = if (bodyIdx >= 0) it.getString(bodyIdx).orEmpty() else ""
        val date = if (dateIdx >= 0) it.getLong(dateIdx) else 0L
        val dateSent = if (dateSentIdx >= 0) it.getLong(dateSentIdx) else 0L

        if (body.isBlank() || date == 0L) continue
        if (!isCandidate(sender, body, upperSenders, lowerKeywords)) continue

        results.add(toBundle(sender, body, date, dateSent))
      }
    }

    return results
  }

  /**
   * Kept deliberately loose — this decides what the TypeScript parser is even
   * allowed to see, so a false negative here is invisible and unfixable over
   * the air. False positives cost nothing: the parser rejects them.
   */
  private fun isCandidate(
    sender: String,
    body: String,
    upperSenders: List<String>,
    lowerKeywords: List<String>
  ): Boolean {
    if (upperSenders.isEmpty() && lowerKeywords.isEmpty()) return true

    val normalizedSender = SmsHash.normalizeSender(sender)
    if (upperSenders.any { normalizedSender.contains(it) }) return true

    val lowerBody = body.lowercase()
    return lowerKeywords.any { lowerBody.contains(it) }
  }

  fun toBundle(sender: String, body: String, date: Long, dateSent: Long): Bundle {
    // Hash on the SMSC timestamp where there is one, so a message seen by both
    // the live receiver and a later inbox scan produces one identity, not two.
    val hashTimestamp = if (dateSent != 0L) dateSent else date

    return Bundle().apply {
      putString("smsHash", SmsHash.compute(sender, body, hashTimestamp))
      putString("sender", sender)
      putString("body", body)
      // `date` (not `dateSent`) drives the scan cursor: it is the column the
      // query sorts and filters on, so the watermark must be in its terms.
      putDouble("receivedAt", date.toDouble())
    }
  }
}
