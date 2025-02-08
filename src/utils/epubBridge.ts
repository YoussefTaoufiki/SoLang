import { WebViewMessageEvent } from 'react-native-webview';
import { Annotation } from '../types';

export type EPUBMessage = {
  type: 'positionChanged' | 'chapterLoaded' | 'bookLoaded' | 'textSelected' | 'error' | 'contextMenuRequested' | 'saveAnnotations' | 'loadAnnotations';
  payload: any;
};

export const createMessageHandler = (handlers: {
  onPositionChanged?: (cfi: string, progress: number) => void;
  onChapterLoaded?: (chapter: { title: string; href: string }) => void;
  onBookLoaded?: (book: { title: string; author: string; totalLocations: number }) => void;
  onTextSelected?: (cfi: string, text: string) => void;
  onError?: (error: string) => void;
  onContextMenuRequested?: (position: { x: number; y: number }) => void;
  onAnnotationCreated?: (annotation: Annotation) => void;
  onSaveAnnotations?: (annotations: Annotation[]) => void;
  onLoadAnnotations?: () => void;
}) => {
  return (event: WebViewMessageEvent) => {
    try {
      const message: EPUBMessage = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'positionChanged':
          handlers.onPositionChanged?.(
            message.payload.cfi,
            message.payload.progress
          );
          break;
        case 'chapterLoaded':
          handlers.onChapterLoaded?.(message.payload);
          break;
        case 'bookLoaded':
          handlers.onBookLoaded?.(message.payload);
          break;
        case 'textSelected':
          handlers.onTextSelected?.(
            message.payload.cfi,
            message.payload.text
          );
          break;
        case 'error':
          handlers.onError?.(message.payload);
          break;
        case 'contextMenuRequested':
          handlers.onContextMenuRequested?.(message.payload);
          break;
        case 'saveAnnotations':
          handlers.onSaveAnnotations?.(message.payload);
          break;
        case 'loadAnnotations':
          handlers.onLoadAnnotations?.();
          break;
      }
    } catch (error) {
      console.error('Error processing EPUB message:', error);
      handlers.onError?.('Failed to process reader message');
    }
  };
}; 