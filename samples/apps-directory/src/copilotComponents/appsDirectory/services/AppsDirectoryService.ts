import type { MSGraphClientV3 } from '@microsoft/sp-http';
import { IApp, IAppCategory, ICustomApp } from '../models/IApp';

const ONEDRIVE_FILE_PATH = '/me/drive/special/approot:/AppsDirectory/favorites.json:/content';

export interface IFavoriteData {
    addedIds: number[];
    customApps: ICustomApp[];
}

export class AppsDirectoryService {
    public groupByCategory(apps: IApp[]): IAppCategory[] {
        const categoryMap: { [key: string]: IApp[] } = {};

        apps.forEach(app => {
            if (!categoryMap[app.category]) {
                categoryMap[app.category] = [];
            }
            categoryMap[app.category].push(app);
        });

        const categories: IAppCategory[] = [];
        for (const categoryName in categoryMap) {
            if (Object.prototype.hasOwnProperty.call(categoryMap, categoryName)) {
                categories.push({
                    name: categoryName,
                    apps: categoryMap[categoryName].sort((a, b) => {
                        if (a.sortOrder !== b.sortOrder) {
                            return a.sortOrder - b.sortOrder;
                        }
                        return a.title.localeCompare(b.title);
                    }),
                });
            }
        }

        return categories.sort((a, b) => a.name.localeCompare(b.name));
    }

    public getFavorites(apps: IApp[]): IApp[] {
        return apps
            .filter(app => app.isFavorite)
            .sort((a, b) => {
                if (a.sortOrder !== b.sortOrder) {
                    return a.sortOrder - b.sortOrder;
                }
                return a.title.localeCompare(b.title);
            });
    }

    public addCustomApp(title: string, url: string): ICustomApp {
        return {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title,
            url,
        };
    }

    public async loadFavoriteData(graphClient: MSGraphClientV3): Promise<IFavoriteData | undefined> {
        try {
            const raw: unknown = await graphClient.api(ONEDRIVE_FILE_PATH).get();
            const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return data as IFavoriteData;
        } catch {
            return undefined;
        }
    }

    public async saveFavoriteData(graphClient: MSGraphClientV3, data: IFavoriteData): Promise<void> {
        await graphClient
            .api(ONEDRIVE_FILE_PATH)
            .put(JSON.stringify(data));
    }
}
