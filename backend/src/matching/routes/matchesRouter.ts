import { Router, type RequestHandler } from 'express';
import type { MatchView } from '@shared/matching';
import type { MatchStatus } from '@shared/statuses';
import { getCurrentUser, type CurrentUser } from '../../core/currentUser';
import type { LostReportToMatch, MatchingRepository } from '../data/matchingRepository';
import { findSimilarItems } from '../logic/findSimilarItems';

export function createMatchesRouter(matching: MatchingRepository): Router {
  const router = Router();

  /** Bienestar can see any active report; everyone else, only their own. */
  function findVisibleReport(user: CurrentUser, code: string): Promise<LostReportToMatch | null> {
    return user.role === 'WELFARE'
      ? matching.findLostReportByCode(code)
      : matching.findOwnLostReport(code, user.id);
  }

  /** Saves every published item that looks like the report as a possible match. */
  async function suggestSimilarItems(report: LostReportToMatch): Promise<void> {
    const similarItems = findSimilarItems(report, await matching.listPublishedItems());
    await matching.saveSuggestions(
      report.id,
      similarItems.map(({ item, similarity }) => ({ foundItemId: item.id, similarity })),
    );
  }

  async function listMostSimilarFirst(report: LostReportToMatch): Promise<MatchView[]> {
    const matches = await matching.listMatches(report.id);
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  router.get('/lost-reports/:code/matches', async (req, res) => {
    const report = await findVisibleReport(getCurrentUser(req), req.params.code);
    if (!report) {
      res.status(404).json({ error: 'Lost report not found' });
      return;
    }

    await suggestSimilarItems(report);
    res.json(await listMostSimilarFirst(report));
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
