FROM node:8.12.0
WORKDIR /yeebot
COPY . /yeebot
COPY /home/bot-runner/yeebot/development/env/auth.json /yeebot/auth.json
ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN npm install
CMD ["node", "bot.js"]