FROM python:3-alpine3.7
LABEL maintainer="lyndon <snakeliwei@gmail.com>"
ENV WORKERS=2
RUN apk add --no-cache --update 'su-exec>=0.2' tzdata && \
    mkdir -p /app && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    pip install gunicorn flask

COPY . /app
WORKDIR /app

RUN cd /app && python3 download_data.py

EXPOSE 8000
CMD ["gunicorn -w $WORKERS -b 0.0.0.0:8000 app:app "]




