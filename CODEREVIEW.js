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

app.get("/api/history", ensureAuthenticated, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { rows } = await pool.query(
            "SELECT id, prompt, response, rating, created_at FROM generation_history WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/user/preferences", ensureAuthenticated, async (req, res) => {
    const { preferences } = req.body;
    console.log(preferences);
    console.log(typeof preferences);
    if (!preferences || typeof preferences !== "object") {
        return res.status(400).json({ message: "Invalid preferences format" });
    }

    try {
        await pool.query(
            "UPDATE users SET preferences = preferences || $1 WHERE id = $2",
            [JSON.stringify(preferences), req.user.id]
        );
        res.json({ message: "Preferences updated successfully" });
        console.log(preferences);
    } catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});