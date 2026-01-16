import { Check, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ComplianceStatus = "approved" | "conditional" | "restricted";

interface ComplianceTagProps {
  status: ComplianceStatus;
  label?: string;
  className?: string;
}

const statusConfig = {
  approved: {
    icon: Check,
    text: "Approved",
    className: "bg-success/10 text-success border-success/20",
  },
  conditional: {
    icon: AlertTriangle,
    text: "Conditional",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  restricted: {
    icon: X,
    text: "Restricted",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export const ComplianceTag = ({ status, label, className }: ComplianceTagProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label || config.text}
    </span>
  );
};
