import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
    Star24Regular,
    Star24Filled,
    Delete24Regular,
    Money24Regular,
    Heart24Regular,
    Person24Regular,
    PersonAdd24Regular,
    People24Regular,
    Code24Regular,
    Send24Regular,
    Chat24Regular,
    Globe24Regular,
    Building24Regular,
    Shield24Regular,
    Search24Regular,
    Document24Regular,
    Calendar24Regular,
    Warning24Regular,
    ArrowUp24Regular,
    Link24Regular,
} from '@fluentui/react-icons';
import type { ISPCopilotBridge } from '@microsoft/sp-copilot-component';
import type { IApp } from '../models/IApp';

export interface IAppCardProps {
    app: IApp;
    showStar?: boolean;
    bridge: ISPCopilotBridge;
    onToggleFavorite?: (event: React.MouseEvent, appId: number | string, currentStatus: boolean) => void;
    onDeleteCustomApp?: (event: React.MouseEvent, appId: string) => void;
    pendingDeleteId?: string | undefined;
    className?: string;
}

const useStyles = makeStyles({
    quickLinkItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        width: '65px',
        textAlign: 'center',
        gap: tokens.spacingVerticalXS,
        padding: tokens.spacingVerticalXS,
        borderRadius: tokens.borderRadiusMedium,
        border: 'none',
        background: 'none',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    iconCircle: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: tokens.colorBrandBackground2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: tokens.colorBrandForeground1,
        flexShrink: 0,
    },
    quickLinkLabel: {
        fontSize: tokens.fontSizeBase100,
        lineHeight: tokens.lineHeightBase100,
        color: tokens.colorNeutralForeground1,
        wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    appSmall: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: tokens.spacingHorizontalS,
        marginBottom: tokens.spacingVerticalS,
        width: '100%',
    },
    appIconCircle: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: tokens.colorBrandBackground2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: tokens.colorBrandForeground1,
        flexShrink: 0,
        cursor: 'pointer',
    },
    titleAndStar: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        flex: 1,
        minWidth: 0,
    },
    titleApp: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground1,
        cursor: 'pointer',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ':hover': {
            textDecoration: 'underline',
            color: tokens.colorBrandForeground1,
        },
    },
    starIcon: {
        cursor: 'pointer',
        color: tokens.colorBrandForeground1,
        flexShrink: 0,
        display: 'flex',
        ':hover': { opacity: '0.8' },
    },
    deleteIcon: {
        cursor: 'pointer',
        color: tokens.colorPaletteRedForeground1,
        flexShrink: 0,
        display: 'flex',
        ':hover': { opacity: '0.8' },
    },
    confirmDelete: {
        cursor: 'pointer',
        color: tokens.colorPaletteRedForeground1,
        fontSize: tokens.fontSizeBase100,
        flexShrink: 0,
        ':hover': { opacity: '0.8' },
    },
});

const iconMap: Record<string, React.ReactElement> = {
    money: <Money24Regular />,
    heart: <Heart24Regular />,
    person: <Person24Regular />,
    'person-add': <PersonAdd24Regular />,
    people: <People24Regular />,
    code: <Code24Regular />,
    send: <Send24Regular />,
    chat: <Chat24Regular />,
    globe: <Globe24Regular />,
    building: <Building24Regular />,
    shield: <Shield24Regular />,
    search: <Search24Regular />,
    document: <Document24Regular />,
    calendar: <Calendar24Regular />,
    warning: <Warning24Regular />,
    arrow: <ArrowUp24Regular />,
    link: <Link24Regular />,
};

export function renderAppIconElement(iconName: string | undefined): React.ReactElement {
    return iconMap[iconName ?? ''] ?? <Link24Regular />;
}

const AppCardComponent: React.FC<IAppCardProps> = (props) => {
    const { app, showStar = true, bridge, onToggleFavorite, onDeleteCustomApp, pendingDeleteId } = props;
    const styles = useStyles();

    const handleClick = async (): Promise<void> => {
        if (app.url && app.url !== '#') {
            await bridge.openLinkAsync(app.url);
        }
    };

    if (!showStar && !onToggleFavorite) {
        return (
            <button className={styles.quickLinkItem} onClick={handleClick} title={app.description} type="button">
                <div className={styles.iconCircle}>
                    {renderAppIconElement(app.iconName)}
                </div>
                <span className={styles.quickLinkLabel}>{app.title}</span>
            </button>
        );
    }

    return (
        <div className={styles.appSmall}>
            <div className={styles.appIconCircle} onClick={handleClick} title={app.description}>
                {renderAppIconElement(app.iconName)}
            </div>
            <div className={styles.titleAndStar}>
                <span className={styles.titleApp} onClick={handleClick} title={app.description}>
                    {app.title}
                </span>
                {showStar && !app.isCommonFavorite && !app.isCustomApp && onToggleFavorite && (
                    <span
                        className={styles.starIcon}
                        onClick={(event) => onToggleFavorite(event, app.id, app.isFavorite ?? false)}
                        title={app.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        {app.isFavorite ? <Star24Filled /> : <Star24Regular />}
                    </span>
                )}
                {app.isCustomApp && onDeleteCustomApp && (
                    pendingDeleteId === String(app.id)
                        ? (
                            <span
                                className={styles.confirmDelete}
                                onClick={(event) => onDeleteCustomApp(event, app.id as string)}
                                title="Confirm delete"
                            >
                                Delete?
                            </span>
                        )
                        : (
                            <span
                                className={styles.deleteIcon}
                                onClick={(event) => onDeleteCustomApp(event, app.id as string)}
                                title="Delete custom app"
                            >
                                <Delete24Regular />
                            </span>
                        )
                )}
            </div>
        </div>
    );
};

const AppCard = React.memo(AppCardComponent);
AppCard.displayName = 'AppCard';

export default AppCard;
