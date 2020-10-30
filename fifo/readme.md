``` #include <stdio.h>
#include <stdlib.h>
#include <string.h>
 #include <stdint.h>

// void	*memcpy(void *__dst, const void *__src, size_t __n);

typedef struct Fifo {
    uint8_t *buffer;
    uint8_t *rptr;
    uint8_t *wptr;
    uint8_t *end;
} Fifo;

void fifo_init(Fifo* f, unsigned int size){
    uint8_t* buffer = malloc(size*4);   
    f->buffer=buffer;
    f->rptr= buffer;
    f->wptr=buffer;
    f->end= buffer+size;
}

void fifo_read(Fifo* f, uint8_t* buf, int buff_size){
    if(f->wptr < f->rptr + buff_size){
        int len = f->wptr - f->rptr;
        memcpy(buf, f->rptr, len);
        f->rptr = f->wptr;
    }
    else if(f->end < f->rptr + buff_size){
        int len = f->end - f->rptr;
        memcpy(buf, f->rptr, len);
        buf += len;
        f->rptr = f->buffer;
        memcpy(buf, f->rptr, buff_size - len );
    }else{
        memcpy(buf,f->rptr,buff_size);
        f->rptr += buff_size;
    }
}


void fifo_write(Fifo* f, uint8_t*src, int buffer_size){
       
    if(f->end <  f->wptr + buffer_size){
        int len = f->end - f->wptr;
        memcpy(f->wptr,src,len);
        src += len;
        f->wptr = f->buffer; //looped around
        memcpy(f->wptr,src, buffer_size - len );
    }else{
        memcpy(f->wptr, src,buffer_size);
        f->wptr += buffer_size;
    } 
}

int fifo_size(Fifo* f){
    if(f->wptr >= f->rptr){
        return f->wptr - f->rptr;
    }else{
        return  f->end - f->buffer - (f->rptr-f->wptr);
    }
}


int _main(){
    printf("hello");
    Fifo* f = malloc(sizeof(Fifo));
    fifo_init(f, 1000);
    uint8_t buffer[] = { 5, 7, 3, 4, 9, 1, 3 };
    fifo_write(f, buffer,7);
    uint8_t* ob = malloc(7*4);
    fifo_read(f, ob, 7);
    for(int i=0; i<7; i++){
        printf("%4x", ob[i]);
    }
    return 0;


}

//_main();
```