import { Collection, Link } from '@/types';
import { Colors } from '@/constants/colors';
import { StorageService } from './storage';

export const createDefaultCollection = (): Collection => {
  return {
    id: 'default-bolt-hackathon',
    name: 'Bolt Hackathon',
    description: 'Everything you need for the World\'s Largest Hackathon! Resources, community, and tools to build amazing projects.',
    color: Colors.light.collections.blue,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    linkCount: 6,
  };
};

export const createDefaultLinks = (): Link[] => {
  const baseDate = new Date();
  
  return [
    {
      id: 'default-link-1',
      url: 'https://worldslargesthackathon.devpost.com/',
      title: 'World\'s Largest Hackathon - Main Page',
      description: 'The official homepage for the World\'s Largest Hackathon. Find all the details about the event, prizes, and how to participate.',
      collectionId: 'default-bolt-hackathon',
      isCompleted: false,
      createdAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
      favicon: 'https://www.google.com/s2/favicons?domain=devpost.com&sz=32',
    },
    {
      id: 'default-link-2',
      url: 'https://worldslargesthackathon.devpost.com/resources',
      title: 'Hackathon Resources & Tools',
      description: 'Essential resources, APIs, tools, and documentation to help you build your hackathon project. Everything you need in one place.',
      collectionId: 'default-bolt-hackathon',
      isCompleted: false,
      createdAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      updatedAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000),
      favicon: 'https://www.google.com/s2/favicons?domain=devpost.com&sz=32',
    },
    {
      id: 'default-link-3',
      url: 'https://discord.com/channels/364486390102097930/671536649301131325',
      title: 'Hackathon Discord Community',
      description: 'Join the official Discord community to connect with other participants, get help, share ideas, and stay updated on announcements.',
      collectionId: 'default-bolt-hackathon',
      isCompleted: false,
      createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      favicon: 'https://www.google.com/s2/favicons?domain=discord.com&sz=32',
    },
    {
      id: 'default-link-4',
      url: 'https://app.getriver.io/bolt',
      title: 'Bolt by StackBlitz - Build & Deploy',
      description: 'The AI-powered development platform that lets you build, edit, and deploy full-stack web applications directly in your browser.',
      collectionId: 'default-bolt-hackathon',
      isCompleted: false,
      createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      favicon: 'https://www.google.com/s2/favicons?domain=getriver.io&sz=32',
    },
    {
      id: 'default-link-5',
      url: 'https://www.youtube.com/watch?v=SM8nkwdHMu4',
      title: 'Bolt Tutorial - Build Apps with AI',
      description: 'Learn how to use Bolt to build full-stack applications with AI assistance. Perfect tutorial for hackathon participants.',
      collectionId: 'default-bolt-hackathon',
      isCompleted: false,
      createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=32',
    },
    {
      id: 'default-link-6',
      url: 'https://x.com/boltdotnew',
      title: 'Bolt on X (Twitter)',
      description: 'Follow @boltdotnew for the latest updates, tips, and community highlights. Stay connected with the Bolt community.',
      collectionId: 'default-bolt-hackathon',
      isCompleted: false,
      createdAt: baseDate,
      updatedAt: baseDate,
      favicon: 'https://www.google.com/s2/favicons?domain=x.com&sz=32',
    },
  ];
};

export const DefaultDataService = {
  async initializeDefaultData(): Promise<void> {
    try {
      // Check if default data already exists
      const [existingCollections, existingLinks] = await Promise.all([
        StorageService.getCollections(),
        StorageService.getLinks()
      ]);
      
      const hasDefaultCollection = existingCollections.some(c => c.id === 'default-bolt-hackathon');
      const hasDefaultLinks = existingLinks.some(l => l.id?.startsWith('default-link-'));
      
      // Only create default data if it doesn't exist
      if (!hasDefaultCollection || !hasDefaultLinks) {
        const defaultCollection = createDefaultCollection();
        const defaultLinks = createDefaultLinks();
        
        // Add default collection if it doesn't exist
        if (!hasDefaultCollection) {
          await StorageService.addCollection(defaultCollection);
        }
        
        // Add default links if they don't exist
        if (!hasDefaultLinks) {
          for (const link of defaultLinks) {
            await StorageService.addLink(link);
          }
        }
        
        console.log('Default Bolt Hackathon collection and links created successfully');
      } else {
        // Check if we need to add the new links to existing collection
        const existingDefaultLinks = existingLinks.filter(l => l.id?.startsWith('default-link-'));
        const hasYouTubeLink = existingDefaultLinks.some(l => l.id === 'default-link-5');
        const hasXLink = existingDefaultLinks.some(l => l.id === 'default-link-6');
        
        if (!hasYouTubeLink || !hasXLink) {
          const defaultLinks = createDefaultLinks();
          
          if (!hasYouTubeLink) {
            const youtubeLink = defaultLinks.find(l => l.id === 'default-link-5');
            if (youtubeLink) {
              await StorageService.addLink(youtubeLink);
            }
          }
          
          if (!hasXLink) {
            const xLink = defaultLinks.find(l => l.id === 'default-link-6');
            if (xLink) {
              await StorageService.addLink(xLink);
            }
          }
          
          // Update collection link count
          const updatedCollection = createDefaultCollection();
          await StorageService.updateCollection('default-bolt-hackathon', {
            linkCount: updatedCollection.linkCount
          });
          
          console.log('Added new default links to existing Bolt Hackathon collection');
        }
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }
};