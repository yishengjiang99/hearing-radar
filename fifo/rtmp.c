#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <pthread.h>
#include <netinet/in.h>
#include <netdb.h>
#include <string.h>
#include "fifo.c"
void error(const char *msg)
{
    perror(msg);
    exit(0);
}
int read(int socket, uint8_t *buffer, int length);
int write(int socket, char *msg, int length);
int atoi(const char *str);

int fetch_connect(char *hostname, int portno)
{
    int sockfd;

    struct sockaddr_in serv_addr;
    struct hostent *server;

    char buffer[256];
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0)
        error("ERROR opening socket");
    server = gethostbyname(hostname);
    if (server == NULL)
    {
        fprintf(stderr, "ERROR, no such host\n");
        exit(0);
    }
    bzero((char *)&serv_addr, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    bcopy((char *)server->h_addr,
          (char *)&serv_addr.sin_addr.s_addr,
          server->h_length);
    serv_addr.sin_port = htons(portno);
    if (connect(sockfd, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0)
        error("ERROR connecting");
    return sockfd;
}
Fifo *fetch_url(int fd, char *url, Fifo *fifo)
{

    write(fd, url, sizeof(url));
    int askedToWait = 0;
    int *ln = (int *)malloc(sizeof(int));
    char *line;
    const char *high_water = "high_water";
    const char *clear_to_send = "CTS";
    while ((line = fgetln(fd, ln)) != "")
    {
        printf("%s\n", line);
    }
    while (1)
    {
        uint8_t *buffer = malloc(1024);
        int n = read(fd, buffer, 1024);
        if (n == EOF)
        {
            perror("done");
            break;
        }
        if (fifo_size(fifo) > 1024 * 10)
        {
            write(fd, high_water, sizeof(high_water));
            askedToWait = 1;
        }
        else if (fifo_size(fifo) < 1024 * 8)
        {
            write(fd, clear_to_send, sizeof(clear_to_send));
        }
    }
    return fifo;
}

int main(int argc, char *argv[])
{

    int fd = fetch_connect(argv[1], atoi(argv[2]));
    pthread_t *thread = malloc(sizeof(pthread_t));

    Fifo *fifo = fifo_malloc();
    fifo_init(fifo, 1024 << 4);
    char *str = "/synth/440/f32le-synth.wav";
    fetchURL(fd, str, fifo);
}
