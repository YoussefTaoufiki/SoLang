import React, { useCallback, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Button } from 'react-native';
import WebView from 'react-native-webview';
import { useAppDispatch } from '../store/store';
import { createMessageHandler } from '../utils/epubBridge';
import { createEPUBTemplate } from '../utils/epubTemplate';
import { BookCache } from '../utils/bookCache';
import { 
  setCurrentChapter,
  updatePosition,
  setSelectedText,
  addAnnotation,
  startReadingSession
} from '../store/readerSlice';
import { useTheme } from 'react-native-paper';
import { DeviceEventEmitter } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Annotation } from '../types';

interface EPUBReaderProps {
  bookId: string;
  bookUrl: string;
  onBookLoaded?: (metadata: { title: string; author: string }) => void;
  onError?: (error: string) => void;
}

export const EPUBReader: React.FC<EPUBReaderProps> = ({
  bookId,
  bookUrl,
  onBookLoaded,
  onError
}) => {
  const webViewRef = useRef<WebView>(null);
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const [localBookPath, setLocalBookPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const store = useSelector((state: RootState) => state.reader);

  useEffect(() => {
    loadBook();
  }, [bookId, bookUrl]);

  useEffect(() => {
    const handleMemoryWarning = () => {
      webViewRef.current?.injectJavaScript(`
        window.dispatchEvent(new Event('memoryWarning'));
        true;
      `);
    };

    DeviceEventEmitter.addListener('memoryWarning', handleMemoryWarning);
    
    return () => {
      DeviceEventEmitter.removeAllListeners('memoryWarning');
    };
  }, []);

  const loadBook = async () => {
    try {
      setIsLoading(true);
      const path = await BookCache.cacheBook(bookId, bookUrl);
      setLocalBookPath(path);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to load book');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = createMessageHandler({
    onPositionChanged: (cfi: string, progress: number) => {
      dispatch(updatePosition({ cfi, progress }));
    },
    onChapterLoaded: (chapter) => {
      dispatch(setCurrentChapter(chapter.title));
    },
    onBookLoaded: (book) => {
      onBookLoaded?.(book);
    },
    onTextSelected: (cfi, text) => {
      dispatch(setSelectedText({ cfi, text, timestamp: Date.now() }));
    },
    onError: (error) => {
      onError?.(error);
    },
    onSaveAnnotations: (annotations: Annotation[]) => {
      annotations.forEach(annotation => 
        dispatch(addAnnotation(annotation))
      );
    },
    onLoadAnnotations: () => {
      const annotations = store.annotations;
      webViewRef.current?.injectJavaScript(`
        rendition.annotations.clear('highlight');
        ${annotations.map((annotation: Annotation) => `
          rendition.annotations.add('highlight', '${annotation.cfi}', {}, () => {
            const el = document.querySelector(\`[data-cfi="${annotation.cfi}"]\`);
            if(el) el.style.backgroundColor = 'rgba(255,255,0,0.3)';
          });
        `).join('')}
        true;
      `);
    }
  });

  if (isLoading || !localBookPath) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const html = createEPUBTemplate(
    localBookPath,
    theme.dark ? 'dark' : 'light'
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        onContentProcessDidTerminate={() => {
          console.log('WebView process terminated, reloading...');
          setWebViewKey(prev => prev + 1);
        }}
        renderError={(error) => (
          <View style={styles.errorContainer}>
            <Text>Failed to load book: {error}</Text>
            <Button title="Retry" onPress={loadBook} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 