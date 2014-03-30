jot (working title)
===

## Setup for personal account only

Need 
* [Node.js](http://nodejs.org/)
* Account on https://sandbox.evernote.com/
* A developer token from this account: https://sandbox.evernote.com/api/DeveloperToken.action

1. Copy 'config.json.example' and rename to 'config.json'.
2. Add sandbox developer token to config.json.
3. Set 'use_developer_token' to `true`.

Run:
```
npm install

node app.js
```


## Setup for Evernote API authentication

Need 
* [Node.js](http://nodejs.org/)
* Account on https://sandbox.evernote.com/
* [Evernote API Key](http://dev.evernote.com/doc/) with access level set to full 

1. Copy 'config.json.example' and rename to 'config.json'.
2. Change config.json "cookie secret" to another string.
3. Add API_CONSUMER_KEY and API_CONSUMER_SECRET to config.json.

Run:
```
npm install

node app.js
```