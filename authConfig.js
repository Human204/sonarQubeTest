const passport = require("passport");
const bcrypt = require("bcryptjs");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { Strategy: FacebookStrategy } = require("passport-facebook");
const { Pool } = require("pg");

require("dotenv").config();

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASEURL,
});

// Helper to find or create a user
async function findOrCreateUser(provider, providerId, profile) {
    const res = await pool.query(
        "SELECT * FROM users WHERE provider = $1 AND provider_id = $2",
        [provider, providerId]
    );

    if (res.rows.length > 0) {
        return res.rows[0];
    }

    const newUser = await pool.query(
        "INSERT INTO users (username, email, provider, provider_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [profile.displayName, profile.emails[0].value, provider, providerId]
    );

    return newUser.rows[0];
}

// Local strategy
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const res = await pool.query(
                "SELECT * FROM users WHERE username = $1 AND provider = $2",
                [username, "local"]
            );
            const user = res.rows[0];

            if (!user)
                return done(null, false, {
                    message: "Incorrect username or password",
                });

            const isMatch = await bcrypt.compare(password, user.password);
            return isMatch
                ? done(null, user)
                : done(null, false, {
                      message: "Incorrect username or password",
                  });
        } catch (error) {
            return done(error);
        }
    })
);

// Google strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await findOrCreateUser(
                    "google",
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

const registerUser = async (username, email, password) => {
    if (!username || !email || !password) {
        throw new Error("All fields are required");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query =
        "INSERT INTO users (username, email, password, provider) VALUES ($1, $2, $3, $4)";
    const values = [username, email, hashedPassword, "local"];

    return new Promise(async (resolve, reject) => {
        pool.query(query, values, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
};

// Facebook strategy
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

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        done(null, res.rows[0]);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;
module.exports.registerUser = registerUser;
