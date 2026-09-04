import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { env, isBackupConfigured } from "./env.config";

export const DRIVE_APPDATA_SCOPE =
  "https://www.googleapis.com/auth/drive.appdata";

if (isBackupConfigured) {
  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    iosClientId: env.googleIosClientId,
    scopes: [DRIVE_APPDATA_SCOPE],
    offlineAccess: false,
  });
}
