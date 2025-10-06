passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: "/auth/facebook/callback",
            profileFields: ["id", "displayName", "emails"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await findOrCreateUser(
                    "facebook",
                    profile.id,
                    profile
                );
                done(null, user);
            } catch (error) {
                done(error);
            }
        }
    )
);