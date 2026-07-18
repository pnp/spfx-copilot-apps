import * as React from 'react';
import { Button, Input, Label, makeStyles, tokens } from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import type { IAppsDirectoryStrings } from './IAppsDirectoryProps';

export interface ICustomAppFormProps {
    onAddCustomApp: (title: string, url: string) => Promise<void>;
    strings: IAppsDirectoryStrings;
}

const useStyles = makeStyles({
    wrapper: {
        marginTop: tokens.spacingVerticalM,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        marginTop: tokens.spacingVerticalS,
        padding: tokens.spacingHorizontalS,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
    },
    formActions: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
        justifyContent: 'flex-end',
    },
    errorText: {
        color: tokens.colorPaletteRedForeground1,
        fontSize: tokens.fontSizeBase100,
    },
});

const CustomAppFormComponent: React.FC<ICustomAppFormProps> = (props) => {
    const { onAddCustomApp, strings } = props;
    const styles = useStyles();
    const [isFormVisible, setIsFormVisible] = React.useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
    const [titleValue, setTitleValue] = React.useState<string>('');
    const [urlValue, setUrlValue] = React.useState<string>('');
    const [error, setError] = React.useState<string>('');

    const toggleForm = (): void => {
        setIsFormVisible(!isFormVisible);
        setTitleValue('');
        setUrlValue('');
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!titleValue.trim() || !urlValue.trim()) return;
        setIsSubmitting(true);
        setError('');
        try {
            await onAddCustomApp(titleValue.trim(), urlValue.trim());
            setTitleValue('');
            setUrlValue('');
            setIsFormVisible(false);
        } catch {
            setError('Failed to add custom app. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={toggleForm}
                disabled={isSubmitting}
                size="small"
                style={{ width: '100%' }}
            >
                {strings.CustomAppButtonLabel}
            </Button>

            {isFormVisible && (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <Label htmlFor="customAppTitle" size="small">{strings.CustomAppTitleLabel}</Label>
                        <Input
                            id="customAppTitle"
                            size="small"
                            placeholder={strings.CustomAppTitlePlaceholder}
                            value={titleValue}
                            onChange={(_, d) => setTitleValue(d.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <Label htmlFor="customAppUrl" size="small">{strings.CustomAppUrlLabel}</Label>
                        <Input
                            id="customAppUrl"
                            type="url"
                            size="small"
                            placeholder={strings.CustomAppUrlPlaceholder}
                            value={urlValue}
                            onChange={(_, d) => setUrlValue(d.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    {error && <span className={styles.errorText}>{error}</span>}
                    <div className={styles.formActions}>
                        <Button type="submit" appearance="primary" size="small" disabled={isSubmitting}>
                            {isSubmitting ? strings.AddingLabel : strings.AddButtonLabel}
                        </Button>
                        <Button type="button" appearance="secondary" size="small" onClick={toggleForm} disabled={isSubmitting}>
                            {strings.CancelButtonLabel}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

const CustomAppForm = React.memo(CustomAppFormComponent);
CustomAppForm.displayName = 'CustomAppForm';

export default CustomAppForm;
