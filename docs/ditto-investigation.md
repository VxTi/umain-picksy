# Ditto in Rust with Tauri

Tauri has a Rust backend, meaning your non-visual code will probably be Rust.
There is a Rust SDK for Ditto, so you'd use that. But Tauri can build for many architectures & platforms. When building for iOS and Android you'll run into these errors:

```
`LIBDITTO_STATIC` not set, defaulting to `static`
TARGET_DIR may be /Users/hbanken/Projects/Q42/umain-picksy/src-tauri/target/aarch64-linux-android/debug
AARCH64_LINUX_ANDROID_OUT_DIR unset
OUT_DIR = /Users/hbanken/Projects/Q42/umain-picksy/src-tauri/target/aarch64-linux-android/debug/build/dittolive-ditto-sys-6b8b9b3b81cd7d68/out
Checking for /Users/hbanken/Projects/Q42/umain-picksy/libdittoffi.a
Checking for /Users/hbanken/Projects/Q42/umain-picksy/src-tauri/target/aarch64-linux-android/debug/libdittoffi.a
Checking for /Users/hbanken/Projects/Q42/umain-picksy/src-tauri/target/aarch64-linux-android/debug/deps/libdittoffi.a
Checking for /Users/hbanken/Projects/Q42/umain-picksy/src-tauri/target/aarch64-linux-android/debug/build/dittolive-ditto-sys-6b8b9b3b81cd7d68/out/libdittoffi.a
https://software.ditto.live/rust/Ditto/4.13.3/aarch64-apple-ios/release/libdittoffi.a
curl: (56) The requested URL returned error: 404

thread 'main' panicked at /Users/hbanken/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/dittolive-ditto-sys-4.13.3/build.rs:360:17:
Failed to download Ditto SDK binary component
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

## Mobile SDK override (Android/iOS)

For mobile builds, you can provide the closed-source Ditto SDK yourself (from the
Android/iOS SDKs) instead of using the Rust SDK. Point the build to the prebuilt
Ditto FFI library by exporting one of the following environment variables.

Android (aarch64):

```bash
export DITTOFFI_SEARCH_PATH=/path/to/ditto/android/aarch64
# or
export AARCH64_LINUX_ANDROID_OUT_DIR=/path/to/ditto/android/aarch64
RUSTUP_TOOLCHAIN=1.88 bunx tauri android dev
```

iOS (aarch64):

```bash
export DITTOFFI_SEARCH_PATH=/path/to/ditto/ios/aarch64
# or
export AARCH64_APPLE_IOS_OUT_DIR=/path/to/ditto/ios/aarch64
RUSTUP_TOOLCHAIN=1.88 bunx tauri ios dev
```

## Unzipping libraries for Flutter, Android & iOS

Flutter contains shared code and a bridge for each platforms native code. But those are
all part of the platforms individual SDKs and included via podspec and CMakeLists.txt,
and use FFI (foreign function interface).

```
/Users/hbanken/Downloads/ditto_live-4.14.2
├── analysis_options.yaml
├── android
│   ├── build.gradle
│   ├── gradle
│   │   └── wrapper
│   │       └── gradle-wrapper.properties
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── settings.gradle
│   └── src
│       ├── jniLibs
│       │   ├── arm64-v8a
│       │   │   └── libflutter_plugin.so
│       │   ├── armeabi-v7a
│       │   │   └── libflutter_plugin.so
│       │   ├── x86
│       │   │   └── libflutter_plugin.so
│       │   └── x86_64
│       │       └── libflutter_plugin.so
│       └── main
│           ├── AndroidManifest.xml
│           └── kotlin
│               └── live
│                   └── ditto
│                       └── flutter
│                           ├── Bindings.kt
│                           └── DittoPlugin.kt
├── apple
├── build.yaml
├── CHANGELOG.md
├── extension
│   └── devtools
│       └── config.yaml
├── ffigen.yaml
├── ios
│   └── ditto_live.podspec
├── lib
│   ├── assets
│   │   ├── ditto.wasm
│   │   ├── ditto.wasm.js
│   │   └── ditto.wasm.snippets
│   │       ├── napi-dispatcher-wasm-2f83e9bddb5a9c18
│   │       │   ├── inline0.js
│   │       │   ├── inline1.js
│   │       │   └── inline2.js
│   │       └── safer-ffi-a11ec19b6b02a0db
│   │           ├── inline0.js
│   │           ├── inline1.js
│   │           ├── inline2.js
│   │           ├── inline3.js
│   │           ├── inline4.js
│   │           ├── inline5.js
│   │           └── inline6.js
│   ├── ditto_live.dart
│   └── src
│       ├── analysis
│       │   └── annotations.dart
│       ├── attachment_fetcher.dart
│       ├── attachment.dart
│       ├── auth.dart
│       ├── core
│       │   ├── core.dart
│       │   ├── cross_platform
│       │   │   ├── constants.dart
│       │   │   └── types.dart
│       │   ├── native
│       │   │   ├── auth.dart
│       │   │   ├── differ.dart
│       │   │   ├── ffi
│       │   │   │   ├── bindings.dart
│       │   │   │   ├── box.dart
│       │   │   │   ├── bytes.dart
│       │   │   │   ├── cbor.dart
│       │   │   │   ├── error.dart
│       │   │   │   ├── func.dart
│       │   │   │   ├── generated_bindings.dart
│       │   │   │   ├── manually_free.dart
│       │   │   │   ├── non_null.dart
│       │   │   │   ├── ptr.dart
│       │   │   │   └── strings.dart
│       │   │   ├── identity.dart
│       │   │   ├── logger.dart
│       │   │   ├── native.dart
│       │   │   ├── presence.dart
│       │   │   ├── small_peer_info.dart
│       │   │   ├── store.dart
│       │   │   ├── sync.dart
│       │   │   ├── types.dart
│       │   │   └── util.dart
│       │   ├── README.md
│       │   ├── stub.dart
│       │   └── wasm
│       │       ├── auth.dart
│       │       ├── differ.dart
│       │       ├── ditto_core.dart
│       │       ├── identity.dart
│       │       ├── init.dart
│       │       ├── inner
│       │       │   └── js_pointer.dart
│       │       ├── js_extension_type_lint_check.dart
│       │       ├── logger.dart
│       │       ├── presence.dart
│       │       ├── small_peer_info.dart
│       │       ├── store.dart
│       │       ├── sync.dart
│       │       ├── types.dart
│       │       ├── util.dart
│       │       └── wasm.dart
│       ├── devtools_extension_helpers.dart
│       ├── differ.dart
│       ├── ditto.dart
│       ├── error.dart
│       ├── exception.dart
│       ├── globals.dart
│       ├── identity.dart
│       ├── logger.dart
│       ├── login_provider.dart
│       ├── persistence_directory.dart
│       ├── presence
│       │   └── presence.dart
│       ├── shared
│       │   ├── attachment_metadata.dart
│       │   ├── attachment_token.dart
│       │   ├── attachment_token.g.dart
│       │   ├── document_id.dart
│       │   ├── presence.dart
│       │   ├── presence.g.dart
│       │   ├── site_id.dart
│       │   └── util.dart
│       ├── small_peer_info.dart
│       ├── store
│       │   ├── execute.dart
│       │   ├── store.dart
│       │   └── transaction.dart
│       ├── supported_platform.dart
│       ├── sync_controller.dart
│       ├── sync.dart
│       ├── transport
│       │   ├── transport_config.dart
│       │   └── transport_config.g.dart
│       └── transports.dart
├── LICENSE
├── linux
│   └── CMakeLists.txt
├── macos
│   └── ditto_live.podspec
├── pubspec.yaml
├── README.md
└── windows
    └── CMakeLists.txt
```

-> % unzip '/Users/hbanken/Downloads/Personal/ditto-4.14.2.jar'
Archive: /Users/hbanken/Downloads/Personal/ditto-4.14.2.jar
inflating: R.txt  
 inflating: AndroidManifest.xml  
 inflating: classes.jar  
 inflating: proguard.txt  
 inflating: lint.jar  
 creating: assets
inflating: assets/DEPENDENCY_LICENSES.zip  
 inflating: META-INF/com/android/build/gradle/aar-metadata.properties  
 creating: jni
creating: jni/arm64-v8a
inflating: jni/arm64-v8a/libdittoffi.so  
 creating: jni/armeabi-v7a
inflating: jni/armeabi-v7a/libdittoffi.so  
 creating: jni/x86
inflating: jni/x86/libdittoffi.so  
 creating: jni/x86_64
inflating: jni/x86_64/libdittoffi.so

https://github.com/getditto/DittoSwiftPackage/blob/main/Package.swift
https://software.ditto.live/cocoa/DittoSwift/4.14.2/dist/DittoSwift.xcframework.zip

DittoSwift.xcframework/
DittoSwift.xcframework/LICENSE.md
DittoSwift.xcframework/tvos-arm64/
DittoSwift.xcframework/tvos-arm64/dSYMs/
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/DittoSwift.yml
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/DittoSwift
DittoSwift.xcframework/tvos-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Info.plist
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/DittoSwift
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Headers/
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Headers/DittoSwift.h
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Headers/DittoSwift-Swift.h
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Modules/
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-tvos.abi.json
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-tvos.private.swiftinterface
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-tvos.swiftinterface
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/Project/
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-tvos.swiftdoc
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Modules/module.modulemap
DittoSwift.xcframework/tvos-arm64/DittoSwift.framework/Info.plist
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/DittoSwift.yml
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/x86_64/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/x86_64/DittoSwift.yml
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/DittoSwift
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Info.plist
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/\_CodeSignature/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/DittoSwift
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Headers/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Headers/DittoSwift.h
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Headers/DittoSwift-Swift.h
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/x86_64-apple-tvos-simulator.swiftinterface
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-tvos-simulator.swiftdoc
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/x86_64-apple-tvos-simulator.swiftdoc
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/Project/
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-tvos-simulator.abi.json
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-tvos-simulator.private.swiftinterface
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-tvos-simulator.swiftinterface
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/x86_64-apple-tvos-simulator.abi.json
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/x86_64-apple-tvos-simulator.private.swiftinterface
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Modules/module.modulemap
DittoSwift.xcframework/tvos-arm64_x86_64-simulator/DittoSwift.framework/Info.plist
DittoSwift.xcframework/macos-arm64_x86_64/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/DittoSwift.yml
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/x86_64/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/x86_64/DittoSwift.yml
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/DittoSwift
DittoSwift.xcframework/macos-arm64_x86_64/dSYMs/DittoSwift.framework.dSYM/Contents/Info.plist
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/DittoSwift
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Resources
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/\_CodeSignature/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/DittoSwift
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Resources/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Resources/Info.plist
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Headers/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Headers/DittoSwift.h
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Headers/DittoSwift-Swift.h
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/x86_64-apple-macos.private.swiftinterface
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/arm64-apple-macos.swiftinterface
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/arm64-apple-macos.swiftdoc
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/x86_64-apple-macos.swiftdoc
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/Project/
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/arm64-apple-macos.abi.json
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/x86_64-apple-macos.abi.json
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/x86_64-apple-macos.swiftinterface
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/arm64-apple-macos.private.swiftinterface
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/A/Modules/module.modulemap
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Versions/Current
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Headers
DittoSwift.xcframework/macos-arm64_x86_64/DittoSwift.framework/Modules
DittoSwift.xcframework/ios-arm64_x86_64-simulator/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/DittoSwift.yml
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/x86_64/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/x86_64/DittoSwift.yml
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/DittoSwift
DittoSwift.xcframework/ios-arm64_x86_64-simulator/dSYMs/DittoSwift.framework.dSYM/Contents/Info.plist
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/\_CodeSignature/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/DittoSwift
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Headers/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Headers/DittoSwift.h
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Headers/DittoSwift-Swift.h
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/x86_64-apple-ios-simulator.swiftinterface
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-ios-simulator.abi.json
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-ios-simulator.private.swiftinterface
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/x86_64-apple-ios-simulator.swiftdoc
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/Project/
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-ios-simulator.swiftinterface
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/x86_64-apple-ios-simulator.private.swiftinterface
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-ios-simulator.swiftdoc
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/DittoSwift.swiftmodule/x86_64-apple-ios-simulator.abi.json
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Modules/module.modulemap
DittoSwift.xcframework/ios-arm64_x86_64-simulator/DittoSwift.framework/Info.plist
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/DittoSwift.yml
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/x86_64/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/x86_64/DittoSwift.yml
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/DittoSwift
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs/DittoSwift.framework.dSYM/Contents/Info.plist
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/DittoSwift
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Resources
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/DittoSwift
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Resources/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Resources/Info.plist
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Headers/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Headers/DittoSwift.h
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Headers/DittoSwift-Swift.h
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/x86_64-apple-ios-macabi.private.swiftinterface
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/x86_64-apple-ios-macabi.abi.json
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/arm64-apple-ios-macabi.swiftdoc
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/Project/
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/x86_64-apple-ios-macabi.swiftinterface
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/arm64-apple-ios-macabi.private.swiftinterface
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/x86_64-apple-ios-macabi.swiftdoc
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/arm64-apple-ios-macabi.abi.json
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/DittoSwift.swiftmodule/arm64-apple-ios-macabi.swiftinterface
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/A/Modules/module.modulemap
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Versions/Current
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Headers
DittoSwift.xcframework/ios-arm64_x86_64-maccatalyst/DittoSwift.framework/Modules
DittoSwift.xcframework/ios-arm64/
DittoSwift.xcframework/ios-arm64/dSYMs/
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/Relocations/aarch64/DittoSwift.yml
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Resources/DWARF/DittoSwift
DittoSwift.xcframework/ios-arm64/dSYMs/DittoSwift.framework.dSYM/Contents/Info.plist
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/DittoSwift
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Headers/
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Headers/DittoSwift.h
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Headers/DittoSwift-Swift.h
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Modules/
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-ios.swiftinterface
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-ios.swiftdoc
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/Project/
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-ios.abi.json
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Modules/DittoSwift.swiftmodule/arm64-apple-ios.private.swiftinterface
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Modules/module.modulemap
DittoSwift.xcframework/ios-arm64/DittoSwift.framework/Info.plist
DittoSwift.xcframework/Info.plist

## CDN File structure

https://software.ditto.live/cocoa/DittoSwift/4.14.2/api-reference/
https://software.ditto.live/android/Ditto/4.14.2/api-reference/ditto/live.ditto.android/index.html
https://software.ditto.live/rust/Ditto/4.13.3/aarch64-apple-ios/release/libdittoffi.a
