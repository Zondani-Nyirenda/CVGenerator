import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { CVData, Template } from '../types/cv.types';
import { buildHTMLString } from '../utils/htmlBuilder';

interface CVPreviewProps {
  cvData: CVData;
  template: Template;
}

export default function CVPreview({ cvData, template }: CVPreviewProps) {
  const html = buildHTMLString(cvData, template);

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    minHeight: 600,
  },
  webview: { flex: 1 },
});