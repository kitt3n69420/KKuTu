const config = require('../../sub/auth.json');
const OAuth2Strategy = require('passport-oauth2');

// osu!는 전용 passport 패키지가 없으므로 passport-oauth2로 osu! API v2에 맞춰 만든다.
class OsuStrategy extends OAuth2Strategy {
    constructor(options, verify) {
        super(Object.assign({
            authorizationURL: 'https://osu.ppy.sh/oauth/authorize',
            tokenURL: 'https://osu.ppy.sh/oauth/token',
            scope: 'identify'
        }, options), verify);
        this.name = 'osu';
        this._oauth2.useAuthorizationHeaderforGET(true);
    }

    userProfile(accessToken, done) {
        this._oauth2.get('https://osu.ppy.sh/api/v2/me', accessToken, (err, body) => {
            if (err) return done(err);
            try {
                done(null, JSON.parse(body));
            } catch (e) {
                done(e);
            }
        });
    }
}

module.exports.config = {
    strategy: OsuStrategy,
    color: '#FF66AA',
    fontColor: '#FFFFFF',
    vendor: 'osu',
    displayName: 'withOsu'
}

module.exports.strategyConfig = {
    clientID: config.osu.clientID,
    clientSecret: config.osu.clientSecret,
    callbackURL: config.osu.callbackURL,
    passReqToCallback: true
}

module.exports.strategy = (process, MainDB, Ajae) => {
    return (req, accessToken, refreshToken, profile, done) => {
        const $p = {};

        $p.authType = "osu";
        $p.id = $p.authType+"-"+profile.id;
        $p.name = profile.username;
        $p.title = profile.username;
        $p.image = profile.avatar_url;

        process(req, accessToken, MainDB, $p, done);
    }
}
