import { Router } from 'express';
import { getCurrentUser } from '../../core/currentUser';
import type { MatchingRepository } from '../data/matchingRepository';
import { findSimilarItems } from '../logic/findSimilarItems';

export function createMatchesRouter(matching: MatchingRepository): Router {
  const router = Router();

  router.get('/lost-reports/:code/matches', async (req, res) => {
    const report = await matching.findOwnLostReport(req.params.code, getCurrentUser(req).id);
    if (!report) {
      res.status(404).json({ error: 'Lost report not found' });
      return;
    }

    const similarItems = findSimilarItems(report, await matching.listPublishedItems());
    await matching.saveSuggestions(
      report.id,
      similarItems.map(({ item, similarity }) => ({ foundItemId: item.id, similarity })),
    );

    const matches = await matching.listMatches(report.id);
    res.json(matches.sort((a, b) => b.similarity - a.similarity));
  });

  return router;
}
