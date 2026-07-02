import type { IDashboardData, IProduct, ZavaTheme } from '../ZavaRetailTypes';

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
  theme: ZavaTheme;
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
  onThemeChange: (value: ZavaTheme) => void;
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
  theme: ZavaTheme;
  onUseMockChange: (value: boolean) => void;
  onDataServiceUrlChange: (value: string) => void;
  onThemeChange: (value: ZavaTheme) => void;
}
