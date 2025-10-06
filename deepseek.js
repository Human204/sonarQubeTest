router.post('/recommendations', authenticateToken, async (req, res) => {
    try {
        const { recommendation, query } = req.body;
        const userId = req.user.id;

        if (!recommendation || !query) {
            return res.status(400).json({ error: 'Recommendation and query are required' });
        }

        const newRecommendation = {
            id: generateId(),
            userId: userId,
            recommendation: recommendation,
            query: query,
            timestamp: new Date().toISOString()
        };

        recommendationsDB.push(newRecommendation);

        res.status(201).json({
            success: true,
            data: newRecommendation
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to save recommendation' });
    }
});