FROM node:12.20.1
WORKDIR /usr/src/app
ARG TIMEZONE="Asia/Bangkok"
RUN ln -snf /usr/share/zoneinfo/$TIMEZONE /etc/localtime && echo $TIMEZONE > /etc/timezone
RUN mkdir -p /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
COPY .env.example .env

CMD [ "node","index.js" ]
