import { GoogleSignin } from '@react-native-google-signin/google-signin';

const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Everything lives in Drive's hidden per-app folder: invisible in the Drive UI,
 * unreadable by other apps, and reached with the non-sensitive `drive.appdata`
 * scope — so no OAuth verification review is needed.
 */
const SPACE = 'appDataFolder';

const FILE_PREFIX = 'poisha-backup-';

/** Drive metadata for one stored backup, cheap enough to list without downloading. */
export interface TDriveBackupFile {
  id: string;
  name: string;
  /** Bytes, as reported by Drive. Absent on some responses, hence the fallback. */
  size: number;
  modifiedTime: string;
  entryCount: number | null;
  schemaVersion: number | null;
  appVersion: string | null;
}

interface DriveFileResponse {
  id: string;
  name: string;
  size?: string;
  modifiedTime: string;
  appProperties?: Record<string, string>;
}

async function authHeaders(): Promise<Record<string, string>> {
  // Refreshes the access token internally when it has expired.
  const { accessToken } = await GoogleSignin.getTokens();
  return { Authorization: `Bearer ${accessToken}` };
}

async function ensureOk(res: Response, action: string): Promise<void> {
  if (res.ok) return;
  // Drive returns a JSON error body; surface its message when there is one, so
  // a 403 for "API not enabled" doesn't read as an opaque status code.
  let detail = '';
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    detail = body?.error?.message ? ` — ${body.error.message}` : '';
  } catch {
    // Non-JSON body; the status alone will have to do.
  }
  throw new Error(`Drive ${action} failed (${res.status})${detail}`);
}

function toBackupFile(file: DriveFileResponse): TDriveBackupFile {
  const props = file.appProperties ?? {};
  const entryCount = Number(props.entryCount);
  const schemaVersion = Number(props.schemaVersion);

  return {
    id: file.id,
    name: file.name,
    size: Number(file.size ?? 0),
    modifiedTime: file.modifiedTime,
    entryCount: Number.isFinite(entryCount) && props.entryCount !== undefined ? entryCount : null,
    schemaVersion: Number.isFinite(schemaVersion) && props.schemaVersion !== undefined ? schemaVersion : null,
    appVersion: props.appVersion ?? null,
  };
}

/** Newest first. */
export async function listBackups(): Promise<TDriveBackupFile[]> {
  const params = new URLSearchParams({
    spaces: SPACE,
    q: `name contains '${FILE_PREFIX}' and trashed = false`,
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,size,modifiedTime,appProperties)',
    pageSize: '20',
  });

  const res = await fetch(`${DRIVE}/files?${params}`, { headers: await authHeaders() });
  await ensureOk(res, 'list');

  const body = (await res.json()) as { files?: DriveFileResponse[] };
  return (body.files ?? []).map(toBackupFile);
}

/**
 * Uploads one snapshot as a new timestamped file.
 *
 * A multipart body is assembled as a plain string rather than FormData: the
 * payload is small UTF-8 JSON, and RN's FormData does not produce the
 * `multipart/related` shape Drive expects. If snapshots ever approach 5 MB,
 * this needs to become a resumable upload.
 */
export async function uploadBackup(
  payload: string,
  meta: { createdAt: string; entryCount: number; schemaVersion: number; appVersion: string },
): Promise<TDriveBackupFile> {
  const metadata = {
    name: `${FILE_PREFIX}${meta.createdAt}.json`,
    parents: [SPACE],
    mimeType: 'application/json',
    // appProperties values must be strings.
    appProperties: {
      entryCount: String(meta.entryCount),
      schemaVersion: String(meta.schemaVersion),
      appVersion: meta.appVersion,
    },
  };

  const boundary = `poisha${Date.now()}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${payload}\r\n` +
    `--${boundary}--`;

  const res = await fetch(`${UPLOAD}/files?uploadType=multipart&fields=id,name,size,modifiedTime,appProperties`, {
    method: 'POST',
    headers: {
      ...(await authHeaders()),
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  await ensureOk(res, 'upload');

  return toBackupFile((await res.json()) as DriveFileResponse);
}

export async function downloadBackup(fileId: string): Promise<unknown> {
  const res = await fetch(`${DRIVE}/files/${fileId}?alt=media`, { headers: await authHeaders() });
  await ensureOk(res, 'download');

  // Parsed here but validated by parseBackupSnapshot before it reaches SQLite.
  return res.json();
}

/**
 * Permanent delete, not trash — files in appDataFolder cannot be trashed and
 * an attempt to do so errors.
 */
export async function deleteBackup(fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE}/files/${fileId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  await ensureOk(res, 'delete');
}
