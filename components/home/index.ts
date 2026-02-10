/**
 * Home Components
 * Barrel export for all home-related components
 */

// Base UI components
export { AnimatedBackground } from './AnimatedBackground';
export { FaceScanVisual } from './FaceScanVisual';
export { GlassCard } from './GlassCard';
export { PulsingButton } from './PulsingButton';
export { SavedPhotoCard } from './SavedPhotoCard';
export { StatusPill } from './StatusPill';
export { FeatureHighlight, FeatureHighlightsRow } from './FeatureHighlight';

// Reusable cards
export { PremiumPromotionCard } from './PremiumPromotionCard';
export { ValidationStatusCard } from './ValidationStatusCard';
export type { ValidationQuality } from './ValidationStatusCard';

// Composite components
export { MeshCarousel } from './MeshCarousel';
export { ImagePickerModal } from './ImagePickerModal';

// Layout components
export { AnalysisLayout } from './AnalysisLayout';
export type { MeshValidation, AnalysisLayoutProps } from './AnalysisLayout';
export { HeroLayout } from './HeroLayout';
export { SavedPhotoLayout } from './SavedPhotoLayout';

// Multi-photo components
export { PhotoGrid } from './PhotoGrid';
export { PhotoGuidanceCard } from './PhotoGuidanceCard';
export { ConsistencyBadge, ConsistencyWarningCard } from './ConsistencyBadge';
export { MultiPhotoPickerModal } from './MultiPhotoPickerModal';
