FROM node:8.12.0
WORKDIR /yeebot
ADD . /yeebot
ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get install make gcc
RUN npm install
CMD ["node", "bot.js"]