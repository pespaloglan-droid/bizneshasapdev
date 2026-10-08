# Android NDK build configuration for nodejs-mobile
# Bu dosya nodejs-mobile tarafından otomatik kullanılır

cmake_minimum_required(VERSION 3.10)
project(license-native)

# C++17 standardı
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Android specific flags
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fvisibility=hidden -fPIC -O2 -DNDEBUG")
add_definitions(-D__ANDROID__)

# Node.js headers (nodejs-mobile tarafından sağlanır)
include_directories(
  ${NODE_ADDON_API_DIR}
  ${CMAKE_SOURCE_DIR}/src
  ${CMAKE_SOURCE_DIR}/third_party
)

# Kaynak dosyaları
set(SOURCE_FILES
  src/license.cc
  src/fingerprint.cc
  src/state.cc
  src/codec.cc
  src/random.cc
  src/business.cc
  src/integrity.cc
  third_party/tweetnacl.c
)

# Shared library (.so)
add_library(license SHARED ${SOURCE_FILES})

# Android system libraries
target_link_libraries(license
  log           # __android_log_print için
  android       # Android NDK
)

# N-API version
target_compile_definitions(license PRIVATE
  NAPI_VERSION=8
  NAPI_DISABLE_CPP_EXCEPTIONS
)

# Strip debug symbols in release
if(CMAKE_BUILD_TYPE STREQUAL "Release")
  add_custom_command(TARGET license POST_BUILD
    COMMAND ${CMAKE_STRIP} --strip-unneeded $<TARGET_FILE:license>
    COMMENT "Stripping debug symbols from license.so"
  )
endif()

# Output directory
set_target_properties(license PROPERTIES
  LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/lib/${ANDROID_ABI}"
)

# ABI-specific optimizations
if(ANDROID_ABI STREQUAL "arm64-v8a")
  target_compile_options(license PRIVATE -march=armv8-a)
elseif(ANDROID_ABI STREQUAL "armeabi-v7a")
  target_compile_options(license PRIVATE -march=armv7-a -mfpu=neon)
elseif(ANDROID_ABI STREQUAL "x86_64")
  target_compile_options(license PRIVATE -march=x86-64 -mtune=generic)
endif()

# Güvenlik flags
target_compile_options(license PRIVATE
  -fstack-protector-strong
  -Wformat
  -Wformat-security
)

target_link_options(license PRIVATE
  -Wl,-z,relro
  -Wl,-z,now
)

message(STATUS "License native module configured for Android ${ANDROID_ABI}")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ standard: ${CMAKE_CXX_STANDARD}")
