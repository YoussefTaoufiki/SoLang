import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import { useAppSelector } from '../store/store';
import { useNavigation } from '@react-navigation/native';
import { Chapter } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

type ChapterSelectRouteProp = RouteProp<RootStackParamList, 'ChapterSelect'>;

export default function ChapterSelectScreen({ route }: { route: ChapterSelectRouteProp }) {
  const { bookId } = route.params;
  const theme = useTheme();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const { currentChapter, chapters: reduxChapters } = useAppSelector(state => state.reader);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Load chapters from Redux store
    setChapters(reduxChapters);
  }, [reduxChapters]);

  const handleChapterSelect = (cfi: string) => {
    navigation.navigate('Reader', { 
      bookId,
      jumpToCfi: cfi
    });
  };

  const renderChapterItem = ({ item }: { item: Chapter }) => (
    <TouchableOpacity
      style={[
        styles.chapterItem,
        { borderBottomColor: theme.colors.outline }
      ]}
      onPress={() => handleChapterSelect(item.cfi)}
    >
      <Text
        style={[
          styles.chapterTitle,
          { 
            color: currentChapter === item.cfi ? theme.colors.primary : theme.colors.onSurface,
            fontWeight: currentChapter === item.cfi ? '600' : '400'
          }
        ]}
      >
        {item.title}
      </Text>
      {item.subitems && (
        <FlatList
          data={item.subitems}
          renderItem={renderChapterItem}
          keyExtractor={(subitem) => subitem.id}
          style={styles.subitemsList}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Table of Contents
        </Text>
      </View>
      <FlatList
        data={chapters}
        renderItem={renderChapterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 32,
  },
  chapterItem: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  chapterTitle: {
    fontSize: 16,
  },
  subitemsList: {
    marginLeft: 16,
    marginTop: 8,
  },
}); 