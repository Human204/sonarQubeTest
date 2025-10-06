app.post("/api/save-history", ensureAuthenticated, async (req, res) => {
    console.log("Saving history:", req.body);
    const { prompt, response } = req.body;

    if (!prompt || !response) {
        return res
            .status(400)
            .json({ message: "Prompt and response are required" });
    }

    try {
        const { id: userId } = req.user;
        await pool.query(
            "INSERT INTO generation_history (user_id, prompt, response) VALUES ($1, $2, $3)",
            [userId, prompt, response]
        );
        res.json({ message: "History saved successfully" });
    } catch (error) {
        console.error("Error saving history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});