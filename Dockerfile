FROM node:8.12.0
WORKDIR /yeebot
ADD . /yeebot
ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN npm install
RUN npm i ffmpeg-binaries
CMD ["node", "bot.js"]