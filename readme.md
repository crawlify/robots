# Crawlify/Robots

## A robots.txt parser for node.js

This package comes with two options for parsing robots.txt files, either fetch - which retrieves the file from the URL provided and parses the response, or parse - which simply parses the textual response provided.

```js
let RobotFetch = require('robot');
RobotFetch.fetch('https://reckless.agency/robots.txt', function() {
  console.log(RobotFetch.rulesets);
  console.log(RobotFetch.sitemaps);
});

let RobotParse = require('robot');
RobotParse.parse(someRobotsContent, function() {
    console.log(RobotParse.rulesets);
    console.log(RobotParse.sitemaps);
});
```

If any lines of the robots.txt cannot be understood by the parser, they will be returned in `Robot.unknown`.

More features will be added as we move forward.