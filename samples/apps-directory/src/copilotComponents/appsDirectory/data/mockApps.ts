import { IApp } from '../models/IApp';

export function getMockApps(): IApp[] {
    return [
        { id: 1, title: 'SAP Concur', description: 'Systems for expenses, travel, and AP processes', url: 'https://concursolutions.com', iconName: 'money', category: 'Time, Travel & Expenses', isCommonFavorite: true, sortOrder: 1 },
        { id: 2, title: 'Travel Booking', description: 'Travel management for means of transport and accommodation', url: 'https://www.amexglobalbusinesstravel.com', iconName: 'globe', category: 'Time, Travel & Expenses', isCommonFavorite: false, sortOrder: 2 },
        { id: 3, title: 'Medius', description: 'Purchase invoice processing system', url: 'https://cloud.mediusflow.com', iconName: 'money', category: 'Time, Travel & Expenses', isCommonFavorite: false, sortOrder: 3 },

        { id: 4, title: 'Career Model', description: 'Performance and development dialogue', url: '#', iconName: 'person', category: 'Human Resources', isCommonFavorite: false, sortOrder: 1 },
        { id: 5, title: 'Benify', description: 'Health care allowance and other employee benefits', url: 'https://benify.com', iconName: 'heart', category: 'Human Resources', isCommonFavorite: false, sortOrder: 2 },
        { id: 6, title: 'SmartRecruiters', description: 'Recruitment tool', url: 'https://smartrecruiters.com', iconName: 'search', category: 'Human Resources', isCommonFavorite: false, sortOrder: 3 },
        { id: 7, title: 'Internal Jobs & Referrals', description: 'Apply for jobs and recommend people from your network', url: 'https://smartrecruiters.com', iconName: 'people', category: 'Human Resources', isCommonFavorite: false, sortOrder: 4 },
        { id: 8, title: 'Delegations', description: 'Management of Health & Safety delegations', url: '#', iconName: 'people', category: 'Human Resources', isCommonFavorite: false, sortOrder: 5 },
        { id: 9, title: 'Work Environment Incident', description: 'Report, follow up and analyze work related issues', url: '#', iconName: 'warning', category: 'Human Resources', isCommonFavorite: false, sortOrder: 6 },
        { id: 10, title: 'Sub-consultant App', description: 'Register a new internal or external sub-consultant', url: '#', iconName: 'person-add', category: 'Human Resources', isCommonFavorite: false, sortOrder: 7 },
        { id: 11, title: 'SuccessFactors (HeRo)', description: 'HR Employee Master Data system (HRIS)', url: 'https://performancemanager.successfactors.eu', iconName: 'person', category: 'Human Resources', isCommonFavorite: false, sortOrder: 8 },
        { id: 12, title: 'PeopleDoc Employee Portal', description: 'HR requests and employment documents', url: '#', iconName: 'document', category: 'Human Resources', isCommonFavorite: false, sortOrder: 9 },
        { id: 13, title: 'People Hub', description: 'Find HR services and information', url: '#', iconName: 'search', category: 'Human Resources', isCommonFavorite: true, sortOrder: 10 },

        { id: 14, title: 'Resource Planner', description: 'Planning and forecasting of utilization for the business', url: '#', iconName: 'calendar', category: 'Marketing, Sales & Delivery', isCommonFavorite: false, sortOrder: 1 },
        { id: 15, title: 'Search Competence', description: 'Internal competence search for collaboration across sections', url: '#', iconName: 'search', category: 'Marketing, Sales & Delivery', isCommonFavorite: false, sortOrder: 2 },
        { id: 16, title: 'Create a Lead', description: 'Suggest a potential sales opportunity by filling a short form', url: '#', iconName: 'arrow', category: 'Marketing, Sales & Delivery', isCommonFavorite: false, sortOrder: 3 },
        { id: 17, title: 'Sales & Project Model', description: 'Sales and project model guidelines', url: '#', iconName: 'document', category: 'Marketing, Sales & Delivery', isCommonFavorite: false, sortOrder: 4 },
        { id: 18, title: 'Project References', description: 'Project Reference Platform', url: '#', iconName: 'document', category: 'Marketing, Sales & Delivery', isCommonFavorite: false, sortOrder: 5 },
        { id: 19, title: 'ProFinda', description: 'Planning, matching, and utilization forecasting based on skills and availability', url: 'https://profinda.com', iconName: 'search', category: 'Marketing, Sales & Delivery', isCommonFavorite: false, sortOrder: 6 },

        { id: 20, title: 'Microsoft 365', description: 'Link to all Microsoft Office applications', url: 'https://m365.cloud.microsoft.com', iconName: 'link', category: 'Tools & Collaboration', isCommonFavorite: true, sortOrder: 1 },
        { id: 21, title: 'GitHub', description: 'GitHub Enterprise source code management', url: 'https://github.com', iconName: 'code', category: 'Tools & Collaboration', isCommonFavorite: true, sortOrder: 2 },
        { id: 22, title: 'Viva Engage', description: 'Social network included in Microsoft 365', url: 'https://engage.cloud.microsoft', iconName: 'chat', category: 'Tools & Collaboration', isCommonFavorite: true, sortOrder: 3 },
        { id: 23, title: 'BI Platform', description: 'Collected data from both internal and external sources', url: '#', iconName: 'document', category: 'Tools & Collaboration', isCommonFavorite: false, sortOrder: 4 },
        { id: 24, title: 'Send File', description: 'Send large files to clients', url: '#', iconName: 'send', category: 'Tools & Collaboration', isCommonFavorite: false, sortOrder: 5 },
        { id: 25, title: 'Webshop', description: 'Online store for company merchandise', url: '#', iconName: 'link', category: 'Tools & Collaboration', isCommonFavorite: false, sortOrder: 6 },

        { id: 26, title: 'DocuSign', description: 'Tool for signing documents electronically', url: 'https://docusign.com', iconName: 'shield', category: 'Legal & Security', isCommonFavorite: true, sortOrder: 1 },
        { id: 27, title: 'Listen Up', description: 'Whistleblowing tool for anonymous reporting', url: '#', iconName: 'shield', category: 'Legal & Security', isCommonFavorite: false, sortOrder: 2 },
        { id: 28, title: 'Security Checkup', description: 'Order or manage protective security services', url: '#', iconName: 'shield', category: 'Legal & Security', isCommonFavorite: false, sortOrder: 3 },
        { id: 29, title: 'Country Risk Database', description: 'Risk indexes and guidelines in specific countries and regions', url: '#', iconName: 'globe', category: 'Legal & Security', isCommonFavorite: false, sortOrder: 4 },

        { id: 30, title: 'Ongoing Incidents', description: 'List of ongoing IT-related incidents and their status', url: '#', iconName: 'warning', category: 'Support', isCommonFavorite: false, sortOrder: 1 },
        { id: 31, title: 'Workplace Services', description: 'Service for reporting facility related issues', url: '#', iconName: 'building', category: 'Support', isCommonFavorite: false, sortOrder: 2 },
    ];
}
