import { useEffect, useState } from 'react';
import { Thumb } from '../../core/presenter/Thumb';
import type { FoundItemsService, MyFoundItem } from '../data/foundItemsService';

type FoundItemPhotoProps = {
  report: Pick<MyFoundItem, 'code' | 'category' | 'hasPhoto'>;
  foundItemsService: Pick<FoundItemsService, 'getPhotoUrl'>;
};

export function FoundItemPhoto({ report, foundItemsService }: FoundItemPhotoProps) {
  const [photo, setPhoto] = useState<{ code: string; url: string } | null>(null);

  useEffect(() => {
    let isRequestActive = true;
    setPhoto(null);
    if (report.hasPhoto) {
      foundItemsService.getPhotoUrl(report.code)
        .then(({ url }) => { if (isRequestActive) { setPhoto({ code: report.code, url }); } })
        .catch(() => { if (isRequestActive) { setPhoto(null); } });
    }
    return () => { isRequestActive = false; };
  }, [foundItemsService, report.code, report.hasPhoto]);

  const photoUrl = report.hasPhoto && photo?.code === report.code ? photo.url : null;
  return (
    <span className="shrink-0" onErrorCapture={() => setPhoto(null)}>
      <Thumb category={report.category} photoUrl={photoUrl} />
    </span>
  );
}
