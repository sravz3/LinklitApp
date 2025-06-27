export interface LinkPreview {
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  url: string;
}

export const LinkPreviewService = {
  async getPreview(url: string): Promise<LinkPreview> {
    try {
      // For web version, we could use a service like LinkPreview API
      // For now, we'll extract basic info from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Simple title extraction from domain
      const title = this.getTitleFromDomain(domain) || url;
      
      return {
        title,
        description: `Link from ${domain}`,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        url
      };
    } catch (error) {
      console.error('Error getting link preview:', error);
      return {
        title: url,
        url
      };
    }
  },

  getTitleFromDomain(domain: string): string {
    const domainMap: { [key: string]: string } = {
      'youtube.com': 'YouTube Video',
      'youtu.be': 'YouTube Video',
      'amazon.com': 'Amazon Product',
      'github.com': 'GitHub Repository',
      'stackoverflow.com': 'Stack Overflow',
      'medium.com': 'Medium Article',
      'twitter.com': 'Twitter Post',
      'x.com': 'X Post',
      'linkedin.com': 'LinkedIn Post',
      'reddit.com': 'Reddit Post',
      'wikipedia.org': 'Wikipedia Article'
    };

    return domainMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
  }
};