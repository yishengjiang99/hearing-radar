#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <string.h>
void error(char *msg)
{
    perror(msg);
    exit(0);
}
int read(int socket, uint8_t *buffer, int length);
int write(int socket, char *msg, int length);
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
    int errno = connect(sockfd, (struct sockaddr *)&serv_addr, sizeof(serv_addr));
    if (connect(sockfd, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0)
        error("ERROR connecting");
    return sockfd;
}
int fetchURL(int fd, char *url, Fifo *fifo)
{
    write(fd, url, sizeof(url));
    int askedToWait = 0;
    int *ln = malloc(sizeof(int));
    char *line;
    const char *wait = "wait";
    const char *clear_to_send = "CTS";
    while (line = fgetln(fd, ln) != "")
    {
        printf("%s\n", line);
    }
    while (1)
    {
        uint8_t *buffer = fifo_prelloc(fifo, 1024);
        int n = read(fd, buffer, 1024);
        if (n == EOF)
        {
            perror("done");
            break;
        }
        commit_prelloc(fifo);
        if (fifo_size(fifo) > 1024 * 10)
        {
            write(fd, "wait", sizeof("wait"));
            askedToWait = 1;
        }
        else if (fifo_size(fifo) < 1024 * 8)
        {
            write(fd, 'CTS', 3);
        }
        sleep(1);
    }
}

int main(int argc, char *argv[])
{
}