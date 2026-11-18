import { useRef, useState } from 'react';
import { GUIDE_SAVE_ERROR, type GuideService } from '../data/guideService';
import { QuickGuide } from './QuickGuide';

type QuickGuideScreenProps = {
  guideService: GuideService;
  onSeen: () => void;
};

export function QuickGuideScreen({ guideService, onSeen }: QuickGuideScreenProps) {
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markGuideSeenAndContinue() {
    if (isSavingRef.current) {
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      await guideService.markSeen();
      onSeen();
    } catch {
      setError(GUIDE_SAVE_ERROR);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return <QuickGuide onSkip={markGuideSeenAndContinue} onComplete={markGuideSeenAndContinue} isSaving={isSaving} error={error} />;
}
