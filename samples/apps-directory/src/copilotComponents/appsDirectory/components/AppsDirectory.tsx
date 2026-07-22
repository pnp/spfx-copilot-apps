import * as React from 'react';
import {
    Button,
    FluentProvider,
    IdPrefixProvider,
    webLightTheme,
    webDarkTheme,
    Input,
    Spinner,
    Text,
    makeStyles,
    tokens,
} from '@fluentui/react-components';
import { ArrowExpand24Regular } from '@fluentui/react-icons';
import type { IAppsDirectoryProps } from './IAppsDirectoryProps';
import type { IApp, IAppCategory, ICustomApp } from '../models/IApp';
import type { IFavoriteData } from '../services/AppsDirectoryService';
import AppCard from './AppCard';
import CategorySection from './CategorySection';
import CustomAppForm from './CustomAppForm';

const MAX_GRID_FAVORITES = 10;

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
    },
    quickLinksGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingHorizontalM,
        paddingTop: tokens.spacingVerticalM,
    },

    fullscreenLayout: {
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
    },
    categoriesPanel: {
        flex: 1,
        overflowY: 'auto',
        padding: tokens.spacingHorizontalM,
    },
    favoritesPanel: {
        width: '210px',
        flexShrink: 0,
        borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
        overflowY: 'auto',
        padding: tokens.spacingHorizontalM,
    },
    favoritesOnlyPanel: {
        flex: 1,
        overflowY: 'auto',
        padding: tokens.spacingHorizontalM,
    },
    panelHeader: {
        fontWeight: tokens.fontWeightSemibold,
        fontSize: tokens.fontSizeBase300,
        paddingBottom: tokens.spacingVerticalXS,
        marginBottom: tokens.spacingVerticalM,
        borderBottom: `2px solid ${tokens.colorBrandBackground}`,
    },
    searchBar: {
        marginBottom: tokens.spacingVerticalM,
        width: '100%',
    },
    loadingContainer: {
        paddingTop: tokens.spacingVerticalS,
        paddingBottom: tokens.spacingVerticalS,
    },
    inlineHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingInline: tokens.spacingHorizontalM,
        paddingTop: tokens.spacingVerticalXS,
    },
});

export default function AppsDirectory(props: IAppsDirectoryProps): React.ReactElement {
    const {
        apps: initialApps,
        category,
        searchQuery,
        showFavoritesOnly,
        hostContext,
        bridge,
        onRequestDisplayMode,
        targetDocument,
        appsDirectoryService,
        graphClient,
        strings,
    } = props;

    const styles = useStyles();

    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [apps, setApps] = React.useState<IApp[]>(() => initialApps.map(app => ({ ...app })));
    const [categories, setCategories] = React.useState<IAppCategory[]>(() =>
        appsDirectoryService.groupByCategory(initialApps.filter(a => !a.isCustomApp))
    );
    const [favorites, setFavorites] = React.useState<IApp[]>(() =>
        appsDirectoryService.getFavorites(initialApps)
    );
    const [userFavorites, setUserFavorites] = React.useState<IApp[]>([]);
    const [pendingDeleteId, setPendingDeleteId] = React.useState<string | undefined>(undefined);
    const [localSearch, setLocalSearch] = React.useState<string>('');

    const latestAppsRef = React.useRef<IApp[]>([]);
    React.useEffect(() => { latestAppsRef.current = apps; }, [apps]);

    const saveDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSaveRef = React.useRef<(() => void) | null>(null);

    const scheduleSave = React.useCallback((): void => {
        if (!graphClient) return;

        const doSave = (): void => {
            const current = latestAppsRef.current;
            const addedIds = current
                .filter(a => a.isFavorite && !a.isCommonFavorite && !a.isCustomApp && typeof a.id === 'number')
                .map(a => a.id as number);
            const customApps: ICustomApp[] = current
                .filter(a => a.isCustomApp)
                .map(a => ({ id: a.id as string, title: a.title, url: a.url }));
            const data: IFavoriteData = { addedIds, customApps };
            appsDirectoryService.saveFavoriteData(graphClient, data).catch(() => undefined);
        };

        pendingSaveRef.current = doSave;
        if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = setTimeout(() => {
            pendingSaveRef.current = null;
            doSave();
        }, 500);
    }, [graphClient, appsDirectoryService]);

    React.useEffect(() => {
        return () => {
            if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);

            if (pendingSaveRef.current) {
                pendingSaveRef.current();
                pendingSaveRef.current = null;
            }
        };
    }, []);

    const initialAppsRef = React.useRef(initialApps);
    const dataLoadedRef = React.useRef(false);

    React.useEffect(() => {
        if (!graphClient || dataLoadedRef.current) {
            return;
        }
        dataLoadedRef.current = true;

        const allApps = initialAppsRef.current.map(app => ({ ...app }));

        const loadData = async (): Promise<void> => {
            let addedIdsSet = new Set<number>();
            let savedCustomApps: ICustomApp[] = [];

            try {
                const saved = await appsDirectoryService.loadFavoriteData(graphClient);
                if (saved) {
                    addedIdsSet = new Set(saved.addedIds ?? []);
                    savedCustomApps = saved.customApps ?? [];
                }
            } catch {
                // ODB unavailable – fall back to common favorites only
            }

            const appliedApps = allApps.map(app => ({
                ...app,
                isFavorite: app.isCommonFavorite || addedIdsSet.has(app.id as number),
            }));

            const customAppItems: IApp[] = savedCustomApps.map(ca => ({
                id: ca.id,
                title: ca.title,
                description: '',
                url: ca.url,
                iconName: 'link',
                category: 'Custom Apps',
                isFavorite: true,
                isCommonFavorite: false,
                isCustomApp: true,
                sortOrder: 0,
            }));

            const mergedApps = [...customAppItems, ...appliedApps];
            const appsForCategories = mergedApps.filter(a => !a.isCustomApp);

            setApps(mergedApps);
            setCategories(appsDirectoryService.groupByCategory(appsForCategories));
            setFavorites(appsDirectoryService.getFavorites(mergedApps));
            setIsLoading(false);
        };

        loadData().catch(() => undefined);
    }, [graphClient, appsDirectoryService]);

    const handleToggleFavorite = React.useCallback(async (
        event: React.MouseEvent,
        appId: number | string,
        currentStatus: boolean
    ): Promise<void> => {
        event.preventDefault();
        event.stopPropagation();

        if (typeof appId === 'string') return;

        const app = apps.find(a => a.id === appId);
        if (!app) return;

        const index = userFavorites.findIndex(fav => fav.id === appId);
        const updatedUserFavorites = index > -1
            ? userFavorites.filter(fav => fav.id !== appId)
            : [...userFavorites, { ...app, isFavorite: true }];

        const updatedApps = apps.map(a =>
            a.id === appId ? { ...a, isFavorite: !currentStatus } : a
        );

        const updatedFavorites = favorites.filter(fav => fav.id !== appId);

        if (!currentStatus) {
            updatedFavorites.push({ ...app, isFavorite: true });
        }

        updatedFavorites.sort((a, b) => a.title.localeCompare(b.title));

        const appsForCategories = updatedApps.filter(a => !a.isCustomApp);

        setApps(updatedApps);
        setCategories(appsDirectoryService.groupByCategory(appsForCategories));
        setFavorites(updatedFavorites);
        setUserFavorites(updatedUserFavorites);
        scheduleSave();
    }, [apps, favorites, userFavorites, appsDirectoryService, scheduleSave]);

    const handleAddCustomApp = React.useCallback(async (title: string, url: string): Promise<void> => {
        const newCustomApp = appsDirectoryService.addCustomApp(title, url);
        const newApp: IApp = {
            id: newCustomApp.id,
            title: newCustomApp.title,
            description: '',
            url: newCustomApp.url,
            iconName: 'link',
            category: 'Custom Apps',
            isFavorite: true,
            isCommonFavorite: false,
            isCustomApp: true,
            sortOrder: 0,
        };
        setApps(prev => [newApp, ...prev]);
        setFavorites(prev => [newApp, ...prev]);
        scheduleSave();
    }, [appsDirectoryService, scheduleSave]);

    const handleDeleteCustomApp = React.useCallback(async (
        event: React.MouseEvent,
        appId: string
    ): Promise<void> => {
        event.preventDefault();
        event.stopPropagation();

        if (pendingDeleteId === appId) {
            setApps(prev => prev.filter(a => a.id !== appId));
            setFavorites(prev => prev.filter(a => a.id !== appId));
            setPendingDeleteId(undefined);
            scheduleSave();
        } else {
            setPendingDeleteId(appId);
        }
    }, [pendingDeleteId, scheduleSave]);

    const activeSearch = localSearch || searchQuery || '';

    const displayCategories = React.useMemo(() => {
        let cats = categories;
        if (category) {
            cats = cats.filter(c =>
                c.name.toLowerCase().includes(category.toLowerCase())
            );
        }
        if (activeSearch) {
            const q = activeSearch.toLowerCase();
            cats = cats.map(c => ({
                ...c,
                apps: c.apps.filter(a =>
                    a.title.toLowerCase().includes(q) ||
                    a.description.toLowerCase().includes(q)
                ),
            })).filter(c => c.apps.length > 0);
        }
        return cats;
    }, [categories, category, activeSearch]);

    const gridFavorites = React.useMemo(
        () => favorites.slice(0, MAX_GRID_FAVORITES),
        [favorites]
    );

    const theme = hostContext.theme === 'dark' ? webDarkTheme : webLightTheme;
    const isFullscreen = hostContext.displayMode === 'fullscreen';
    const isFavoritesOnly = showFavoritesOnly === 'true';

    const inlineApps = React.useMemo(() => {
        const hasFilter = !!category || !!searchQuery;
        if (hasFilter) {
            const allFiltered: IApp[] = ([] as IApp[]).concat(...displayCategories.map((c: IAppCategory) => c.apps));
            return allFiltered.slice(0, MAX_GRID_FAVORITES);
        }
        if (isFavoritesOnly) {
            return favorites.slice(0, MAX_GRID_FAVORITES);
        }
        return gridFavorites;
    }, [category, searchQuery, displayCategories, isFavoritesOnly, favorites, gridFavorites]);

    const renderInline = (): React.ReactElement => (
        <>
            <div className={styles.inlineHeader}>
                <Text weight="semibold">{strings.AppsDirectoryTitle}</Text>
                <Button
                    appearance="subtle"
                    icon={<ArrowExpand24Regular />}
                    title={strings.ExpandButtonLabel}
                    aria-label={strings.ExpandButtonLabel}
                    onClick={() => { onRequestDisplayMode('fullscreen').catch(() => undefined); }}
                >
                    {strings.ExpandButtonLabel}
                </Button>
            </div>
            <div className={styles.quickLinksGrid}>
            {isLoading && inlineApps.length === 0
                ? <Spinner size="small" />
                : inlineApps.map(app => (
                    <AppCard key={app.id} app={app} showStar={false} bridge={bridge} />
                ))
            }
            </div>
        </>
    );

    const renderFavoritesPanel = (panelClassName: string): React.ReactElement => (
        <div className={panelClassName}>
            <div className={styles.panelHeader}>{strings.FavouritesLabel}</div>
            {isLoading ? (
                <div className={styles.loadingContainer}><Spinner size="small" /></div>
            ) : favorites.map(app => (
                <AppCard
                    key={app.id}
                    app={app}
                    showStar={true}
                    bridge={bridge}
                    onToggleFavorite={handleToggleFavorite}
                    onDeleteCustomApp={app.isCustomApp ? handleDeleteCustomApp : undefined}
                    pendingDeleteId={pendingDeleteId}
                />
            ))}
            <CustomAppForm onAddCustomApp={handleAddCustomApp} strings={strings} />
        </div>
    );

    const renderFullscreen = (): React.ReactElement => {
        if (isFavoritesOnly) {
            return (
                <div className={styles.fullscreenLayout}>
                    {renderFavoritesPanel(styles.favoritesOnlyPanel)}
                </div>
            );
        }

        return (
            <div className={styles.fullscreenLayout}>
                <div className={styles.categoriesPanel}>
                    <Input
                        className={styles.searchBar}
                        placeholder={strings.SearchPlaceholder}
                        value={localSearch}
                        onChange={(_, d) => setLocalSearch(d.value)}
                    />
                    {displayCategories.map(cat => (
                        <CategorySection
                            key={cat.name}
                            category={cat}
                            bridge={bridge}
                            onToggleFavorite={handleToggleFavorite}
                            onDeleteCustomApp={handleDeleteCustomApp}
                            pendingDeleteId={pendingDeleteId}
                        />
                    ))}
                </div>
                {renderFavoritesPanel(styles.favoritesPanel)}
            </div>
        );
    };

    return (
        <IdPrefixProvider value="apps-directory-">
            <FluentProvider
                theme={theme}
                targetDocument={targetDocument}
                style={isFullscreen ? { height: '100%', overflow: 'hidden' } : undefined}
            >
                <div className={styles.root} style={isFullscreen ? { height: '100%', overflow: 'hidden' } : undefined}>
                    {isFullscreen ? renderFullscreen() : renderInline()}
                </div>
            </FluentProvider>
        </IdPrefixProvider>
    );
}
