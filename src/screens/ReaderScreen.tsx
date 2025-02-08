import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, FlatList, TextInput, Button, Animated, PanResponder } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import LoadingScreen from './LoadingScreen';
import { useAppDispatch, useAppSelector } from '../store/store';
import { 
  updatePosition, addBookmark, setTotalLocations, setProgress, 
  setCurrentChapter, setTextAlignment, setFontSize, setSelectedText, 
  saveReadingProgress, incrementReadingTime, addAnnotation, 
  setFormattingOption, updateChapterProgress, setCurrentPage, updateAnnotation, 
  updateReadingStats, saveReadingSession, startReadingSession, endReadingSession
} from '../store/readerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import { showMessage } from '../utils/showMessage';
import { Chapter, Annotation } from '../types';
import FontSelector from '@/components/FontSelector';
import LigatureControl from '@/components/LigatureControl';
import TextAlignmentPicker from '@/components/TextAlignmentPicker';
import ParagraphSpacingSlider from '@/components/ParagraphSpacingSlider';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { type ReaderState } from '../store/readerSlice';
import { DeviceEventEmitter } from 'react-native';

declare global {
  interface Window {
    rendition: any;  // Consider proper typing if available
  }
}

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

export default function ReaderScreen({ route }: { route: ReaderScreenRouteProp }) {
  const { bookId } = route.params;
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const {
    textAlign,
    bookmarks,
    currentChapter,
    formatting,
    pageLayout,
    animations,
    position,
    currentBook,
    fontSize,
    progress,
    theme: themeFromSelector,
    currentPage,
    currentSelection,
    annotations
  } = useAppSelector((state) => state.reader) as ReaderState;
  const [webViewKey, setWebViewKey] = useState(0);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation|null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const panelPosition = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) { // Swiping up
          panelPosition.setValue(Math.max(-200, gestureState.dy));
        } else if (gestureState.dy > 0) { // Swiping down
          panelPosition.setValue(Math.min(0, gestureState.dy - 200));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.vy < -0.5 || gestureState.dy < -50) { // Fast swipe up or enough distance
          Animated.spring(panelPosition, {
            toValue: -200,
            useNativeDriver: true,
          }).start(() => setIsPanelVisible(true));
        } else {
          Animated.spring(panelPosition, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => setIsPanelVisible(false));
        }
      },
    })
  );

  const injectCSS = `
    :root {
      --para-spacing: ${formatting.paragraphSpacing}em;
      --line-height: ${formatting.lineHeight};
    }
    
    p {
      margin-bottom: var(--para-spacing);
      line-height: var(--line-height);
      ${formatting.hyphenation ? 'hyphens: auto;' : ''}
    }

    ${formatting.dropCaps ? `
      p:first-child:first-letter {
        float: left;
        font-size: 3em;
        line-height: 1;
        margin: 0 0.1em 0 0;
      }
    ` : ''}

    ${formatting.smartQuotes ? `
      q { quotes: "“" "”" "‘" "’"; }
      .smart-quotes { quotes: "“" "”" "‘" "’"; }
    ` : ''}

    ${formatting.smartDashes ? `
      em-dash: { content: "\\u2014" }
      en-dash: { content: "\\u2013" }
    ` : ''}

    ${formatting.smallCaps ? `
      .small-caps { font-variant: small-caps }
    ` : ''}

    ${formatting.ellipsis ? `
      .ellipsis:after {
        content: "\\u2026";
      }
    ` : ''}

    body {
      margin: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .verse {
      margin-left: 2em;
      font-style: italic;
      line-height: 1.8;
    }

    .footnote {
      font-size: 0.8em;
      vertical-align: super;
    }
    
    h1.chapter-title {
      font-family: serif;
      font-size: 2.5em;
      margin: 1em 0;
      text-align: center;
    }

    .page-number {
      position: fixed;
      bottom: 10px;
      right: 20px;
      font-family: ${formatting.fontFamily};
    }

    ${formatting.smallCaps ? `
      .small-caps {
        font-variant-caps: small-caps;
        font-feature-settings: "smcp";
      }
    ` : ''}

    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
      
      li {
        margin-bottom: 0.5em;
      }
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      
      td, th {
        padding: 0.5em;
        border: 1px solid #ddd;
      }
    }

    .section-break {
      text-align: center;
      margin: 2em 0;
      
      &::after {
        content: "❦";
        font-size: 1.5em;
        color: #666;
      }
    }

    .running-header {
      position: fixed;
      top: 0;
      width: 100%;
      background: white;
      padding: 0.5em;
      border-bottom: 1px solid #ddd;
      font-size: 0.9em;
      
      .chapter-title {
        float: left;
      }
      
      .page-number {
        float: right;
      }
    }

    .section-break::after {
      content: "❦";
      color: ${theme.colors.onSurface};
    }

    @media (max-width: 600px) {
      table { font-size: 0.8em; }
    }
  `;

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data);
    switch(message.type) {
      case 'positionChanged':
        dispatch(updatePosition(message.position));
        if(message.totalLocations) {
          dispatch(setTotalLocations(message.totalLocations));
        }
        const newProgress = message.totalLocations > 0 
          ? (message.locationIndex / message.totalLocations) * 100
          : 0;
        dispatch(setProgress(newProgress));
        break;
      case 'chapterLoaded':
        dispatch(setCurrentChapter(message.title));
        break;
      case 'bookLoaded':
        dispatch(setTotalLocations(message.totalLocations));
        break;
      case 'chaptersLoaded':
        setChapters(message.chapters);
        break;
      case 'textSelected':
        dispatch(setSelectedText({
          cfi: message.cfi,
          text: message.text,
          timestamp: Date.now()
        }));
        break;
      case 'chapterProgress':
        dispatch(updateChapterProgress({
          cfi: message.cfi,
          progress: message.progress
        }));
        break;
      case 'annotationCreated':
        dispatch(addAnnotation({
          cfi: message.cfi,
          text: message.text,
          note: message.note,
          timestamp: Date.now()
        }));
        break;
      case 'footnoteSelected':
        navigation.navigate('FootnoteView', { 
          content: message.content 
        });
        break;
      case 'pageNumber':
        dispatch(setCurrentPage(message.number));
        break;
      case 'wordCount':
        dispatch(updateReadingStats({
          words: message.count,
          pages: 1,
          annotations: 0
        }));
        break;
      case 'loadAnnotations':
        webViewRef.current?.injectJavaScript(`
          (function(annotations) {
            annotations.forEach((anno) => {
              rendition.annotations.add('highlight', anno.cfi, {}, () => {
                const el = document.querySelector(\`[data-cfi="\${anno.cfi}"]\`);
                if(el) el.style.backgroundColor = 'rgba(255,255,0,0.3)';
              });
            });
          })(${JSON.stringify(annotations)});
          true;
        `);
        break;
    }
  }, [dispatch]);

  const navigateChapter = (direction: 'prev' | 'next') => {
    webViewRef.current?.injectJavaScript(`rendition.${direction}()`);
  };

  const saveBookmark = () => {
    if (bookmarks.includes(position)) {
      showMessage({ type: 'warning', message: 'Bookmark already exists' });
    } else {
      dispatch(addBookmark(position));
      showMessage({ type: 'success', message: 'Bookmark saved' });
    }
  };

  const openChapterSelect = () => {
    navigation.navigate('ChapterSelect', { bookId });
  };

  const calculateChapterProgress = (chapterCFI: string) => {
    webViewRef.current?.injectJavaScript(`
      book.locations.percentageFromCfi('${chapterCFI}').then(percent => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'chapterProgress',
          cfi: '${chapterCFI}',
          progress: percent
        }));
      });
      true;
    `);
  };

  const webViewContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.3/epub.min.js"></script>
        <style>${injectCSS}</style>
      </head>
      <body>
        <div class="progress-bar" style="width: ${progress}%"></div>
        <div id="viewer"></div>
        <script>
          let book, rendition;
          
          book = Epub("${bookId}");
          
          book.ready.then(() => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'bookLoaded',
              totalLocations: book.locations.total
            }));

            rendition = book.renderTo("viewer", {
              width: "100%",
              height: "100vh",
              spread: "none",
              manager: "${animations.pageTurn === 'none' ? 'default' : 'continuous'}",
              flow: "${animations.pageTurn === 'curl' ? 'paginated' : 'scrolled'}"
            });

            ${animations.pageTurn !== 'none' ? `
              rendition.on('rendered', (section) => {
                section.addAnimation('page-turn', {
                  'transition': 'all ${animations.speed}ms ease'
                });
              });
            ` : ''}

            rendition.display().then(() => {
              const loc = rendition.currentLocation();
              updateChapterInfo(loc);
            });

            rendition.on("relocated", (loc) => {
              const cfi = loc.start.cfi;
              const locationIndex = book.locations.indexOf(cfi);
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'positionChanged',
                position: cfi,
                locationIndex: locationIndex,
                totalLocations: book.locations.total
              }));
              
              updateChapterInfo(loc);
            });

            rendition.on("selected", (cfiRange, contents) => {
              const range = contents.range(cfiRange);
              const text = range.toString();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'textSelected',
                cfi: cfiRange,
                text: text
              }));
            });

            book.loaded.navigation.then((nav) => {
              const processItems = (items) => {
                return items.map(item => ({
                  id: item.id,
                  title: item.label,
                  cfi: item.cfi,
                  subitems: item.subitems ? processItems(item.subitems) : undefined
                }));
              };
              
              const chapters = processItems(nav.toc);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'chaptersLoaded',
                chapters: chapters
              }));

              const analyzeStructure = (items) => {
                return items.map(item => ({
                  id: item.id,
                  title: item.label,
                  cfi: item.cfi,
                  subitems: item.subitems ? analyzeStructure(item.subitems) : [],
                  wordCount: 0 // Will be populated later
                }));
              };
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'bookStructure',
                structure: analyzeStructure(nav.toc)
              }));

              const chapter = nav.get(loc.start.href);
              if (chapter) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'chapterInfo',
                  ...chapter
                }));
              }
            });

            rendition.hooks.content.register((contents) => {
              if(${formatting.smartQuotes}) {
                contents.document.body.classList.add('smart-quotes');
              }
            });

            rendition.on('rendered', (section) => {
              const currentPage = section.metadata.currentPage;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'pageNumber',
                number: currentPage
              }));
            });
          });

          function updateChapterInfo(loc) {
            book.loaded.navigation.then((nav) => {
              const chapter = nav.get(loc.start.href);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'chapterLoaded',
                title: chapter?.label || 'Unknown Chapter'
              }));
            });
          }
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    dispatch(startReadingSession());
    
    const interval = setInterval(() => {
      webViewRef.current?.injectJavaScript(`
        const words = document.body.innerText.match(/\\w+/g)?.length || 0;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "wordCount",
          count: words
        }));
        true;
      `);
    }, 30000);

    return () => {
      dispatch(endReadingSession());
      clearInterval(interval);
      DeviceEventEmitter.removeAllListeners('memoryWarning');
    };
  }, []);

  useEffect(() => {
    return () => {
      if (currentBook) {
        dispatch(saveReadingProgress({
          bookId: currentBook!,
          position,
          progress,
          lastRead: Date.now()
        }));
      }
    };
  }, [position, progress, currentBook]);

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch(incrementReadingTime(300));
    }, 300000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Chapters not being loaded from store/webview
  }, []);

  useEffect(() => {
    if (route.params?.jumpToCfi) {
      webViewRef.current?.injectJavaScript(`
        rendition.display("${route.params.jumpToCfi}");
        true;
      `);
    }
  }, [route.params]);

  useEffect(() => {
    const startTime = Date.now();
    let wordsRead = 0;
    
    const progressListener = (position: number) => {
      const timeSpent = (Date.now() - startTime) / 1000; // in seconds
      const readingSpeed = wordsRead / (timeSpent / 60); // words per minute
      
      dispatch(updateReadingStats({
        words: wordsRead,
        pages: Math.floor(wordsRead / 300), // Estimate pages based on avg 300 words/page
        annotations: annotations.length // Add annotation count
      }));
    };

    // Calculate words from text selection
    const textListener = (text: string) => {
      wordsRead += text.split(/\s+/).length;
    };

    // Cleanup
    return () => {
      dispatch(saveReadingSession({
        startTime,
        endTime: Date.now(),
        totalWords: wordsRead
      }));
    };
  }, []);

  const TypographyControls = () => (
    <View style={styles.typographyRow}>
      <FontSelector />
      <LigatureControl />
      <TextAlignmentPicker />
      <ParagraphSpacingSlider />
      <ThemeSwitcher />
    </View>
  );

  const toggleFormattingOption = <K extends keyof ReaderState['formatting']>(
    option: K,
    value: ReaderState['formatting'][K]
  ) => {
    dispatch(setFormattingOption({ option, value } as { 
      option: K; 
      value: ReaderState['formatting'][K] 
    }));
  };

  const jumpToChapter = (cfi: string) => {
    webViewRef.current?.injectJavaScript(`
      rendition.display("${cfi}");
      true;
    `);
  };

  const createAnnotation = () => {
    dispatch(addAnnotation({ 
      cfi: position, 
      text: 'Selected text',
      note: '',
      timestamp: Date.now()
    }));
  };

  const renderChapterModal = () => (
    <Modal visible={showChapters}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Table of Contents</Text>
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.cfi}
          renderItem={({item}) => (
            <TouchableOpacity 
              style={styles.chapterItem}
              onPress={() => {
                jumpToChapter(item.cfi);
                setShowChapters(false);
              }}
            >
              <Text style={styles.chapterTitleText}>{item.title}</Text>
              <Text style={styles.chapterProgress}>
                {Math.round(item.progress || 0)}%
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      </View>
    </Modal>
  );

  const AnnotationModal = () => (
    <Modal visible={!!selectedAnnotation}>
      <View style={styles.annotationModal}>
        <TextInput
          value={selectedAnnotation?.note}
          onChangeText={(text) => setSelectedAnnotation(prev => 
            prev ? {...prev, note: text} : null
          )}
          multiline
        />
        <Button 
          title="Save" 
          onPress={() => {
            dispatch(updateAnnotation(selectedAnnotation!));
            setSelectedAnnotation(null);
          }}
        />
      </View>
    </Modal>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    webview: {
      flex: 1,
    },
    controls: {
      position: 'absolute',
      bottom: 20,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    chapterTitle: {
      fontSize: 16,
      maxWidth: '70%',
    },
    progressText: {
      fontSize: 14,
    },
    settingsRow: {
      flexDirection: 'row',
      gap: 16,
      paddingBottom: 8,
    },
    navigationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    typographyRow: {
      flexDirection: 'row',
      gap: 16,
      paddingBottom: 8,
    },
    modalContainer: {
      padding: 20,
      backgroundColor: 'white',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
    },
    chapterItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
    },
    chapterTitleText: {
      flex: 1,
      marginRight: 10,
    },
    chapterProgress: {
      color: '#666',
    },
    divider: {
      height: 1,
      backgroundColor: '#eee',
    },
    annotationModal: {
      flex: 1,
      padding: 20,
      backgroundColor: 'white',
    },
    pageNumber: {
      position: 'absolute',
      top: 10,
      right: 20,
      fontSize: 14,
      color: '#666',
    },
    sectionBreak: {
      marginVertical: 20,
      alignItems: 'center',
    },
    panelContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      elevation: 4,
    },
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.outline,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 12,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
  });

  const handleAddAnnotation = (color: string, note: string = '') => {
    if (currentSelection) {
      dispatch(addAnnotation({
        ...currentSelection,
        color,
        note,
        timestamp: Date.now(),
        createdAt: Date.now()
      }));
      
      webViewRef.current?.injectJavaScript(`
        window.rendition.annotations.add('highlight', '${currentSelection.cfi}', {}, () => {
          const el = document.querySelector(\`[data-cfi="${currentSelection.cfi}"]\`);
          if(el) el.style.backgroundColor = 'rgba(255,255,0,0.3)';
        });
        true;
      `);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={openChapterSelect}>
          <Icon name="menu-book" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.chapterTitle, { color: theme.colors.onSurface }]}>
          {currentChapter || 'Loading...'}
        </Text>
        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
          {Math.round(progress)}%
        </Text>
        <Text style={styles.pageNumber}>
          Page {currentPage}
        </Text>
      </View>

      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ html: webViewContent }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
      />

      {isPanelVisible && (
        <TouchableOpacity 
          style={styles.overlay}
          onPress={() => {
            Animated.spring(panelPosition, {
              toValue: 0,
              useNativeDriver: true,
            }).start(() => setIsPanelVisible(false));
          }}
        />
      )}

      <Animated.View
        style={[
          styles.panelContainer,
          {
            transform: [{ translateY: panelPosition }],
          },
        ]}
        {...panResponder.current.panHandlers}
      >
        <View style={styles.dragHandle} />
        <TypographyControls />
      </Animated.View>

      <View style={[styles.controls, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.settingsRow}>
          <TouchableOpacity onPress={() => dispatch(setTextAlignment(
            textAlign === 'left' ? 'justify' : 'left'
          ))}>
            <Icon 
              name="format-align-left" 
              size={24} 
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => dispatch(setFontSize(Math.max(12, fontSize - 1)))}>
            <Icon name="text-decrease" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => dispatch(setFontSize(Math.min(24, fontSize + 1)))}>
            <Icon name="text-increase" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => dispatch(setFormattingOption({
            option: 'ligatures',
            value: !formatting.ligatures
          }))}>
            <Icon 
              name="format-letter-matches" 
              size={24} 
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => dispatch(setFormattingOption({
            option: 'smartQuotes', 
            value: !formatting.smartQuotes
          }))}>
            <Icon 
              name="format-quote-close" 
              size={24} 
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.navigationRow}>
          <TouchableOpacity onPress={() => navigateChapter('prev')}>
            <Icon name="chevron-left" size={32} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={saveBookmark}>
            <Icon 
              name={bookmarks.includes(position) ? 'bookmark' : 'bookmark-outline'} 
              size={32} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateChapter('next')}>
            <Icon name="chevron-right" size={32} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={createAnnotation}>
          <Icon name="comment-text" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {renderChapterModal()}

      <AnnotationModal />
    </View>
  );
} 