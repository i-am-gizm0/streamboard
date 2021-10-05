# Streamboard

This is a scoreboard overlay built for livestreaming sports.  
Built with Bootstrap for controller UI, Svelte for all UI, Typescript, and WebSockets.

## Installation
Clone the repository and navigate the terminal to the directory
```
git clone https://github.com/i-am-gizm0/streamboard
cd streamboard
```

Make sure you have [Node and NPM installed](https://nodejs.org/en/download/), then you can install the dependencies
```
npm install
```

## Usage

~~You can start the server by running~~
```
npm run serve
```
> **NOTE:** As of writing, the server does not serve the UI itself. See [#7](https://github.com/i-am-gizm0/streamboard/issues/7).

Once the server is running, you can visit [`http://localhost:5000/controller`](http://localhost:5000/controller) in your browser to open the controller and [`http://localhost:5000/board`](http://localhost:5000/board) to open the scoreboard.
