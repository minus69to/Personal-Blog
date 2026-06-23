# Insomniyuck Android

Private Android wrapper for `https://insomniyuck.me`.

The app opens the live Studio first, so published website updates appear
without rebuilding the APK. Use **Close Studio** to browse the public site.
The Android photo picker works inside the app.

The post share button can open a generated photo-and-title card directly in
Instagram Stories. For Instagram attribution-link support, export the public
Meta App ID before building:

```sh
export META_APP_ID="your-public-meta-app-id"
```

Instagram controls whether the attribution link is displayed and may require
the app ID to be approved for Story sharing. The App ID is public configuration,
not an App Secret.

## Build

The local helper toolchains are stored in `.toolchains/` and are intentionally
not committed. After they are installed, build with:

```sh
./build-debug.sh
```

The resulting private APK is copied to:

`Insomniyuck-debug.apk`
