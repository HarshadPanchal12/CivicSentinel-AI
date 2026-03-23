import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useMutation } from 'convex/react';

// Tell Expo how to handle notifications when app is open
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false, // <-- set false based on Claude's tip
        shouldSetBadge: false,
    }),
});

export const usePushToken = (userId: string) => {
    const [token, setToken] = useState<string | null>(null);
    const [notif, setNotif] = useState<any>(null);
    const notifListener = useRef<any>();
    const responseListener = useRef<any>();

    // Convex mutation to save token
    const saveToken = useMutation('notifications:savePushToken' as any);

    useEffect(() => {
        let isMounted = true;

        registerForPushNotificationsAsync().then(async (t) => {
            if (!t || !isMounted) return;
            setToken(t);
            // Save to Convex so web can look it up
            try {
                await saveToken({ userId, pushToken: t, platform: Platform.OS });
            } catch (e) {
                console.warn('[CivicSentinel] Failed to save push token:', e);
            }
        });

        // Listener: notification received while app is open
        notifListener.current = Notifications.addNotificationReceivedListener(n => {
            if (isMounted) setNotif(n);
        });

        // Listener: user tapped notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
            if (!isMounted) return;
            const data = r?.notification?.request?.content?.data ?? {};
            console.log('[CivicSentinel] Notification tapped:', data);
        });

        return () => {
            isMounted = false;
            notifListener.current?.remove?.();
            responseListener.current?.remove?.();
        };
    }, [userId]);

    return { token, lastNotification: notif };
};

async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
        console.warn('[CivicSentinel] Push notifications only work on physical devices.');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[CivicSentinel] Push notification permission denied.');
        return null;
    }

    // Get Expo push token
    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        );
        return tokenData.data; // looks like: ExponentPushToken[xxxxxx]
    } catch (e) {
        console.error('[CivicSentinel] Failed to get push token:', e);
        return null;
    }
}
