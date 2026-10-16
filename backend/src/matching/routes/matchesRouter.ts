import { Router, type RequestHandler } from 'express';
import type { MatchStatus } from '@shared/statuses';
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

  /** The owner answers a match ("Pasaré a recoger" or "No es mío"). Only the owner of the report can. */
  const answerMatch =
    (status: MatchStatus, save: (matchId: string) => Promise<void>): RequestHandler =>
    async (req, res) => {
      const match = await matching.findOwnMatch(String(req.params.id), getCurrentUser(req).id);
      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      await save(match.id);
      res.json({ status });
    };

  router.post('/matches/:id/pick-up', answerMatch('WILL_PICK_UP', matching.markWillPickUp));
  router.post('/matches/:id/dismiss', answerMatch('DISMISSED', matching.dismiss));

  return router;
}
