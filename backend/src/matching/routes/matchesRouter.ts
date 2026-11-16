import { Router, type RequestHandler } from 'express';
import type { MatchView } from '@shared/matching';
import type { MatchStatus } from '@shared/statuses';
import { getCurrentUser, type CurrentUser } from '../../core/currentUser';
import type { LostReportToMatch, MatchingRepository } from '../data/matchingRepository';
import { findSimilarItems } from '../logic/findSimilarItems';
import { calculateSimilarityScore } from '../logic/similarity';
import type { SettingsRepository } from '../../core/data/settingsRepository';

export function createMatchesRouter(
  matching: MatchingRepository,
  settings: SettingsRepository,
): Router {
  const router = Router();

  /** Bienestar can see any active report; everyone else, only their own. */
  function findVisibleReport(user: CurrentUser, code: string): Promise<LostReportToMatch | null> {
    return user.role === 'WELFARE'
      ? matching.findLostReportByCode(code)
      : matching.findOwnLostReport(code, user.id);
  }

  /** Saves every published item that looks like the report enough as a possible match. */
  async function suggestSimilarItems(report: LostReportToMatch): Promise<void> {
    const { minSimilarity } = await settings.getMatchSettings();
    const publishedItems = await matching.listPublishedItems();
    const similarItems = findSimilarItems(report, publishedItems, minSimilarity);
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

  /**
   * The owner says a published item is theirs, even if it was never suggested for their report.
   * Only with their own report, and Bienestar then sees the pickup.
   */
  router.post('/catalog/:code/claim', async (req, res) => {
    const reportCode = req.body?.reportCode;
    if (typeof reportCode !== 'string' || reportCode.trim() === '') {
      res.status(400).json({ error: 'reportCode is required' });
      return;
    }

    const report = await matching.findOwnLostReport(reportCode, getCurrentUser(req).id);
    if (!report) {
      res.status(404).json({ error: 'Lost report not found' });
      return;
    }
    const item = await matching.findFoundItemByCode(req.params.code);
    if (!item || item.status !== 'PUBLISHED') {
      res.status(404).json({ error: 'Found item not found' });
      return;
    }

    const result = await matching.claimItem(report.id, item.id, calculateSimilarityScore(report, item));
    if (result === 'REPORT_RECOVERED') {
      res.status(409).json({ error: 'Lost report already recovered' });
      return;
    }
    res.json({ status: 'WILL_PICK_UP' });
  });

  return router;
}