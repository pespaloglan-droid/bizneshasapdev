{
  "targets": [{
    "target_name": "license",
    "sources": [
      "src/license.cc",
      "src/fingerprint.cc",
      "src/state.cc",
      "src/codec.cc",
      "src/random.cc",
      "src/business.cc",
      "src/integrity.cc",
      "third_party/tweetnacl.c"
    ],
    "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
    "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
    "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS", "NAPI_VERSION=8"],
    "cflags_cc": ["-std=c++17", "-fvisibility=hidden", "-O2"],
    "xcode_settings": {
      "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
      "GCC_SYMBOLS_PRIVATE_EXTERN": "YES",
      "MACOSX_DEPLOYMENT_TARGET": "11.0",
      "OTHER_LDFLAGS": ["-framework IOKit", "-framework CoreFoundation"]
    },
    "msvs_settings": {
      "VCCLCompilerTool": { "AdditionalOptions": ["/std:c++17", "/O2", "/GS"] }
    },
    "conditions": [
      ["OS=='win'", {
        "libraries": ["bcrypt.lib", "advapi32.lib", "iphlpapi.lib", "crypt32.lib"]
      }],
      ["OS=='android'", {
        "cflags_cc": ["-std=c++17", "-fvisibility=hidden", "-O2", "-fPIC"],
        "defines": ["__ANDROID__"],
        "libraries": ["-llog"]
      }]
    ]
  }]
}
