#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <pthread.h>
#include <stdio.h>
#include <assert.h>
#define max(x, y) (((x) > (y)) ? (x) : (y))
#define min(x, y) (((x) < (y)) ? (x) : (y))
// void	*memcpy(void *__dst, const void *__src, size_t __n);
#define block_size 2 << 11
#define AU_size 512

pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
typedef struct Fifo
{
    uint8_t *buffer;
    uint8_t *rptr;
    uint8_t *wptr;
    uint8_t *end;
    uint8_t *reserved;
} Fifo;

void fifo_init(Fifo *f, unsigned int byteLength)
{
    uint8_t *buffer = malloc(byteLength);
    f->buffer = buffer;
    f->rptr = buffer;
    f->wptr = buffer;
    f->end = buffer + byteLength;
}
Fifo *fifo_malloc()
{
    Fifo *f = (Fifo *)malloc(sizeof(Fifo));
    return f;
}

void fifo_read(Fifo *f, uint8_t *buf, int len)
{
    int p1 = min(len, f->end - f->rptr);
    memcpy(buf, f->rptr, p1);
    f->rptr += p1;

    len -= p1;
    int p2 = min(len, f->wptr - f->buffer);
    if (p2)
    {
        buf += p1;
        f->rptr = f->buffer;
        memcpy(buf, f->rptr, len);
        f->rptr += len;
    }
}
void fifo_write(Fifo *f, uint8_t *buf, int len)
{
    int p1 = min(len, f->end - f->wptr);
    memcpy(f->wptr, buf, p1);
    f->wptr += p1;
    len -= p1;
    if (len)
    {
        buf += p1;
        f->wptr = f->buffer;
        memcpy(f->wptr, buf, len);
        f->rptr += len;
    }
}

uint8_t *fifo_prelloc(Fifo *f, int len)
{
    uint8_t *p = f->wptr;
    f->reserved = f->wptr + len;
    return p;
}
void commit_prelloc(Fifo *f)
{
    f->wptr = f->reserved;
    if (f->wptr == f->end)
    {
        f->wptr = f->buffer;
    }
    pthread_mutex_unlock(&mutex);
}

int fifo_size(Fifo *f)
{
    if (f->wptr >= f->rptr)
    {
        return f->wptr - f->rptr;
    }
    else
    {
        return f->end - f->buffer - (f->rptr - f->wptr);
    }
}
void printStr(uint8_t *ptr, int len)
{
    for (int i = 0; i < len; i++)
    {
        printf("%02x", ptr[i]);
    }
    printf("\n");
}

int test(int argc, char **args)
{
    FILE *fd = fopen(args[0], "r");
    fseek(fd, 0, SEEK_SET);
    Fifo *f = malloc(sizeof(Fifo));
    fifo_init(f, block_size);
    int offset = 0;
    uint8_t *p;
    uint8_t *output = malloc(1024);
    int total = 0;
    while (1)
    {
        fseek(fd, offset, SEEK_CUR);
        p = fifo_prelloc(f, 1024);
        printf("avail %d %ld\n", fifo_size(f), f->wptr - f->buffer);

        if (EOF == fread(p, 1024, 1, fd))
            break;
        commit_prelloc(f);
        printf("avail %d %ld\n", fifo_size(f), f->wptr - f->buffer);

        assert(fifo_size(f) == 1024);
        fifo_read(f, output, 1024);
        printf("avail %d %ld\n", fifo_size(f), f->wptr - f->buffer);

        printStr(output, 1024);
        total += 1024;
        printf("avail %d %d \t total %d\n", fifo_size(f), *(f->wptr), total);
    }
    return 0;
}
