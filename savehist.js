app.post("/api/save-history", ensureAuthenticated, async (req, res) => {
  try {
    const result = await saveHistory(req.user.id, req.body.prompt, req.body.response);
    res.json(result);
  } catch (error) {
    if (error.type === "InvalidInput") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error saving history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});