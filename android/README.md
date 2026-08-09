# Kurukoo Android App

This directory contains the source code for the Kurukoo Android application. It implements Phase 2 of the Mobile Strategy (§14) by providing a native wrapper around the Kurukoo PWA.

## Architecture

The app uses a `WebView` to render the Kurukoo PWA (hosted at `https://kurukoo.com`). This approach allows for rapid deployment and updates, as changes to the web application are immediately reflected in the native app without requiring users to download an update from the Play Store.

It uses Kotlin and the modern Android SDK (API 34).

## Features

- **PWA Wrapper**: Loads the main Kurukoo web application in a full-screen, frameless WebView.
- **African Modernism Theme**: The Android theme is configured to use the Kurukoo brand colors (Cream, Terracotta, Electric Blue, Charcoal).
- **Universal Links / App Links**: The app is configured to handle `https://kurukoo.com` links natively.

## Requirements

- Android Studio Giraffe | 2022.3.1 or newer.
- Android SDK API 34.
- Java 17+.

## Building and Running

1. Open Android Studio and select "Open an existing project".
2. Navigate to this `/android` directory and select it.
3. Allow Android Studio to sync the project and download Gradle dependencies.
4. Select an emulator or connected physical device.
5. Click the "Run" button (green play icon) or use the shortcut `Shift + F10`.

## Future Roadmap (Phase 3)

As per the blueprint, the future roadmap includes transitioning to a cross-platform native app (e.g., Flutter or React Native) to leverage deep OS capabilities such as:
- Biometric authentication.
- Background location for delivery tracking.
- Native contact sync.
- Offline SQLite state sync.
