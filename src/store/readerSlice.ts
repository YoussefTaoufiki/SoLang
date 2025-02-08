import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chapter, Annotation } from '../types';
import { Draft } from '@reduxjs/toolkit';

export interface ReaderState {
  currentBook: string | null;
  position: string;
  bookmarks: string[];
  fontSize: number;
  theme: 'light' | 'dark' | 'sepia';
  textAlign: 'left' | 'right' | 'justify';
  totalLocations: number;
  currentChapter: string;
  progress: number;
  chapters: Chapter[];
  formatting: {
    smartQuotes: boolean;
    ligatures: boolean;
    dropCaps: boolean;
    paragraphSpacing: number;
    lineHeight: number;
    hyphenation: boolean;
    fontFamily: string;
    ligatureMode: 'normal' | 'none' | 'contextual';
    smartDashes: boolean;
    smallCaps: boolean;
    ellipsis: boolean;
  };
  typography: {
    smartQuotes: boolean;
    ligatures: boolean;
    chapterHeadings: {
      fontSize: string;
      fontFamily: string;
      ornaments: boolean;
    };
    verseStyling: {
      indent: string;
      alignment: string;
    };
  };
  currentBookMeta: {
    title: string;
    author: string;
    cover: string;
    lastPosition: string;
    totalReadingTime: number;
  };
  pageLayout: {
    margins: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    maxWidth: string;
    gutter: string;
  };
  animations: {
    pageTurn: 'none' | 'slide' | 'curl';
    speed: number;
  };
  annotations: Annotation[];
  selectedText: { cfi: string; text: string; timestamp: number } | null;
  currentPage: number;
  currentSelection?: {
    cfi: string;
    text: string;
    boundingRects: Array<{ x: number; y: number; width: number; height: number }>;
  };
  readingSession: {
    startTime: number;
    totalWords: number;
    currentSpeed: number;
    pagesTurned: number;
    annotationsMade: number;
  };
}

const initialState: ReaderState = {
  currentBook: null,
  position: '',
  bookmarks: [],
  fontSize: 16,
  theme: 'light',
  textAlign: 'left',
  totalLocations: 0,
  currentChapter: '',
  progress: 0,
  chapters: [],
  formatting: {
    smartQuotes: true,
    ligatures: true,
    dropCaps: true,
    paragraphSpacing: 1.5,
    lineHeight: 1.5,
    hyphenation: true,
    fontFamily: '',
    ligatureMode: 'normal',
    smartDashes: true,
    smallCaps: true,
    ellipsis: true,
  },
  typography: {
    smartQuotes: true,
    ligatures: true,
    chapterHeadings: {
      fontSize: '',
      fontFamily: '',
      ornaments: true,
    },
    verseStyling: {
      indent: '',
      alignment: '',
    },
  },
  currentBookMeta: {
    title: '',
    author: '',
    cover: '',
    lastPosition: '',
    totalReadingTime: 0,
  },
  pageLayout: {
    margins: {
      top: '',
      right: '',
      bottom: '',
      left: '',
    },
    maxWidth: '',
    gutter: '',
  },
  animations: {
    pageTurn: 'none',
    speed: 1,
  },
  annotations: [],
  selectedText: null,
  currentPage: 1,
  currentSelection: undefined,
  readingSession: {
    startTime: 0,
    totalWords: 0,
    currentSpeed: 0,
    pagesTurned: 0,
    annotationsMade: 0
  },
};

const readerSlice = createSlice({
  name: 'reader',
  initialState,
  reducers: {
    setBook: (state, action: PayloadAction<string>) => {
      state.currentBook = action.payload;
    },
    updatePosition: (state, action: PayloadAction<{cfi: string, progress: number}>) => {
      state.position = action.payload.cfi;
      state.progress = action.payload.progress;
    },
    addBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks.push(action.payload);
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'sepia'>) => {
      state.theme = action.payload;
    },
    setTextAlignment: (state, action: PayloadAction<'left' | 'right' | 'justify'>) => {
      state.textAlign = action.payload;
    },
    setTotalLocations: (state, action: PayloadAction<number>) => {
      state.totalLocations = action.payload;
    },
    setCurrentChapter: (state, action: PayloadAction<string>) => {
      state.currentChapter = action.payload;
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    setFormattingOption: <K extends keyof ReaderState['formatting']>(
      state: Draft<ReaderState>,
      action: PayloadAction<{ option: K; value: ReaderState['formatting'][K] }>
    ) => {
      state.formatting[action.payload.option] = action.payload.value;
    },
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.formatting.fontFamily = action.payload;
    },
    setLigatureMode: (state, action: PayloadAction<'normal' | 'none' | 'contextual'>) => {
      state.formatting.ligatureMode = action.payload;
    },
    updateBookMeta: (state, action: PayloadAction<Partial<ReaderState['currentBookMeta']>>) => {
      state.currentBookMeta = { ...state.currentBookMeta, ...action.payload };
    },
    incrementReadingTime: (state, action: PayloadAction<number>) => {
      state.currentBookMeta.totalReadingTime += action.payload;
    },
    setSelectedText: (state, action: PayloadAction<{ cfi: string; text: string; timestamp: number }>) => {
      state.selectedText = action.payload;
    },
    saveReadingProgress: (state, action: PayloadAction<{ bookId: string; position: string; progress: number; lastRead: number }>) => {
      // Implementation
    },
    addAnnotation: (state, action: PayloadAction<Annotation>) => {
      state.annotations.push(action.payload);
    },
    updateChapterProgress: (state, action: PayloadAction<{ cfi: string; progress: number }>) => {
      // Implementation
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    updateAnnotation: (state, action: PayloadAction<Annotation>) => {
      const index = state.annotations.findIndex(a => a.cfi === action.payload.cfi);
      if (index !== -1) {
        state.annotations[index] = action.payload;
      }
    },
    setCurrentSelection: (state, action: PayloadAction<{
      cfi: string;
      text: string;
      boundingRects: Array<{ x: number; y: number; width: number; height: number }>;
    }>) => {
      state.currentSelection = action.payload;
    },
    clearSelection: (state) => {
      state.currentSelection = undefined;
    },
    startReadingSession: (state) => {
      state.readingSession = {
        startTime: Date.now(),
        totalWords: 0,
        currentSpeed: 0,
        pagesTurned: 0,
        annotationsMade: 0
      };
    },
    updateReadingStats: (state, action: PayloadAction<{
      words: number;
      pages?: number;
      annotations?: number;
    }>) => {
      const session = state.readingSession;
      const timeElapsed = (Date.now() - session.startTime) / 60000; // minutes
      
      state.readingSession = {
        ...session,
        totalWords: session.totalWords + action.payload.words,
        pagesTurned: session.pagesTurned + (action.payload.pages || 0),
        annotationsMade: session.annotationsMade + (action.payload.annotations || 0),
        currentSpeed: Math.round((session.totalWords + action.payload.words) / timeElapsed)
      };
    },
    endReadingSession: (state) => {
      if(state.readingSession.startTime > 0) {
        state.currentBookMeta.totalReadingTime += 
          Date.now() - state.readingSession.startTime;
      }
      state.readingSession = {
        startTime: 0,
        totalWords: 0,
        currentSpeed: 0,
        pagesTurned: 0,
        annotationsMade: 0
      };
    },
    saveReadingSession: (state, action: PayloadAction<{
      startTime: number;
      endTime: number;
      totalWords: number;
    }>) => {
      state.readingSession = {
        ...state.readingSession,
        ...action.payload
      };
    },
  },
});

export const {
  setBook,
  updatePosition,
  addBookmark,
  setFontSize,
  setTheme,
  setTextAlignment,
  setTotalLocations,
  setCurrentChapter,
  setProgress,
  setFormattingOption,
  setFontFamily,
  setLigatureMode,
  updateBookMeta,
  incrementReadingTime,
  setSelectedText,
  saveReadingProgress,
  addAnnotation,
  updateChapterProgress,
  setCurrentPage,
  updateAnnotation,
  setCurrentSelection,
  clearSelection,
  startReadingSession,
  updateReadingStats,
  endReadingSession,
  saveReadingSession,
} = readerSlice.actions;
export default readerSlice.reducer; 