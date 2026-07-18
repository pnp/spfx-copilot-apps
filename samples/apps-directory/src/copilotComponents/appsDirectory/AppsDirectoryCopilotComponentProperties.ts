import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
    category: z.string().optional()
        .describe('Filter apps by category name, e.g. "Human Resources" or "Tools & Collaboration".'),
    searchQuery: z.string().optional()
        .describe('Search and filter apps by keyword in title or description.'),
    showFavoritesOnly: z.string().optional()
        .describe('Pass "true" to show only the user\'s favorite apps.'),
});

export type IAppsDirectoryCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
