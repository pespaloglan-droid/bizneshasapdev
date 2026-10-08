// src/utils.h
#pragma once
#include <cstddef>
#include <cstring>

#ifdef _WIN32
  #include <windows.h>
  inline void secure_zero(void* p, size_t n) { SecureZeroMemory(p, n); }
#elif defined(__APPLE__) || defined(__linux__) || defined(__ANDROID__)
  #include <string.h>
  inline void secure_zero(void* p, size_t n) {
    #if defined(__GLIBC__) && __GLIBC__ >= 2 && __GLIBC_MINOR__ >= 25
      explicit_bzero(p, n);
    #else
      volatile unsigned char* vp = (volatile unsigned char*)p;
      while (n--) *vp++ = 0;
    #endif
  }
#else
  inline void secure_zero(void* p, size_t n) {
    volatile unsigned char* vp = (volatile unsigned char*)p;
    while (n--) *vp++ = 0;
  }
#endif
