/**
 * Push notification service targeting Expo Push Service
 */
const sendPushNotification = async (expoPushTokens, title, body, data = {}) => {
  if (!expoPushTokens || expoPushTokens.length === 0) return;

  const validTokens = (Array.isArray(expoPushTokens) ? expoPushTokens : [expoPushTokens]).filter(
    (token) => typeof token === 'string' && token.startsWith('ExponentPushToken[')
  );

  if (validTokens.length === 0) return;

  const messages = validTokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'emergency-alerts'
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messages)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[NotificationService] Error sending Expo push notifications:', error);
  }
};

module.exports = {
  sendPushNotification
};
