import type { DashboardSection, IDashboardData, IProduct, SectionVisibility, StoreKey } from '../ZavaRetailTypes';

/** Common data every dashboard sub-component needs. */
export interface IDashboardSectionProps {
  data: IDashboardData;
}

export interface IInlineViewProps {
  data: IDashboardData;
  message: string;
  onRequestFullscreen: () => void;
}

export interface IFullScreenViewProps {
  data: IDashboardData;
  useMock: boolean;
  dataServiceUrl: string;
  dataError?: string;
  visibleProducts: IProduct[];
  onPrevProducts: () => void;
  onNextProducts: () => void;
  onOpenSettings: () => void;
  isSettingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onUseMockChange: (value: boolean) => void;
  onDataServiceUrlChange: (value: string) => void;
  isFiltersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  targetStore: StoreKey;
  onTargetStoreChange: (store: StoreKey) => void;
  dateOffset: number;
  onDateOffsetChange: (offset: number) => void;
  sectionVisibility: SectionVisibility;
  onSectionVisibilityChange: (section: DashboardSection, visible: boolean) => void;
}

export interface IFiltersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStore: StoreKey;
  onTargetStoreChange: (store: StoreKey) => void;
  dateOffset: number;
  onDateOffsetChange: (offset: number) => void;
  sectionVisibility: SectionVisibility;
  onSectionVisibilityChange: (section: DashboardSection, visible: boolean) => void;
}

export interface IProductCarouselProps {
  visibleProducts: IProduct[];
  onPrev: () => void;
  onNext: () => void;
}

export interface ISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useMock: boolean;
  dataServiceUrl: string;
  dataError?: string;
  onUseMockChange: (value: boolean) => void;
  onDataServiceUrlChange: (value: string) => void;
}
