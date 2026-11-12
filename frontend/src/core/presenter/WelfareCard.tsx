import { Clock, MapPin, type LucideIcon } from 'lucide-react';
import { useWelfareOffice } from './WelfareOffice';

function Line({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <p className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {text}
    </p>
  );
}

/** Where and when to go to Bienestar, as the Administrator saved it. */
export function WelfareCard() {
  const welfareOffice = useWelfareOffice();
  return (
    <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
      <Line icon={MapPin} text={welfareOffice.place} />
      <Line icon={Clock} text={welfareOffice.hours} />
    </div>
  );
}
