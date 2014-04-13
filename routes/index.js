
exports.index = function(req, res){
    if (req.session.oauthToken) {
        console.log(req.session.oauthToken);
        
        res.render('index', { title: 'Jot' });
    }
    else {
        res.redirect('/welcome');
    }
};

exports.welcome = function (req, res) {
    res.render('welcome', { title: 'Jot' });
};