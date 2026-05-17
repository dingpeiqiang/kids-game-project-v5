> [!IMPORTANT]
> This project is no longer being maintained as of March 2026.

![](./public/space-invaders-hero.svg)

# Realtime multiplayer game of Space Invaders

This project runs a realtime multiplayer version of the classic retro game, Space Invaders.

![Preview of the game](https://user-images.githubusercontent.com/5900152/84092843-7ea1ce80-a9f0-11ea-809d-41cd20fb8e59.gif)

## Services/ libraries used in the game

- [Phaser 3](https://phaser.io)
- [p2 NPM library](https://www.npmjs.com/package/p2)
- [Ably Realtime](https://www.ably.com) 

You will require an Ably API Key, to run this demo, [sign-up for FREE account](https://ably.com/sign-up)

# How to run this game

## Development Mode (with auto-reload)

1. Create a free account with [Ably Realtime](https://www.ably.com) and obtain an API Key
1. Clone this repo locally
1. Navigate to the project folder and run `npm install` to install the dependencies
1. Rename `.env-sample` to `.env`, then edit the file and add your Ably API key and prefered PORT (default 8080).
1. Run the development server with `npm run dev` - this will automatically restart when code changes
1. Open a browser to [localhost:8080](http://localhost:8080)

## Production Mode

1. Follow steps 1-4 above
1. Run the server with `node server.js` or `npm start`
1. Open a browser to [localhost:8080](http://localhost:8080)

Read the full blog post series on [dev.to](https://dev.to/ably/building-a-realtime-multiplayer-browser-game-in-less-than-a-day-part-1-4-14pm).

Please [reach out to me on Twitter](https://www.twitter.com/Srushtika) for any questions, 
or follow us [@ablyrealtime](https://twitter.com/ablyrealtime)
