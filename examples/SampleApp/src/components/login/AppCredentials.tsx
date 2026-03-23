/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  useColorScheme,
  Platform,
  StatusBar,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  BackHandler,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CometChatUIKit,
  UIKitSettings,
  useCometChatTranslation,
  useTheme,
} from '@cometchat/chat-uikit-react-native';
import { navigate, navigationRef } from '../../navigation/NavigationService';
import { SCREEN_CONSTANTS } from '../../utils/AppConstants';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

const AppCredentials: React.FC = () => {
  const [storedAppId, setStoredAppId] = useState<string>('');
  const [storedAuthKey, setStoredAuthKey] = useState<string>('');
  const [storedRegion, setStoredRegion] = useState<string>('US');

  // These are the *editable* states bound to the TextInput fields
  const [appId, setAppId] = useState<string>('1676766e5e427d684');
  const [authKey, setAuthKey] = useState<string>('cf2147f36f54d5af4dccf7ce1981fe1146b15410');
  const [selectedRegion, setSelectedRegion] = useState<string>('IN');

  // Toast state for showing error messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const { width } = Dimensions.get('window');
  const mode = useColorScheme();

  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight(); // returns 0 if no header
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const [keyboardBehavior, setKeyboardBehavior] = useState<
    'padding' | 'height' | undefined
  >(Platform.OS === 'ios' ? 'padding' : 'height');

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardBehavior(Platform.OS === 'ios' ? 'padding' : 'height');
    });

    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardBehavior(undefined); // Remove behavior when keyboard hides
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);
  // For iOS use insets.top (not status bar) + header height
  const keyboardVerticalOffset = useMemo(() => {
  return Platform.OS === 'ios'
    ? (insets.top || 0) + (headerHeight || 0)
    : (statusBarHeight || 0) + (headerHeight || 0);
}, [insets.top, headerHeight, statusBarHeight]);

  // Compute if form is valid (all fields provided)
  const isFormValid =
    appId.trim().length > 0 &&
    authKey.trim().length > 0 &&
    selectedRegion.trim().length > 0;

  // Load existing credentials if any
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigationRef.goBack();
        return true; // Prevent default behavior
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      async function loadCredentials() {
        try {
          const credentialsStr = await AsyncStorage.getItem('appCredentials');
          if (credentialsStr) {
            const credentials = JSON.parse(credentialsStr);
            // Update 'stored' states
            setStoredAppId(credentials.appId || '');
            setStoredAuthKey(credentials.authKey || '');
            setStoredRegion(credentials.region || 'US');

            // Also set the fields so user sees them pre-populated
            setAppId(credentials.appId || '');
            setAuthKey(credentials.authKey || '');
            setSelectedRegion(credentials.region || 'US');
          }
        } catch (error) {
          console.log('Error loading stored credentials:', error);
        }
      }

      loadCredentials();

      return () => backHandler.remove();
    }, []),
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleContinue = async (): Promise<void> => {
    // Validate the inputs.
    // If the user has modified a field and cleared it (i.e. the input becomes empty),
    // show a toast message.
    if (!appId.trim()) {
      showToast('Please enter App ID');
      return;
    }
    if (!authKey.trim()) {
      showToast('Please enter Auth Key');
      return;
    }
    if (!selectedRegion.trim()) {
      showToast('Please select a region');
      return;
    }

    // Since all fields are non-empty, use their current values.
    const newAppId = appId.trim();
    const newAuthKey = authKey.trim();
    const newRegion = selectedRegion.trim();

    try {
      const credentials = {
        region: newRegion,
        appId: newAppId,
        authKey: newAuthKey,
      };
      console.log('Saving credentials:', credentials);
      await AsyncStorage.setItem('appCredentials', JSON.stringify(credentials));

      // Re-initialize with updated credentials
      await CometChatUIKit.init({
        appId: newAppId,
        authKey: newAuthKey,
        region: newRegion,
        subscriptionType: CometChat.AppSettings
          .SUBSCRIPTION_TYPE_ALL_USERS as UIKitSettings['subscriptionType'],
      });
    } catch (error) {
      console.error('Failed to save credentials', error);
    }

    // Navigate to the next screen.
    navigate('BottomTabNavigator');
    navigationRef.reset({
      index: 0,
      routes: [{ name: SCREEN_CONSTANTS.SAMPLE_USER }],
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.color.background2}]}
    >
        <View style={styles.contentContainer}>
          <Text
            style={[
              theme.typography.heading2.bold,
              {
                color: theme.color.textPrimary,
                marginBottom: 20,
                alignSelf: 'center',
              },
            ]}
          >
            {t('Welcome to Nks Chat App !')}
          </Text>
           <Text
            style={[
              theme.typography.heading2.bold,
              {
                color: theme.color.textPrimary,
                marginTop: 10,
                marginBottom: 20,
                alignSelf: 'center',
              },
            ]}
          >
            {('Hit continue to proceed')}
          </Text>

          
          {/* Continue Button */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                {
                  backgroundColor: theme.color.primaryButtonBackground,
                  opacity: isFormValid ? 1 : 0.6,
                },
              ]}
              onPress={handleContinue}
            >
              <Text
                style={[
                  theme.typography.button.medium,
                  { textAlign: 'center', color: theme.color.staticWhite },
                ]}
              >
                {t('CONTINUE')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      {/* Toast Message */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
};

export default AppCredentials;

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 30 : 50,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginTop: 20,
  },
  regionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flagContainer: {
    width: '32%',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 5,
  },
  flagImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  continueButton: {
    borderRadius: 8,
    paddingVertical: 12,
    width: '100%',
  },
  toastContainer: {
    position: 'absolute',
    bottom: '8%',
    left: 20,
    right: 20,
    backgroundColor: '#C73C3E',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center'
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  buttonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
});
