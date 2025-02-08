import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = Platform.OS === 'ios' 
  ? `${RNFS.DocumentDirectoryPath}/books` 
  : `${RNFS.ExternalDirectoryPath}/books`;

const CACHE_INDEX_KEY = '@book_cache_index';

interface CachedBook {
  bookId: string;
  path: string;
  size: number;
  lastAccessed: number;
  hash: string;
  lastUsed: number;
  accessCount: number;
  priority: number;
}

export class BookCache {
  private static MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
  
  static async init() {
    try {
      const exists = await RNFS.exists(CACHE_DIR);
      if (!exists) {
        await RNFS.mkdir(CACHE_DIR);
      }
    } catch (error) {
      console.error('Failed to initialize book cache:', error);
    }
  }

  static async cacheBook(bookId: string, url: string): Promise<string> {
    try {
      const localPath = `${CACHE_DIR}/${bookId}.epub`;
      const cacheIndex = await this.getCacheIndex();
      
      // Check if book is already cached
      const cached = cacheIndex[bookId];
      if (cached && await RNFS.exists(cached.path)) {
        cached.lastUsed = Date.now();
        cached.accessCount++;
        cached.priority = this.calculatePriority(cached);
        await this.saveCacheIndex(cacheIndex);
        return cached.path;
      }

      // Download and cache the book
      await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
        background: true,
        discretionary: true,
      }).promise;

      const fileInfo = await RNFS.stat(localPath);
      const fileHash = (fileInfo as any).hash || await this.generateFileHash(localPath);
      
      // Manage cache size
      await this.ensureCacheSize(fileInfo.size);
      
      // Update cache index
      cacheIndex[bookId] = {
        bookId,
        path: localPath,
        size: fileInfo.size,
        lastAccessed: Date.now(),
        hash: fileHash,
        lastUsed: Date.now(),
        accessCount: 1,
        priority: this.calculatePriority({
          bookId,
          path: localPath,
          size: fileInfo.size,
          lastAccessed: Date.now(),
          hash: fileHash,
          lastUsed: Date.now(),
          accessCount: 1,
          priority: 0,
        }),
      };
      
      await this.saveCacheIndex(cacheIndex);
      return localPath;
    } catch (error) {
      console.error('Failed to cache book:', error);
      throw error;
    }
  }

  private static async getCacheIndex(): Promise<Record<string, CachedBook>> {
    try {
      const index = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      return index ? JSON.parse(index) : {};
    } catch (error) {
      console.error('Failed to get cache index:', error);
      return {};
    }
  }

  private static async saveCacheIndex(index: Record<string, CachedBook>) {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  }

  private static async updateLastAccessed(bookId: string) {
    const index = await this.getCacheIndex();
    if (index[bookId]) {
      index[bookId].lastAccessed = Date.now();
      await this.saveCacheIndex(index);
    }
  }

  private static calculatePriority(book: CachedBook): number {
    const recency = Date.now() - book.lastUsed;
    const frequencyWeight = Math.log(book.accessCount + 1);
    const recencyWeight = 1 / (recency / (1000 * 60 * 60 * 24) + 1); // Days since last access
    return frequencyWeight * recencyWeight;
  }

  private static async ensureCacheSize(newBookSize: number) {
    const index = await this.getCacheIndex();
    let currentSize = Object.values(index).reduce((sum, book) => sum + book.size, 0);
    
    if (currentSize + newBookSize > this.MAX_CACHE_SIZE) {
      // Sort by priority (lowest first)
      const books = Object.values(index).sort((a, b) => a.priority - b.priority);
      
      for (const book of books) {
        if (currentSize + newBookSize <= this.MAX_CACHE_SIZE) break;
        
        try {
          await RNFS.unlink(book.path);
          delete index[book.bookId];
          currentSize -= book.size;
        } catch (error) {
          console.error(`Failed to remove cached book ${book.bookId}:`, error);
        }
      }
      
      await this.saveCacheIndex(index);
    }
  }

  static async clearCache() {
    try {
      await RNFS.unlink(CACHE_DIR);
      await RNFS.mkdir(CACHE_DIR);
      await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    } catch (error) {
      console.error('Failed to clear book cache:', error);
      throw error;
    }
  }

  private static async generateFileHash(path: string): Promise<string> {
    const content = await RNFS.readFile(path, 'base64');
    return content.slice(0, 32); // Temporary simple hash
  }
} 