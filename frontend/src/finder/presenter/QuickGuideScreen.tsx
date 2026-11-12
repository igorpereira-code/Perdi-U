import { useRef, useState } from 'react';
import { GUIDE_SAVE_ERROR, type GuideService } from '../data/guideService';
import { QuickGuide } from './QuickGuide';

type QuickGuideScreenProps = {
  guideService: GuideService;
  onSeen: () => void;
};

export function QuickGuideScreen({ guideService, onSeen }: QuickGuideScreenProps) {
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finishGuide() {
    if (savingRef.current) {
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      await guideService.markSeen();
      onSeen();
    } catch {
      setError(GUIDE_SAVE_ERROR);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <QuickGuide onSkip={finishGuide} onComplete={finishGuide} saving={saving} error={error} />;
}
