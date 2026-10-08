// src/random.cc - Platform-specific CSPRNG for tweetnacl
#ifdef _WIN32
#include <windows.h>
#include <bcrypt.h>
#elif defined(__ANDROID__)
#include <sys/random.h>
#else
#include <unistd.h>
#include <sys/random.h>
#endif

extern "C" {

#ifdef _WIN32
void randombytes(unsigned char* x, unsigned long long xlen) {
  BCryptGenRandom(nullptr, x, (ULONG)xlen, BCRYPT_USE_SYSTEM_PREFERRED_RNG);
}
#elif defined(__ANDROID__)
void randombytes(unsigned char* x, unsigned long long xlen) {
  size_t done = 0;
  while (done < (size_t)xlen) {
    ssize_t n = getrandom(x + done, (size_t)xlen - done, 0);
    if (n <= 0) continue; // EINTR tekrar dene
    done += (size_t)n;
  }
}
#else
void randombytes(unsigned char* x, unsigned long long xlen) {
  size_t done = 0;
  while (done < (size_t)xlen) {
    size_t n = xlen - done > 256 ? 256 : xlen - done;
    getentropy(x + done, n);
    done += n;
  }
}
#endif

} // extern "C"
