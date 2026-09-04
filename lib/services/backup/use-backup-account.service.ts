import {
  GoogleSignin,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  type User,
} from '@react-native-google-signin/google-signin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { isBackupConfigured } from '@/lib/config';
import { storage } from '@/lib/storages';

export type TBackupAccountState =
  /** No client id in this build, or the device has no Play Services. */
  | { status: 'unavailable'; email: null }
  | { status: 'disconnected'; email: null }
  /** Previously connected, but Google no longer honours the session. */
  | { status: 'needs-reconnect'; email: string | null }
  | { status: 'connected'; email: string | null };

function emailOf(user: User): string | null {
  return user.user.email ?? null;
}

async function playServicesAvailable(): Promise<boolean> {
  try {
    return await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
  } catch {
    // Throws outright on de-Googled devices and custom ROMs.
    return false;
  }
}

/**
 * Resolves the current Drive account without prompting.
 *
 * Deliberately no `initialData`: the app-wide `staleTime: Infinity` would make
 * a seeded value look already-fetched and this would never run. See the note in
 * use-plan-mode-enabled.service.ts.
 */
export function useBackupAccount() {
  return useQuery({
    queryKey: QUERY_KEYS.backup.account,
    queryFn: async (): Promise<TBackupAccountState> => {
      if (!isBackupConfigured || !(await playServicesAvailable())) {
        return { status: 'unavailable', email: null };
      }

      const remembered = await storage.getItem(ASYNC_STORAGE_KEYS.backupAccountEmail);

      try {
        // `signInSilently` resolves with its own union — success or
        // noSavedCredentialFound — so the interactive `isSuccessResponse`
        // guard does not apply here.
        const response = await GoogleSignin.signInSilently();
        if (!isNoSavedCredentialFoundResponse(response)) {
          const email = emailOf(response.data);
          if (email) await storage.setItem(ASYNC_STORAGE_KEYS.backupAccountEmail, email);
          return { status: 'connected', email: email ?? remembered };
        }
      } catch {
        // Access revoked from the Google account page, or the grant expired.
        // Distinguish that from "never connected" so the UI can say Reconnect.
        if (remembered) return { status: 'needs-reconnect', email: remembered };
      }

      return remembered
        ? { status: 'needs-reconnect', email: remembered }
        : { status: 'disconnected', email: null };
    },
  });
}

/**
 * Interactive sign-in. Callers must run this inside `runWithoutAutoLock` from
 * the lock context — the account picker is a separate Activity, and without
 * the suppression the app locks and unmounts the screen mid-flow.
 */
export function useConnectBackupAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<TBackupAccountState> => {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        // Cancelled — not an error worth alerting about.
        return { status: 'disconnected', email: null };
      }

      const email = emailOf(response.data);
      if (email) await storage.setItem(ASYNC_STORAGE_KEYS.backupAccountEmail, email);
      return { status: 'connected', email };
    },
    onSuccess: state => queryClient.setQueryData(QUERY_KEYS.backup.account, state),
  });
}

export function useDisconnectBackupAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await GoogleSignin.signOut().catch(() => {});
      await storage.removeItem(ASYNC_STORAGE_KEYS.backupAccountEmail);
      // Disconnecting the account necessarily turns backup off — leaving the
      // toggle on would promise uploads that cannot happen.
      await storage.setItem(ASYNC_STORAGE_KEYS.backupEnabled, 'false');
    },
    onSuccess: () => {
      queryClient.setQueryData<TBackupAccountState>(QUERY_KEYS.backup.account, {
        status: 'disconnected',
        email: null,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backup.settings });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.backup.list });
    },
  });
}
