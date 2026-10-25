import { formatPrice } from '@/lib/format';

interface DataCardProps {
  value: number;
  label: string;
  shouldFormat?: boolean;
}

export const DataCard = ({ value, label, shouldFormat }: DataCardProps) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {shouldFormat ? formatPrice(value) : value}
      </p>
    </div>
  );
};
