export interface IApp {
    id: number | string;
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    iconName?: string;
    category: string;
    isFavorite?: boolean;
    isCommonFavorite: boolean;
    isCustomApp?: boolean;
    sortOrder: number;
}

export interface IAppCategory {
    name: string;
    apps: IApp[];
}

export interface ICustomApp {
    id: string;
    title: string;
    url: string;
}
