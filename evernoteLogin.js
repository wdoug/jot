'use strict';

var Evernote = require('evernote').Evernote;

var config;
// If config.json isn't defined use environment variables
try {
    config = require('./config.json');
}
catch(err) {
    config = {
        'use_developer_token': process.env.USE_DEV_TOKEN || false,
        'token': process.env.EVERNOTE_DEV_TOKEN,
        'API_CONSUMER_KEY' : process.env.EVERNOTE_API_KEY,
        'API_CONSUMER_SECRET' : process.env.EVERNOTE_API_SECRET,
        'SANDBOX' : process.env.EVERNOTE_SANDBOX || true
    };
}

var port = process.env.PORT || 3000;
var siteUrl = process.env.URL || ('http://localhost:' + port);
var callbackUrl = siteUrl + '/oauth_callback';

// OAuth
exports.oauth = function (req, res) {
    var client = new Evernote.Client({
        consumerKey: config.API_CONSUMER_KEY,
        consumerSecret: config.API_CONSUMER_SECRET,
        sandbox: config.SANDBOX
    });

    client.getRequestToken(callbackUrl, function (error, oauthToken, oauthTokenSecret, results){
        if (error) {
            req.session.error = JSON.stringify(error);
            res.redirect('/');
        }
        else {
            // store the tokens in the session
            req.session.oauthToken = oauthToken;
            req.session.oauthTokenSecret = oauthTokenSecret;

            // redirect the user to authorize the token
            res.redirect(client.getAuthorizeUrl(oauthToken));
        }
    });

};

// OAuth callback
exports.oauth_callback = function (req, res) {
    var client = new Evernote.Client({
        consumerKey: config.API_CONSUMER_KEY,
        consumerSecret: config.API_CONSUMER_SECRET,
        sandbox: config.SANDBOX
    });

    client.getAccessToken(
        req.session.oauthToken,
        req.session.oauthTokenSecret,
        req.param('oauth_verifier'),
        function (error, oauthAccessToken, oauthAccessTokenSecret, results) {
            if (error) {
                console.log('error');
                console.log(error);
                res.redirect('/');
            } else {
                // store the access token in the session
                req.session.oauthAccessToken = oauthAccessToken;
                req.session.oauthAccessTtokenSecret = oauthAccessTokenSecret;
                req.session.edamShard = results.edam_shard;
                req.session.edamUserId = results.edam_userId;
                req.session.edamExpires = results.edam_expires;
                req.session.edamNoteStoreUrl = results.edam_noteStoreUrl;
                req.session.edamWebApiUrlPrefix = results.edam_webApiUrlPrefix;
                res.redirect('/');
            }
        });
};

// Clear session
exports.clear = function (req, res) {
    req.session.destroy();
    res.redirect('/');
};
