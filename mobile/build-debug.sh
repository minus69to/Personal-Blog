#!/usr/bin/env bash

set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export JAVA_HOME="$MOBILE_DIR/.toolchains/jdk"
export ANDROID_HOME="$MOBILE_DIR/.toolchains/android-sdk"
export GRADLE_USER_HOME="$MOBILE_DIR/.toolchains/gradle-home"

cd "$MOBILE_DIR"
npx cap sync android

cd android
./gradlew assembleDebug

cp app/build/outputs/apk/debug/app-debug.apk "$MOBILE_DIR/Insomniyuck-debug.apk"

echo "APK ready: $MOBILE_DIR/Insomniyuck-debug.apk"
