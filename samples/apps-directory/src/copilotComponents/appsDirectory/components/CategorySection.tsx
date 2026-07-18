import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { Star24Regular, Star24Filled, Delete24Regular } from '@fluentui/react-icons';
import type { ISPCopilotBridge } from '@microsoft/sp-copilot-component';
import type { IAppCategory } from '../models/IApp';
import { renderAppIconElement } from './AppCard';

export interface ICategorySectionProps {
    category: IAppCategory;
    bridge: ISPCopilotBridge;
    onToggleFavorite?: (event: React.MouseEvent, appId: number | string, currentStatus: boolean) => void;
    onDeleteCustomApp?: (event: React.MouseEvent, appId: string) => void;
    pendingDeleteId?: string | undefined;
}

const useStyles = makeStyles({
    categoryWrapper: {
        marginBottom: tokens.spacingVerticalL,
    },
    categoryHeader: {
        fontWeight: tokens.fontWeightSemibold,
        fontSize: tokens.fontSizeBase300,
        paddingBottom: tokens.spacingVerticalXS,
        marginBottom: tokens.spacingVerticalS,
        borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
        color: tokens.colorNeutralForeground1,
    },
    categoryApps: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    },
    app: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: tokens.spacingHorizontalS,
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
    appDetails: {
        flex: 1,
        minWidth: 0,
    },
    titleAndStar: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
    },
    titleApp: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground1,
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flexShrink: 1,
        minWidth: 0,
        ':hover': {
            textDecoration: 'underline',
            color: tokens.colorBrandForeground1,
        },
    },
    descriptionApp: {
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorNeutralForeground3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
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

const CategorySectionComponent: React.FC<ICategorySectionProps> = (props) => {
    const { category, bridge, onToggleFavorite, onDeleteCustomApp, pendingDeleteId } = props;
    const styles = useStyles();

    const handleClick = async (url: string): Promise<void> => {
        if (url && url !== '#') {
            await bridge.openLinkAsync(url);
        }
    };

    return (
        <div className={styles.categoryWrapper}>
            <div className={styles.categoryHeader}>{category.name}</div>
            <div className={styles.categoryApps}>
                {category.apps.map(app => (
                    <div key={app.id} className={styles.app}>
                        <div
                            className={styles.appIconCircle}
                            onClick={() => handleClick(app.url)}
                            title={app.description}
                        >
                            {renderAppIconElement(app.iconName)}
                        </div>
                        <div className={styles.appDetails}>
                            <div className={styles.titleAndStar}>
                                <span
                                    className={styles.titleApp}
                                    onClick={() => handleClick(app.url)}
                                    title={app.description}
                                >
                                    {app.title}
                                </span>
                                {!app.isCommonFavorite && !app.isCustomApp && onToggleFavorite && (
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
                            {app.description && (
                                <div className={styles.descriptionApp}>{app.description}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CategorySection = React.memo(CategorySectionComponent);
CategorySection.displayName = 'CategorySection';

export default CategorySection;
