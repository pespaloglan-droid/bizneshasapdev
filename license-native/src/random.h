// src/random.h - Platform-specific CSPRNG declaration
#ifndef RANDOM_H
#define RANDOM_H

#ifdef __cplusplus
extern "C" {
#endif

void randombytes(unsigned char* x, unsigned long long xlen);

#ifdef __cplusplus
}
#endif

#endif // RANDOM_H
