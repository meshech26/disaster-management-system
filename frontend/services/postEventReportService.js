import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from './api';
import { API_BASE_URL } from '../config/env';
import { storage } from '../utils/storage';

// `api` already unwraps axios responses to the server's { success, message, data } body,
// so each helper returns `.data` (the payload) directly.
export const postEventReportService = {
  // Step 1: completed warnings (disaster events) that can be audited
  getEvents: async (params = {}) => (await api.get('/post-event-reports/events', { params })).data,

  // Start compiling a report -> { reportId, status }
  generate: async (payload) => (await api.post('/post-event-reports/generate', payload)).data,

  // Poll while compiling -> { status, progress, stages, error, dataQuality }
  getStatus: async (id) => (await api.get(`/post-event-reports/${id}/status`)).data,

  // Full compiled report
  getReport: async (id) => (await api.get(`/post-event-reports/${id}`)).data,

  // Re-computes the SHA-256 seal -> { valid, stored, recomputed }
  verify: async (id) => (await api.get(`/post-event-reports/${id}/verify`)).data,

  archive: async (id) => (await api.patch(`/post-event-reports/${id}/archive`)).data,

  // Downloads the official PDF.
  //  - web:    saves the file through the browser
  //  - mobile: saves to the app folder and opens the share sheet (Save to Files, WhatsApp, Drive...)
  downloadPdf: async (id) => {
    const token = await storage.getItem('auth_token');
    const url = `${API_BASE_URL}/api/post-event-reports/${id}/pdf`;
    const filename = `DMC_Post_Event_Report_${String(id).slice(-6).toUpperCase()}.pdf`;
    const headers = { Authorization: `Bearer ${token}` };

    if (Platform.OS === 'web') {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Download failed (${res.status})`);
      }
      const blobUrl = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return { filename };
    }

    const target = FileSystem.documentDirectory + filename;
    const res = await FileSystem.downloadAsync(url, target, { headers });
    if (res.status !== 200) {
      let message = `Download failed (${res.status})`;
      try { message = JSON.parse(await FileSystem.readAsStringAsync(res.uri)).message || message; } catch (e) { /* keep default */ }
      await FileSystem.deleteAsync(res.uri, { idempotent: true });
      throw new Error(message);
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(res.uri, { mimeType: 'application/pdf', dialogTitle: 'Save or share the report', UTI: 'com.adobe.pdf' });
    }
    return { filename, uri: res.uri };
  }
};
