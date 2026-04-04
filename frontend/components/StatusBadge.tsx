import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "active" | "revoked" | "suspended" | "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<
  Status,
  { label: string; icon: React.ElementType; classes: string }
> = {
  active: {
    label: "Действителен",
    icon: CheckCircle,
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  revoked: {
    label: "Аннулирован",
    icon: XCircle,
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  suspended: {
    label: "Приостановлен",
    icon: AlertTriangle,
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  pending: {
    label: "На рассмотрении",
    icon: Clock,
    classes: "bg-stone-50 text-stone-600 border-stone-200",
  },
  approved: {
    label: "Одобрен",
    icon: ShieldCheck,
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "Отклонён",
    icon: XCircle,
    classes: "bg-red-50 text-red-700 border-red-200",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.suspended;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
        config.classes,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
