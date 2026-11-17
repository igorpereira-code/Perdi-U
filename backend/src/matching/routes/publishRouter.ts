import { Router } from 'express';
import { getCurrentUser, requireRole } from '../../core/currentUser';
import type {
  FoundItemToPublish,
  MatchingRepository,
  PublishedVisibility,
} from '../data/matchingRepository';
import { canBePublished } from '../logic/canBePublished';
import { findSimilarReports } from '../logic/findSimilarReports';
import type { SettingsRepository } from '../../core/data/settingsRepository';

export function createPublishRouter(
  matching: MatchingRepository,
  settings: SettingsRepository,
): Router {
  const router = Router();

  /** Saves the item as a possible match in every active lost report that looks like it enough. Returns how many. */
  async function suggestToSimilarReports(item: FoundItemToPublish): Promise<number> {
    const { minSimilarity } = await settings.getMatchSettings();
    const activeReports = await matching.listActiveLostReports();
    const similarReports = findSimilarReports(item, activeReports, minSimilarity);
    for (const { report, similarity } of similarReports) {
      await matching.saveSuggestions(report.id, [{ foundItemId: item.id, similarity }]);
    }
    return similarReports.length;
  }

  router.post('/found-items/:code/publish', requireRole('WELFARE'), async (req, res) => {
    const visibility = (req.body?.visibility ?? 'VISIBLE') as PublishedVisibility;
    if (!['VISIBLE', 'HIDDEN'].includes(visibility)) {
      res.status(400).json({ error: 'Invalid visibility' });
      return;
    }

    const item = await matching.findFoundItemByCode(String(req.params.code));
    if (!item) {
      res.status(404).json({ error: 'Found item not found' });
      return;
    }
    if (!canBePublished(item.status)) {
      res.status(409).json({ code: 'NOT_RECEIVED' });
      return;
    }

    await matching.publish(item.id, getCurrentUser(req).id, visibility);
    const matchCount = await suggestToSimilarReports(item);
    res.json({ code: item.code, matchCount, visibility });
  });

  return router;
}
