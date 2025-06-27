import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Collection } from '@/types';

const LINKS_KEY = '@linklit_links';
const COLLECTIONS_KEY = '@linklit_collections';
const WELCOME_DISMISSED_KEY = '@linklit_welcome_dismissed';

class StorageServiceClass {
  // Links
  async getLinks(): Promise<Link[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(LINKS_KEY);
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting links:', error);
      return [];
    }
  }

  async saveLinks(links: Link[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(links);
      await AsyncStorage.setItem(LINKS_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving links:', error);
    }
  }

  async addLink(link: Link): Promise<void> {
    try {
      const links = await this.getLinks();
      links.unshift(link);
      await this.saveLinks(links);
    } catch (error) {
      console.error('Error adding link:', error);
    }
  }

  async updateLink(linkId: string, updates: Partial<Link>): Promise<void> {
    try {
      const links = await this.getLinks();
      const index = links.findIndex(l => l.id === linkId);
      if (index !== -1) {
        links[index] = { ...links[index], ...updates, updatedAt: new Date() };
        await this.saveLinks(links);
      }
    } catch (error) {
      console.error('Error updating link:', error);
    }
  }

  async deleteLink(linkId: string): Promise<void> {
    try {
      const links = await this.getLinks();
      const filteredLinks = links.filter(l => l.id !== linkId);
      await this.saveLinks(filteredLinks);
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(COLLECTIONS_KEY);
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  async saveCollections(collections: Collection[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(collections);
      await AsyncStorage.setItem(COLLECTIONS_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving collections:', error);
    }
  }

  async addCollection(collection: Collection): Promise<void> {
    try {
      const collections = await this.getCollections();
      collections.unshift(collection);
      await this.saveCollections(collections);
    } catch (error) {
      console.error('Error adding collection:', error);
    }
  }

  async updateCollection(collectionId: string, updates: Partial<Collection>): Promise<void> {
    try {
      const collections = await this.getCollections();
      const index = collections.findIndex(c => c.id === collectionId);
      if (index !== -1) {
        collections[index] = { ...collections[index], ...updates, updatedAt: new Date() };
        await this.saveCollections(collections);
      }
    } catch (error) {
      console.error('Error updating collection:', error);
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    try {
      const collections = await this.getCollections();
      const filteredCollections = collections.filter(c => c.id !== collectionId);
      await this.saveCollections(filteredCollections);
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error; // Re-throw to allow calling code to handle the error
    }
  }

  // Welcome banner dismissal
  async isWelcomeDismissed(): Promise<boolean> {
    try {
      const dismissed = await AsyncStorage.getItem(WELCOME_DISMISSED_KEY);
      return dismissed === 'true';
    } catch (error) {
      console.error('Error getting welcome dismissed status:', error);
      return false;
    }
  }

  async setWelcomeDismissed(): Promise<void> {
    try {
      await AsyncStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    } catch (error) {
      console.error('Error setting welcome dismissed status:', error);
    }
  }
}

export const StorageService = new StorageServiceClass();