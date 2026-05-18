import type { ModeLabels } from '../../types';

interface ModeContentProps {
  content: ModeLabels;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

// Always renders the enthusiast (single) explanation — mode switching removed.
export function ModeContent({ content, className = '', as: Tag = 'p' }: ModeContentProps) {
  return <Tag className={className}>{content.enthusiast}</Tag>;
}

// Kept for import compatibility — renders nothing.
export function ModeBadge() {
  return null;
}
