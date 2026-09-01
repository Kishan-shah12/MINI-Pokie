import React from "react";
import * as Icons from "lucide-react";

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = "w-5 h-5", size }) => {
  // Safe lookup in lucide-react
  const LucideIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[name];

  if (!LucideIcon) {
    const Fallback = Icons.Sparkles;
    return <Fallback className={className} size={size} />;
  }

  return <LucideIcon className={className} size={size} />;
};
