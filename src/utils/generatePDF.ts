import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function exportPDF(htmlString: string, fileName: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html: htmlString,
    base64: false,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Share ${fileName}.pdf`,
    UTI: 'com.adobe.pdf',
  });
}