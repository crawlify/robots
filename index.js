'use strict';

const request = require('request');

class Robot {
  constructor() {
    this.sitemaps = [];
    this.rulesets = [];
    this.unknown = [];
  }
  
  /**
   * Parse raw robots.txt.
   * @param {string} input The raw text robots.txt to parse.
   * @param {function} cb Callback.. 
   * @returns {void} 
   */
  parse (input, cb) {
    this._parser(input, cb);
  }

  /**
   * Retrieve robots.txt from a url and return the parsed (and optionally raw) output.
   * @param {string} url The URL to retrieve the robots.txt from.
   * @param {function} cb Callback.
   * @returns {void}
   */
  fetch (url, cb) {
    var self = this;
    request(url, function (e, r, b) {
      if (!e) {
        self.parse(b, cb);
        require('fs').writeFileSync('error.json', JSON.stringify(b));
      } else {
        throw e;
      }
    });
  }

  /**
   * The actual parsing starts here!
   * @param {*} input Raw Textual Input
   * @returns {object} Parsed Response 
   */
  _parser (input, cb) {
    var inputLine = input.split('\n');
    var cleanInput = [];
    var rows = 0;
    for (let x in inputLine) {
      let line = inputLine[x].trim();
      if (line !== '' && line[0] !== '#') {
        cleanInput[x] = line;
      }

      rows++;
      if (rows >= inputLine.length) {
        this._parseLines(cleanInput.filter(function (val) {
          return val;
        }), cb);
      }
    }
  }

  /**
   * Parse the cleaned up lines.
   * @param {string[]} lines The lines to parse.
   * @param {function} cb The callback.
   */
  _parseLines (lines, cb) {
    let count = 0;
    let rows = lines.length;
    for (let x in lines) {
      let start = lines[x].split(':')[0];
      let value = lines[x].split(':');
      value.shift();
      if (start !== "") {
        start = this._lineStarters(start);
        switch (start) {
          case 'sitemap':
            this.sitemaps.push(value.join(''));
            delete lines[x];
            break;
          case 'unknown':
            this.unknown.push(value.join(''));
            delete lines[x];
            break;
        }
        
        count++;
        if (count >= rows) {

          /**
           * This breaks the result down into a smaller set of rulesets using the user-agent lines.
           */
          let rulesets = lines.join('\n').split(/[Uu]ser-[aA]gent( ?):( ?)/);

          this._parseRulesets(rulesets.map(function(value) {
            /**
             * Map rulesets to an object of {title: string, rules: string[]}
             */
            let newValue = value.trim().split('\n');
            if (newValue[0] == '') {
              return null;
            }
            let parsed = {};
            parsed.title = newValue[0];
            newValue.shift();
            parsed.rules = newValue;
            return parsed;
            /**
             * Filter null results.
             */
          }).filter(function(val) {
            return val;
          }), cb);
        }
      }
    }
  }

  /**
   * Type of line...
   * @param {string} starter The start of the line that you'd like to understand.
   * @returns {string} The nice, machine usable descriptor of the line.
   */
  _lineStarters (starter) {
    switch (starter.toLowerCase()) {
      case 'user-agent':
        return 'ruleset';
      case 'allow':
      case 'disallow':
        return 'access';
      case 'crawl-delay':
        return 'delay';
      case 'sitemap':
        return 'sitemap';
      default:
        return 'unknown';
    }
  }

  /**
   * Further parse the individual rulesets to a friendly, usable set of rules.
   * @param {string[]} lines The lines to parse.
   * @param {function} cb Callback.
   */
  _parseRulesets (lines, cb) {
    var result = {};
    
    let sets = 0;
    for (let x in lines) {
      result[lines[x].title] = { allow: [], disallow: [] };
      let count = 0;
      for (let i in lines[x].rules) {
        let rule = lines[x].rules[i];
        if (rule.match(/^[Aa]llow:( ?)/)) {
          result[lines[x].title].allow.push((rule.split(/^[Aa]llow:( ?)/)[2]).trim());
        }
        if (rule.match(/^[Dd]isallow:( ?)/)) {
          result[lines[x].title].disallow.push((rule.split(/^[Dd]isallow:( ?)/)[2]).trim());
        }
        if (rule.match(/^[Cc]rawl-[Dd]elay:( ?)/)) {
          result[lines[x].title].delay = rule.split(/^[Cc]rawl-[Dd]elay:( ?)/)[2].trim();
        }
        count ++;
        if (count >= lines[x].rules.length) {
          sets ++;
          if (sets >= lines.length) {
            this.rulesets = result;
            cb();
          }
        }
      }  
    }
  }
}

/**
 * Export Modules 
 * Return an instance of the Robot class instead of the class itself.
 */
module.exports = new Robot();