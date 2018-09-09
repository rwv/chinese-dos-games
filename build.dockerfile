FROM python:3.4-alpine3.7

MAINTAINER kuangcp 

RUN cd && wget https://codeload.github.com/rwv/chinese-dos-games/zip/master -O main.zip && unzip main.zip \
    && rm -f main.zip && cd chinese-dos-games-master \
	&& pip3 install flask \
# TODO can't run this ???
#	&& pwd && python3 download_data.py

EXPOSE 5000

CMD [ "python3", "/root/chinese-dos-games-master/app.py" ]




