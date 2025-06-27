# kazagumo-apple
A plugin that allows you to play music on apple

Install
```
npm i kazagumo-apple
```

Support source:
```
- https://music.apple.com/us/artist/the-weeknd/479756766
- https://music.apple.com/us/album/out-of-time/1603171516?i=1603171870
- https://music.apple.com/us/album/dawn-fm/1603171516
- https://music.apple.com/us/playlist/r-b-now/pl.b7ae3e0a28e84c5c96c4284b6a6c70af
```
How to
```js
const { Kazagumo } = require('kazagumo');
const Apple = require('kazagumo-apple');

const kazagumo = new Kazagumo(
  {
    plugins: [
      new Apple({
        countryCode: "us", // Default is "us"
        imageWidth: 600, // Default is 600
        imageHeight: 900 // Default is 900
      }),
    ],
  },
  new Connectors.DiscordJS(client),
  Nodes,
);

kazagumo.search(`https://music.apple.com/us/artist/the-weeknd/479756766`); // track, album, playlist
kazagumo.search('mirror heart', { engine: 'apple' }); // search track using apple
```