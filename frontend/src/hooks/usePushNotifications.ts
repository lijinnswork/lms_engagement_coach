import { useState, useEffect } from 'react';

// VAPID Public Key - in production, this should come from env
const PUBLIC_VAPID_KEY = "BDbZqB-M-T6sR7M8hA6iHnB5s6rD9Zq8G8c-Q_H8CqP1T5vW-k9D7X4L3K5P3E4z7R4Y6D2F9H1B3C5T4D"; // Dummy mock key for now

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  };

  const subscribe = async () => {
    if (!isSupported) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
      setSubscription(sub);
      
      // Send subscription to backend
      fetch('/api/notifications/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // assuming auth flow
        },
        body: JSON.stringify({ subscription_json: sub })
      });
      
      return true;
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
      return false;
    }
  };

  return {
    isSupported,
    subscription,
    subscribe
  };
}
