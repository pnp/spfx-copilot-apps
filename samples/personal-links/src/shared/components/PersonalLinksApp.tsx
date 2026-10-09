import * as React from 'react';
import {
  Avatar,
  Badge,
  Body1,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  makeStyles,
  mergeClasses,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  SearchBox,
  Skeleton,
  SkeletonItem,
  Spinner,
  Text,
  Textarea,
  Title1,
  Title2,
  tokens,
  Tooltip
} from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowDown24Regular,
  ArrowExpand24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ArrowSync24Regular,
  ArrowUp24Regular,
  Bookmark24Regular,
  Calendar24Regular,
  Cloud24Regular,
  Code24Regular,
  Delete24Regular,
  Document24Regular,
  Edit24Regular,
  Folder24Regular,
  Globe24Regular,
  Home24Regular,
  Link24Regular,
  Mail24Regular,
  News24Regular,
  Open24Regular,
  People24Regular,
  Search24Regular,
  Star24Regular,
  TaskListSquareLtr24Regular,
  Video24Regular
} from '@fluentui/react-icons';
import type { FluentIcon } from '@fluentui/react-icons';

import {
  emptyPersonalLinkDraft,
  normalizePersonalLinksDocument,
  validatePersonalLinkDraft,
  type IPersonalLink,
  type IPersonalLinkDraft,
  type IPersonalLinkDraftErrors,
  type PersonalLinkIconKey,
  type PersonalLinksExperienceMode,
  type PersonalLinksStorageStatus
} from '../models/personalLinks';
import {
  type IPersonalLinksService,
  PersonalLinksServiceError
} from '../services/IPersonalLinksService';

const BRAND_NAVY = '#11364f';
const BRAND_BLUE = '#075fce';
const BRAND_GREEN = '#138a3d';
const BRAND_MAGENTA = '#b32687';
const BRAND_CORAL = '#d84f38';
const BRAND_WHITE = '#ffffff';
const DEFAULT_COMPACT_PAGE_SIZE = 6;
const COMPACT_PAGE_SIZES = [3, 6, 9, 12];

function normalizeCompactPageSize(value: number | undefined): number {
  return value && COMPACT_PAGE_SIZES.indexOf(value) >= 0
    ? value
    : DEFAULT_COMPACT_PAGE_SIZE;
}

function runAsync(operation: Promise<unknown>): void {
  operation.catch((error: unknown) => {
    console.error('Personal Links action failed.', error);
  });
}

const useStyles = makeStyles({
  root: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    containerName: 'personal-links',
    containerType: 'inline-size',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1
  },
  compactRoot: {
    maxWidth: '720px',
    marginRight: 'auto',
    marginLeft: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
    overflow: 'hidden'
  },
  compactEditorOpen: {
    minHeight: '700px'
  },
  accent: {
    height: '5px',
    backgroundImage: `linear-gradient(90deg, ${BRAND_BLUE} 0%, ${BRAND_BLUE} 32%, ${BRAND_GREEN} 32%, ${BRAND_GREEN} 55%, ${BRAND_MAGENTA} 55%, ${BRAND_MAGENTA} 78%, ${BRAND_CORAL} 78%)`
  },
  compactContent: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0
  },
  compactMark: {
    display: 'grid',
    placeItems: 'center',
    width: '32px',
    height: '32px',
    color: BRAND_WHITE,
    backgroundColor: BRAND_NAVY,
    borderRadius: tokens.borderRadiusMedium
  },
  brandText: {
    display: 'grid',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  paginationLabel: {
    minWidth: '150px',
    color: tokens.colorNeutralForeground2,
    textAlign: 'center'
  },
  fullRoot: {
    minHeight: '100%',
    backgroundColor: tokens.colorNeutralBackground2
  },
  productBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    color: BRAND_WHITE,
    backgroundColor: BRAND_NAVY,
    '@container personal-links (max-width: 600px)': {
      alignItems: 'flex-start',
      padding: tokens.spacingHorizontalM
    }
  },
  productBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold
  },
  productMark: {
    display: 'grid',
    placeItems: 'center',
    width: '36px',
    height: '36px',
    color: BRAND_NAVY,
    backgroundColor: BRAND_WHITE,
    borderRadius: tokens.borderRadiusMedium
  },
  productStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    '@container personal-links (max-width: 600px)': {
      '& > span': { display: 'none' }
    }
  },
  canvas: {
    display: 'grid',
    gap: tokens.spacingVerticalXL,
    width: '100%',
    maxWidth: '1680px',
    marginRight: 'auto',
    marginLeft: 'auto',
    padding: tokens.spacingHorizontalXXL,
    boxSizing: 'border-box',
    '@container personal-links (max-width: 800px)': {
      padding: tokens.spacingHorizontalL
    },
    '@container personal-links (max-width: 480px)': {
      padding: tokens.spacingHorizontalM
    }
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: tokens.spacingHorizontalXL,
    padding: tokens.spacingHorizontalXL,
    color: BRAND_WHITE,
    backgroundImage: `linear-gradient(125deg, ${BRAND_NAVY} 0%, ${BRAND_BLUE} 58%, ${BRAND_GREEN} 125%)`,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow8,
    '@container personal-links (max-width: 650px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      padding: tokens.spacingHorizontalL
    }
  },
  heroText: {
    display: 'grid',
    gap: tokens.spacingVerticalXS,
    maxWidth: '760px'
  },
  workspace: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
    gap: tokens.spacingHorizontalXL,
    alignItems: 'start',
    '@container personal-links (max-width: 900px)': {
      gridTemplateColumns: 'minmax(0, 1fr)'
    }
  },
  listArea: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    minWidth: 0
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  sectionHeading: {
    display: 'grid',
    gap: tokens.spacingVerticalS
  },
  search: {
    width: 'min(100%, 420px)'
  },
  linkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
    gap: tokens.spacingHorizontalM
  },
  compactGrid: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))'
  },
  linkCard: {
    minWidth: 0,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
    ':hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      boxShadow: tokens.shadow8
    },
    ':focus-within': {
      outline: `2px solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: '2px'
    }
  },
  linkCardSelected: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2
  },
  linkIcon: {
    display: 'grid',
    placeItems: 'center',
    width: '42px',
    height: '42px',
    color: tokens.colorBrandForeground1,
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  cardTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  hostname: {
    overflow: 'hidden',
    color: tokens.colorNeutralForeground3,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  cardDescription: {
    display: '-webkit-box',
    overflow: 'hidden',
    color: tokens.colorNeutralForeground2,
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2
  },
  cardActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    marginLeft: 'auto'
  },
  editor: {
    position: 'sticky',
    top: tokens.spacingVerticalM,
    display: 'grid',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
    '@container personal-links (max-width: 900px)': {
      position: 'static'
    }
  },
  form: {
    display: 'grid',
    gap: tokens.spacingVerticalM
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
    gap: tokens.spacingHorizontalXS
  },
  iconButton: {
    minWidth: '44px'
  },
  iconButtonSelected: {
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground
  },
  formActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end'
  },
  message: {
    marginBottom: tokens.spacingVerticalS
  },
  state: {
    display: 'grid',
    justifyItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge
  },
  skeletonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0
  }
});

const iconCatalog: ReadonlyArray<{
  key: PersonalLinkIconKey;
  label: string;
  icon: FluentIcon;
}> = [
  { key: 'link', label: 'Link', icon: Link24Regular },
  { key: 'globe', label: 'Website', icon: Globe24Regular },
  { key: 'mail', label: 'Mail', icon: Mail24Regular },
  { key: 'calendar', label: 'Calendar', icon: Calendar24Regular },
  { key: 'document', label: 'Document', icon: Document24Regular },
  { key: 'folder', label: 'Folder', icon: Folder24Regular },
  { key: 'people', label: 'People', icon: People24Regular },
  { key: 'tasks', label: 'Tasks', icon: TaskListSquareLtr24Regular },
  { key: 'news', label: 'News', icon: News24Regular },
  { key: 'learning', label: 'Learning', icon: Star24Regular },
  { key: 'video', label: 'Video', icon: Video24Regular },
  { key: 'cloud', label: 'Cloud', icon: Cloud24Regular },
  { key: 'code', label: 'Code', icon: Code24Regular },
  { key: 'bookmark', label: 'Bookmark', icon: Bookmark24Regular },
  { key: 'home', label: 'Home', icon: Home24Regular },
  { key: 'star', label: 'Favorite', icon: Star24Regular }
];

function getIcon(iconKey: PersonalLinkIconKey): FluentIcon {
  return iconCatalog.find(item => item.key === iconKey)?.icon || Link24Regular;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface IPersonalLinksController {
  links: readonly IPersonalLink[];
  status: PersonalLinksStorageStatus;
  message?: string;
  appFolderWebUrl?: string;
  isSaving: boolean;
  reload: () => Promise<void>;
  saveLinks: (links: readonly IPersonalLink[]) => Promise<boolean>;
}

function usePersonalLinks(service: IPersonalLinksService): IPersonalLinksController {
  const [links, setLinks] = React.useState<readonly IPersonalLink[]>([]);
  const [eTag, setETag] = React.useState<string | undefined>();
  const [status, setStatus] = React.useState<PersonalLinksStorageStatus>('loading');
  const [message, setMessage] = React.useState<string | undefined>();
  const [appFolderWebUrl, setAppFolderWebUrl] = React.useState<string | undefined>();
  const saveChain = React.useRef<Promise<boolean>>(Promise.resolve(true));

  const reload = React.useCallback(async (): Promise<void> => {
    setStatus('loading');
    setMessage(undefined);
    setAppFolderWebUrl(undefined);
    try {
      const snapshot = await service.load();
      setLinks(snapshot.document.links);
      setETag(snapshot.eTag);
      setAppFolderWebUrl(snapshot.appFolderWebUrl);
      setStatus('ready');
    } catch (error: unknown) {
      const serviceError = error instanceof PersonalLinksServiceError ? error : undefined;
      setStatus(serviceError?.code === 'permission' ? 'permission' : 'error');
      setMessage(serviceError?.message || 'Personal Links could not load your OneDrive file.');
    }
  }, [service]);

  React.useEffect(() => {
    runAsync(reload());
  }, [reload]);

  const saveLinks = React.useCallback((nextLinks: readonly IPersonalLink[]): Promise<boolean> => {
    const operation = async (): Promise<boolean> => {
      setStatus('saving');
      setMessage(undefined);
      const document = normalizePersonalLinksDocument(nextLinks);
      try {
        const snapshot = await service.save(document, eTag);
        setLinks(snapshot.document.links);
        setETag(snapshot.eTag);
        setAppFolderWebUrl(snapshot.appFolderWebUrl);
        setStatus('ready');
        setMessage('Saved to your OneDrive App Folder.');
        return true;
      } catch (error: unknown) {
        const serviceError = error instanceof PersonalLinksServiceError ? error : undefined;
        if (serviceError?.code === 'conflict') {
          setStatus('conflict');
        } else if (serviceError?.code === 'permission') {
          setStatus('permission');
        } else {
          setStatus('stale');
        }
        setMessage(serviceError?.message || 'Personal Links could not save your changes.');
        return false;
      }
    };
    saveChain.current = saveChain.current.then(operation, operation);
    return saveChain.current;
  }, [eTag, service]);

  return {
    links,
    status,
    message,
    appFolderWebUrl,
    isSaving: status === 'saving',
    reload,
    saveLinks
  };
}

export interface IPersonalLinksModelContext {
  mode: PersonalLinksExperienceMode;
  visibleLinks: ReadonlyArray<{ id: string; title: string }>;
  selectedLink?: { id: string; title: string };
  query?: string;
  workflow: 'list' | 'create' | 'edit';
}

export interface IPersonalLinksAppProps {
  service: IPersonalLinksService;
  mode: PersonalLinksExperienceMode;
  userDisplayName: string;
  demoMode?: boolean;
  hideProductBar?: boolean;
  compactPageSize?: number;
  canRequestFullScreen?: boolean;
  onRequestFullScreen?: () => Promise<void>;
  onRequestInlineEditorSize?: (open: boolean) => Promise<void>;
  onOpenLink: (url: string) => Promise<void>;
  onModelContextChange?: (context: IPersonalLinksModelContext) => void;
}

interface ILinkEditorProps {
  draft: IPersonalLinkDraft;
  errors: IPersonalLinkDraftErrors;
  isSaving: boolean;
  isEditing: boolean;
  onChange: (draft: IPersonalLinkDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}

function LinkEditor(props: ILinkEditorProps): React.ReactElement {
  const styles = useStyles();
  return (
    <div className={styles.form}>
      <Field
        label="Title"
        required
        validationMessage={props.errors.title}
        validationState={props.errors.title ? 'error' : 'none'}
      >
        <Input
          value={props.draft.title}
          maxLength={80}
          onChange={(_, data) => props.onChange({ ...props.draft, title: data.value })}
        />
      </Field>
      <Field
        label="Web address"
        required
        validationMessage={props.errors.url}
        validationState={props.errors.url ? 'error' : 'none'}
      >
        <Input
          value={props.draft.url}
          placeholder="https://contoso.com"
          onChange={(_, data) => props.onChange({ ...props.draft, url: data.value })}
        />
      </Field>
      <Field
        label="Description"
        hint={`${props.draft.description.length}/160`}
        validationMessage={props.errors.description}
        validationState={props.errors.description ? 'error' : 'none'}
      >
        <Textarea
          value={props.draft.description}
          maxLength={160}
          resize="vertical"
          onChange={(_, data) => props.onChange({ ...props.draft, description: data.value })}
        />
      </Field>
      <Field label="Icon">
        <div className={styles.iconGrid} role="radiogroup" aria-label="Choose an icon">
          {iconCatalog.map(item => {
            const Icon = item.icon;
            const selected = props.draft.iconKey === item.key;
            return (
              <Tooltip key={item.key} content={item.label} relationship="label">
                <Button
                  className={mergeClasses(styles.iconButton, selected && styles.iconButtonSelected)}
                  appearance={selected ? 'primary' : 'subtle'}
                  icon={<Icon aria-hidden />}
                  aria-checked={selected}
                  role="radio"
                  onClick={() => props.onChange({ ...props.draft, iconKey: item.key })}
                />
              </Tooltip>
            );
          })}
        </div>
      </Field>
      <div className={styles.formActions}>
        <Button appearance="secondary" disabled={props.isSaving} onClick={props.onCancel}>
          Cancel
        </Button>
        <Button appearance="primary" disabled={props.isSaving} onClick={props.onSave}>
          {props.isSaving ? 'Saving...' : props.isEditing ? 'Save changes' : 'Add link'}
        </Button>
      </div>
    </div>
  );
}

interface ILinkCardProps {
  link: IPersonalLink;
  compact: boolean;
  selected: boolean;
  onOpen: (link: IPersonalLink) => void;
  onEdit: (link: IPersonalLink) => void;
  onDelete: (link: IPersonalLink) => void;
  onSelect: (link: IPersonalLink) => void;
  onMove?: (link: IPersonalLink, direction: -1 | 1) => void;
}

function LinkCard(props: ILinkCardProps): React.ReactElement {
  const styles = useStyles();
  const Icon = getIcon(props.link.iconKey);
  return (
    <Card
      className={mergeClasses(styles.linkCard, props.selected && styles.linkCardSelected)}
      onClick={() => props.onSelect(props.link)}
    >
      <CardHeader
        image={<div className={styles.linkIcon}><Icon aria-hidden /></div>}
        header={<Text weight="semibold" className={styles.cardTitle}>{props.link.title}</Text>}
        description={<Text size={200} className={styles.hostname}>{getHostname(props.link.url)}</Text>}
      />
      {!props.compact && props.link.description && (
        <Body1 className={styles.cardDescription}>{props.link.description}</Body1>
      )}
      <CardFooter>
        <Button
          appearance="subtle"
          icon={<Open24Regular />}
          onClick={event => {
            event.stopPropagation();
            props.onOpen(props.link);
          }}
        >
          Open
        </Button>
        {!props.compact && (
          <div className={styles.cardActions}>
            {props.onMove && (
              <>
                <Tooltip content="Move up" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<ArrowUp24Regular />}
                    aria-label={`Move ${props.link.title} up`}
                    onClick={event => {
                      event.stopPropagation();
                      props.onMove?.(props.link, -1);
                    }}
                  />
                </Tooltip>
                <Tooltip content="Move down" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<ArrowDown24Regular />}
                    aria-label={`Move ${props.link.title} down`}
                    onClick={event => {
                      event.stopPropagation();
                      props.onMove?.(props.link, 1);
                    }}
                  />
                </Tooltip>
              </>
            )}
            <Tooltip content="Edit" relationship="label">
              <Button
                appearance="subtle"
                icon={<Edit24Regular />}
                aria-label={`Edit ${props.link.title}`}
                onClick={event => {
                  event.stopPropagation();
                  props.onEdit(props.link);
                }}
              />
            </Tooltip>
            <Tooltip content="Delete" relationship="label">
              <Button
                appearance="subtle"
                icon={<Delete24Regular />}
                aria-label={`Delete ${props.link.title}`}
                onClick={event => {
                  event.stopPropagation();
                  props.onDelete(props.link);
                }}
              />
            </Tooltip>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function LoadingState(): React.ReactElement {
  const styles = useStyles();
  return (
    <Skeleton aria-label="Loading personal links">
      <div className={styles.skeletonGrid}>
        <SkeletonItem size={96} />
        <SkeletonItem size={96} />
        <SkeletonItem size={96} />
        <SkeletonItem size={96} />
      </div>
    </Skeleton>
  );
}

function statusLabel(status: PersonalLinksStorageStatus): string {
  switch (status) {
    case 'saving': return 'Saving';
    case 'stale': return 'Offline';
    case 'permission': return 'Needs permission';
    case 'conflict': return 'Conflict';
    case 'error': return 'Unavailable';
    case 'loading': return 'Loading';
    default: return 'Saved to OneDrive';
  }
}

export function PersonalLinksApp(props: IPersonalLinksAppProps): React.ReactElement {
  const styles = useStyles();
  const controller = usePersonalLinks(props.service);
  const [query, setQuery] = React.useState<string>('');
  const [selectedId, setSelectedId] = React.useState<string | undefined>();
  const [editingId, setEditingId] = React.useState<string | undefined>();
  const [draft, setDraft] = React.useState<IPersonalLinkDraft>(emptyPersonalLinkDraft);
  const [errors, setErrors] = React.useState<IPersonalLinkDraftErrors>({});
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = React.useState<IPersonalLink | undefined>();
  const [compactPage, setCompactPage] = React.useState<number>(0);
  const selectedLink = controller.links.find(link => link.id === selectedId);
  const editingLink = controller.links.find(link => link.id === editingId);
  const compactPageSize = normalizeCompactPageSize(props.compactPageSize);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredLinks = controller.links.filter(link => {
    if (!normalizedQuery) return true;
    return `${link.title} ${link.description || ''} ${getHostname(link.url)}`
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
  const compactPageCount = Math.max(1, Math.ceil(filteredLinks.length / compactPageSize));
  const activeCompactPage = Math.min(compactPage, compactPageCount - 1);
  const compactPageStart = activeCompactPage * compactPageSize;
  const visibleLinks = props.mode === 'compact'
    ? filteredLinks.slice(compactPageStart, compactPageStart + compactPageSize)
    : filteredLinks;
  const setupBlocked = !props.demoMode
    && (controller.status === 'permission' || controller.status === 'error');

  React.useEffect(() => {
    setCompactPage(currentPage => Math.min(currentPage, compactPageCount - 1));
  }, [compactPageCount]);

  React.useEffect(() => {
    setCompactPage(0);
  }, [compactPageSize]);

  React.useEffect(() => {
    props.onModelContextChange?.({
      mode: props.mode,
      visibleLinks: visibleLinks.map(link => ({ id: link.id, title: link.title })),
      selectedLink: selectedLink ? { id: selectedLink.id, title: selectedLink.title } : undefined,
      query: normalizedQuery || undefined,
      workflow: editingId ? 'edit' : dialogOpen ? 'create' : 'list'
    });
  }, [
    dialogOpen,
    editingId,
    normalizedQuery,
    props,
    selectedLink,
    visibleLinks
  ]);

  const startCreate = React.useCallback((): void => {
    setEditingId(undefined);
    setDraft(emptyPersonalLinkDraft());
    setErrors({});
    if (props.mode === 'compact') {
      const openEditor = async (): Promise<void> => {
        try {
          await props.onRequestInlineEditorSize?.(true);
        } catch (error: unknown) {
          console.error('Personal Links could not expand the inline editor.', error);
        }
        setDialogOpen(true);
      };
      runAsync(openEditor());
    }
  }, [props.mode, props.onRequestInlineEditorSize]);

  const startEdit = React.useCallback((link: IPersonalLink): void => {
    setEditingId(link.id);
    setSelectedId(link.id);
    setDraft({
      title: link.title,
      url: link.url,
      description: link.description || '',
      iconKey: link.iconKey
    });
    setErrors({});
    if (props.mode === 'compact') {
      const openEditor = async (): Promise<void> => {
        try {
          await props.onRequestInlineEditorSize?.(true);
        } catch (error: unknown) {
          console.error('Personal Links could not expand the inline editor.', error);
        }
        setDialogOpen(true);
      };
      runAsync(openEditor());
    }
  }, [props.mode, props.onRequestInlineEditorSize]);

  const cancelEdit = React.useCallback((): void => {
    setEditingId(undefined);
    setDraft(emptyPersonalLinkDraft());
    setErrors({});
    setDialogOpen(false);
    if (props.mode === 'compact' && dialogOpen && props.onRequestInlineEditorSize) {
      runAsync(props.onRequestInlineEditorSize(false));
    }
  }, [dialogOpen, props.mode, props.onRequestInlineEditorSize]);

  const saveDraft = React.useCallback(async (): Promise<void> => {
    const nextErrors = validatePersonalLinkDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const now = new Date().toISOString();
    const normalizedDraft = {
      title: draft.title.trim(),
      url: draft.url.trim(),
      description: draft.description.trim() || undefined,
      iconKey: draft.iconKey
    };
    let nextLinks: readonly IPersonalLink[];
    if (editingLink) {
      nextLinks = controller.links.map(link => link.id === editingLink.id
        ? { ...link, ...normalizedDraft, updatedAt: now }
        : link);
    } else {
      nextLinks = [
        ...controller.links,
        {
          id: createId(),
          ...normalizedDraft,
          order: controller.links.length,
          createdAt: now,
          updatedAt: now
        }
      ];
    }

    if (await controller.saveLinks(nextLinks)) {
      if (!editingLink && props.mode === 'compact') {
        setCompactPage(Math.floor((nextLinks.length - 1) / compactPageSize));
      }
      cancelEdit();
    }
  }, [cancelEdit, compactPageSize, controller, draft, editingLink, props.mode]);

  const deleteLink = React.useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    if (await controller.saveLinks(controller.links.filter(link => link.id !== deleteTarget.id))) {
      if (selectedId === deleteTarget.id) setSelectedId(undefined);
      if (editingId === deleteTarget.id) cancelEdit();
      setDeleteTarget(undefined);
    }
  }, [cancelEdit, controller, deleteTarget, editingId, selectedId]);

  const moveLink = React.useCallback(async (link: IPersonalLink, direction: -1 | 1): Promise<void> => {
    const index = controller.links.findIndex(item => item.id === link.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= controller.links.length) return;
    const nextLinks = [...controller.links];
    [nextLinks[index], nextLinks[nextIndex]] = [nextLinks[nextIndex], nextLinks[index]];
    await controller.saveLinks(nextLinks);
  }, [controller]);

  const openLink = React.useCallback(async (link: IPersonalLink): Promise<void> => {
    await props.onOpenLink(link.url);
  }, [props]);

  const openAppFolder = React.useCallback((): void => {
    if (controller.appFolderWebUrl) {
      runAsync(props.onOpenLink(controller.appFolderWebUrl));
    }
  }, [controller.appFolderWebUrl, props.onOpenLink]);

  const renderMessage = (): React.ReactNode => {
    if (props.demoMode) {
      return (
        <MessageBar className={styles.message} intent="info">
          <MessageBarBody>
            Demo mode is on. Changes are kept only while this web part remains open and are not stored
            in OneDrive.
          </MessageBarBody>
        </MessageBar>
      );
    }
    if (!controller.message) return undefined;
    const intent = controller.status === 'ready' ? 'success' : 'error';
    const permissionMessage = controller.status === 'permission'
      ? (
        <>
          <strong>Administrator approval is required.</strong>{' '}
          Ask a tenant administrator to approve Microsoft Graph
          <strong> Files.ReadWrite.AppFolder</strong> in the SharePoint admin center under
          <strong> Advanced &gt; API access</strong>. After approval, select Retry.
        </>
      )
      : controller.message;
    return (
      <MessageBar className={styles.message} intent={intent}>
        <MessageBarBody>{permissionMessage}</MessageBarBody>
        {controller.status !== 'ready' && (
          <MessageBarActions
            containerAction={(
              <Button
                appearance="transparent"
                icon={<ArrowSync24Regular />}
                aria-label="Reload latest links"
                onClick={() => runAsync(controller.reload())}
              />
            )}
          >
            {controller.status === 'permission' && (
              <Button
                appearance="transparent"
                onClick={() => runAsync(props.onOpenLink(
                  'https://learn.microsoft.com/graph/onedrive-sharepoint-appfolder'
                ))}
              >
                Setup guidance
              </Button>
            )}
          </MessageBarActions>
        )}
      </MessageBar>
    );
  };

  const renderGrid = (compact: boolean): React.ReactNode => {
    if (controller.status === 'loading') return <LoadingState />;
    if (setupBlocked && controller.links.length === 0) {
      return (
        <div className={styles.state}>
          <Cloud24Regular aria-hidden />
          <Title2>Personal Links needs setup</Title2>
          <Body1>
            Complete the action in the message above, then retry. No local fallback or OneDrive file
            change has been made.
          </Body1>
          <Button
            appearance="primary"
            icon={<ArrowSync24Regular />}
            onClick={() => runAsync(controller.reload())}
          >
            Retry
          </Button>
        </div>
      );
    }
    if (controller.links.length === 0) {
      return (
        <div className={styles.state}>
          <Link24Regular aria-hidden />
          <Title2>Keep important places close</Title2>
          <Body1>Save your first personal link and it will follow you across these Microsoft 365 experiences.</Body1>
          <Button appearance="primary" icon={<Add24Regular />} onClick={startCreate}>
            Save your first link
          </Button>
        </div>
      );
    }
    if (filteredLinks.length === 0) {
      return (
        <div className={styles.state}>
          <Search24Regular aria-hidden />
          <Title2>No matching links</Title2>
          <Body1>Try another title, website, or description.</Body1>
          <Button onClick={() => setQuery('')}>Clear search</Button>
        </div>
      );
    }
    return (
      <div className={mergeClasses(styles.linkGrid, compact && styles.compactGrid)}>
        {visibleLinks.map(link => (
          <LinkCard
            key={link.id}
            link={link}
            compact={compact}
            selected={link.id === selectedId}
            onOpen={item => runAsync(openLink(item))}
            onEdit={startEdit}
            onDelete={setDeleteTarget}
            onSelect={item => setSelectedId(item.id)}
            onMove={compact ? undefined : (item, direction) => runAsync(moveLink(item, direction))}
          />
        ))}
      </div>
    );
  };

  const dialogs = (
    <>
      <Dialog open={dialogOpen} onOpenChange={(_, data) => !data.open && cancelEdit()}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editingLink ? 'Edit link' : 'Add a personal link'}</DialogTitle>
            <DialogContent>
              <LinkEditor
                draft={draft}
                errors={errors}
                isSaving={controller.isSaving}
                isEditing={!!editingLink}
                onChange={setDraft}
                onCancel={cancelEdit}
                onSave={() => runAsync(saveDraft())}
              />
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Dialog open={!!deleteTarget} onOpenChange={(_, data) => !data.open && setDeleteTarget(undefined)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete {deleteTarget?.title}?</DialogTitle>
            <DialogContent>This removes the link from every Personal Links experience.</DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDeleteTarget(undefined)}>Cancel</Button>
              <Button appearance="primary" disabled={controller.isSaving} onClick={() => runAsync(deleteLink())}>
                Delete link
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );

  if (props.mode === 'compact') {
    return (
      <section
        className={mergeClasses(
          styles.root,
          styles.compactRoot,
          dialogOpen && styles.compactEditorOpen
        )}
        data-layout="personal-links-compact"
      >
        <div className={styles.accent} />
        <div className={styles.compactContent}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <span className={styles.compactMark}><Link24Regular aria-hidden /></span>
              <span className={styles.brandText}>
                <Text size={500} weight="semibold">Personal Links</Text>
                <Text size={200}>
                  {props.demoMode
                    ? `${controller.links.length} temporary demo links`
                    : `${controller.links.length} saved to OneDrive`}
                </Text>
              </span>
            </div>
            <div className={styles.headerActions}>
              {controller.appFolderWebUrl && !props.demoMode && (
                <Tooltip content="Open OneDrive App Folder" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<Cloud24Regular />}
                    aria-label="Open OneDrive App Folder"
                    onClick={openAppFolder}
                  />
                </Tooltip>
              )}
              <Tooltip content="Add personal link" relationship="label">
                <Button
                  appearance="primary"
                  icon={<Add24Regular />}
                  aria-label="Add personal link"
                  disabled={setupBlocked}
                  onClick={startCreate}
                />
              </Tooltip>
              {props.canRequestFullScreen && props.onRequestFullScreen && (
                <Tooltip content="View in full screen" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<ArrowExpand24Regular />}
                    aria-label="View in full screen"
                    onClick={() => runAsync(props.onRequestFullScreen?.() || Promise.resolve())}
                  />
                </Tooltip>
              )}
            </div>
          </header>
          {renderMessage()}
          {renderGrid(true)}
          {compactPageCount > 1 && (
            <nav className={styles.pagination} aria-label="Personal links pages">
              <Button
                appearance="subtle"
                icon={<ChevronLeft24Regular />}
                aria-label="Previous page"
                disabled={activeCompactPage === 0}
                onClick={() => setCompactPage(currentPage => Math.max(0, currentPage - 1))}
              />
              <Text className={styles.paginationLabel} size={200} aria-live="polite">
                Page {activeCompactPage + 1} of {compactPageCount} - links {compactPageStart + 1}-
                {Math.min(compactPageStart + compactPageSize, filteredLinks.length)} of {filteredLinks.length}
              </Text>
              <Button
                appearance="subtle"
                icon={<ChevronRight24Regular />}
                aria-label="Next page"
                disabled={activeCompactPage === compactPageCount - 1}
                onClick={() => setCompactPage(currentPage => Math.min(compactPageCount - 1, currentPage + 1))}
              />
            </nav>
          )}
          {filteredLinks.length > compactPageSize && props.onRequestFullScreen && (
            <Button appearance="subtle" onClick={() => runAsync(props.onRequestFullScreen?.() || Promise.resolve())}>
              View all {filteredLinks.length} links
            </Button>
          )}
        </div>
        {dialogs}
      </section>
    );
  }

  return (
    <main className={mergeClasses(styles.root, styles.fullRoot)} data-layout="personal-links-full">
      <div className={styles.accent} />
      {!props.hideProductBar && (
        <header className={styles.productBar}>
          <div className={styles.productBrand}>
            <span className={styles.productMark}><Link24Regular aria-hidden /></span>
            <span>Personal Links</span>
          </div>
          <div className={styles.productStatus}>
            <Badge
              appearance="tint"
              color={props.demoMode ? 'informative' : controller.status === 'ready' ? 'success' : 'warning'}
            >
              {props.demoMode ? 'Demo mode' : statusLabel(controller.status)}
            </Badge>
            <span>{props.userDisplayName}</span>
            <Avatar name={props.userDisplayName} size={36} />
          </div>
        </header>
      )}
      <div className={styles.canvas}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <Title1>Your places, one list</Title1>
            <Body1>
              {props.demoMode
                ? 'Explore the complete experience with temporary sample links. Nothing is stored in OneDrive.'
                : 'Open and manage the links you use most. Changes are stored in your OneDrive App Folder.'}
            </Body1>
          </div>
          {controller.appFolderWebUrl && !props.demoMode && (
            <Button
              appearance="secondary"
              icon={<Cloud24Regular />}
              onClick={openAppFolder}
            >
              Open App Folder
            </Button>
          )}
        </section>
        {renderMessage()}
        <div className={styles.workspace}>
          <section className={styles.listArea} aria-labelledby="all-links-heading">
            <div className={styles.toolbar}>
              <div className={styles.sectionHeading}>
                <Title2 id="all-links-heading">All links</Title2>
                <Text>{filteredLinks.length} of {controller.links.length}</Text>
              </div>
              <SearchBox
                className={styles.search}
                value={query}
                placeholder="Search personal links"
                onChange={(_, data) => setQuery(data.value)}
              />
            </div>
            {renderGrid(false)}
          </section>
          <aside className={styles.editor} aria-label={editingLink ? 'Edit link' : 'Create a link'}>
            {setupBlocked ? (
              <div className={styles.state}>
                <Cloud24Regular aria-hidden />
                <Title2>Storage unavailable</Title2>
                <Body1>
                  Complete the required permission or OneDrive setup action before creating or editing
                  links.
                </Body1>
                <Button onClick={() => runAsync(controller.reload())}>Retry setup</Button>
              </div>
            ) : (
              <>
                <div className={styles.sectionHeading}>
                  <Title2>{editingLink ? 'Edit link' : 'Create a link'}</Title2>
                  <Body1>{editingLink
                    ? `Update ${editingLink.title} and save it back to OneDrive.`
                    : 'Add another destination without leaving your full link collection.'}</Body1>
                </div>
                <LinkEditor
                  draft={draft}
                  errors={errors}
                  isSaving={controller.isSaving}
                  isEditing={!!editingLink}
                  onChange={setDraft}
                  onCancel={cancelEdit}
                  onSave={() => runAsync(saveDraft())}
                />
              </>
            )}
          </aside>
        </div>
      </div>
      {dialogs}
      {controller.isSaving && <Spinner className={styles.visuallyHidden} label="Saving personal links" />}
    </main>
  );
}
