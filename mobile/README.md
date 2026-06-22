# Insomniyuck Android

Private Android wrapper for `https://insomniyuck.me`.

The app opens the live Studio first, so published website updates appear
without rebuilding the APK. Use **Close Studio** to browse the public site.
The Android photo picker works inside the app.

## Build

The local helper toolchains are stored in `.toolchains/` and are intentionally
not committed. After they are installed, build with:

```sh
./build-debug.sh
```

The resulting private APK is copied to:

`Insomniyuck-debug.apk`
