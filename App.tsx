import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from 'react-native';
import { dataRepository } from './src/dataRepository';
import { getStoredValue, setStoredValue } from './src/storage';
import { categoryLabels, QuoteCategory, QuoteOrVerse } from './src/types';

const preferenceKey = 'preferredCategories';
const legacyPreferenceKey = 'preferredCategory';
const widgetColorThemeKey = 'widgetColorTheme';
const legacyWidgetStyleKey = 'widgetStyle';
const widgetVisualStyleKey = 'widgetVisualStyle';
const widgetPreviewSizeKey = 'widgetPreviewSize';
const onboardingKey = 'isOnboardingCompleted:v3';
const categories: QuoteCategory[] = ['Meditation', 'Bible', 'Quote'];
const appDisplayName = 'Daily Focus';
const appFontFamily = 'Quicksand';
type WidgetColorTheme = 'dawn' | 'sage' | 'night' | 'lavender' | 'candle';
type WidgetVisualStyle = 'calm' | 'iphone' | 'nature';
type WidgetPreviewSize = 'home' | 'lock';
type WidgetPatternIndex = 0 | 1 | 2 | 3 | 4;

const defaultText = Text as unknown as { defaultProps?: { style?: TextStyle | TextStyle[] } };
defaultText.defaultProps = {
  ...(defaultText.defaultProps ?? {}),
  style: [{ fontFamily: appFontFamily }, defaultText.defaultProps?.style].filter(Boolean) as TextStyle[],
};

const widgetColorThemes: Record<WidgetColorTheme, {
  label: string;
  background: string;
  foreground: string;
  accent: string;
  glow: string;
}> = {
  dawn: {
    label: 'Dawn',
    background: '#FFF8EC',
    foreground: '#2A2119',
    accent: '#C9A86A',
    glow: '#F4DFB0',
  },
  sage: {
    label: 'Sage',
    background: '#EDF4ED',
    foreground: '#17221B',
    accent: '#6F7F68',
    glow: '#CFE0CA',
  },
  night: {
    label: 'Still Night',
    background: '#20252A',
    foreground: '#F8F1E7',
    accent: '#9C8EC2',
    glow: '#3B334E',
  },
  lavender: {
    label: 'Lavender',
    background: '#F3EFF8',
    foreground: '#241E2D',
    accent: '#8C7AA9',
    glow: '#DDD3EC',
  },
  candle: {
    label: 'Candle',
    background: '#FFF3E2',
    foreground: '#2C2117',
    accent: '#B88952',
    glow: '#F4D1A5',
  },
};

const widgetVisualStyles: Record<WidgetVisualStyle, { label: string; description: string }> = {
  calm: {
    label: 'Calm',
    description: 'Centered, quiet, and spacious.',
  },
  iphone: {
    label: 'Futuristic',
    description: 'Glass panels, rails, and layered system motion.',
  },
  nature: {
    label: 'Nature',
    description: 'Organic motion with softer placement.',
  },
};

const widgetPreviewSizeLabels: Record<WidgetPreviewSize, string> = {
  home: 'Home Screen',
  lock: 'Lock Screen',
};

const introStorySlides: Array<{ title: string; copy: string; category: QuoteCategory }> = [
  {
    title: 'Welcome',
    copy: 'A quiet daily pause for listening, reflection, and return.',
    category: 'Meditation',
  },
  {
    title: 'Meditation',
    copy: 'Gentle prompts for breath, calm, and a steadier inner pace.',
    category: 'Meditation',
  },
  {
    title: 'Bible Verse',
    copy: 'A daily verse with space for prayer, comfort, and focus.',
    category: 'Bible',
  },
  {
    title: 'Daily Quotes',
    copy: 'Short words for clarity when the day starts to feel crowded.',
    category: 'Quote',
  },
  {
    title: 'Widget',
    copy: 'Keep today close on your Home Screen or Lock Screen.',
    category: 'Quote',
  },
  {
    title: 'Fully Customizable',
    copy: 'Choose your focus, color theme, widget style, and layout.',
    category: 'Bible',
  },
];

const categoryThemes: Record<QuoteCategory, {
  background: string;
  panel: string;
  accent: string;
  accentSoft: string;
  ink: string;
  muted: string;
  hairline: string;
}> = {
  Meditation: {
    background: '#EEF4EF',
    panel: '#FFFFFF',
    accent: '#31473A',
    accentSoft: '#DCE9DF',
    ink: '#17221B',
    muted: '#5C6A61',
    hairline: '#D7E0D9',
  },
  Bible: {
    background: '#F5F0E7',
    panel: '#FFFFFF',
    accent: '#5B4A33',
    accentSoft: '#E9DDC8',
    ink: '#241D14',
    muted: '#706351',
    hairline: '#E1D5C4',
  },
  Quote: {
    background: '#EEF4F7',
    panel: '#FFFFFF',
    accent: '#30475B',
    accentSoft: '#DCEAF0',
    ink: '#17232D',
    muted: '#566875',
    hairline: '#D5E1E7',
  },
};

const categoryHeroImages: Record<QuoteCategory, number> = {
  Meditation: require('./assets/images/intro-meditation.jpg'),
  Bible: require('./assets/images/intro-bible.jpg'),
  Quote: require('./assets/images/intro-quote.jpg'),
};

const categoryIconImages: Record<QuoteCategory, number> = {
  Meditation: require('./assets/images/category-icons/meditation.png'),
  Bible: require('./assets/images/category-icons/bible-verses.png'),
  Quote: require('./assets/images/category-icons/daily-quotes.png'),
};

const widgetMotionAssets: Record<WidgetVisualStyle, Record<QuoteCategory, number>> = {
  calm: {
    Meditation: require('./assets/images/generated-visuals/calm-meditation.jpg'),
    Bible: require('./assets/images/generated-visuals/calm-bible.jpg'),
    Quote: require('./assets/images/generated-visuals/calm-quote.jpg'),
  },
  iphone: {
    Meditation: require('./assets/images/generated-visuals/iphone-meditation.jpg'),
    Bible: require('./assets/images/generated-visuals/iphone-bible.jpg'),
    Quote: require('./assets/images/generated-visuals/iphone-quote.jpg'),
  },
  nature: {
    Meditation: require('./assets/images/generated-visuals/nature-meditation.jpg'),
    Bible: require('./assets/images/generated-visuals/nature-bible.jpg'),
    Quote: require('./assets/images/generated-visuals/nature-quote.jpg'),
  },
};

type CategoryTheme = (typeof categoryThemes)[QuoteCategory];
type WidgetColorThemeConfig = (typeof widgetColorThemes)[WidgetColorTheme];

type PlaybackState = {
  isPlaying: boolean;
  bgMusicTrack: string;
  voiceoverTrack: string;
  selection?: QuoteOrVerse;
};

function getWidgetPatternIndex(seed: number): WidgetPatternIndex {
  return Math.abs(seed % 5) as WidgetPatternIndex;
}

function getRandomPreviewSelection(selectedCategories: QuoteCategory[]): QuoteOrVerse | undefined {
  const enabledCategories = selectedCategories.filter((category) => dataRepository.getByCategory(category).length > 0);
  const previewCategories = enabledCategories.length > 0 ? enabledCategories : ['Meditation' as QuoteCategory];
  const previewPool = previewCategories.flatMap((category) => dataRepository.getByCategory(category));

  if (previewPool.length === 0) {
    return undefined;
  }

  return previewPool[Math.floor(Math.random() * previewPool.length)];
}

function WidgetMotionLayer({
  colorTheme,
  visualStyle,
  category,
  patternIndex,
  reduceMotion = false,
}: {
  colorTheme: WidgetColorTheme;
  visualStyle: WidgetVisualStyle;
  category: QuoteCategory;
  patternIndex: WidgetPatternIndex;
  reduceMotion?: boolean;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const option = widgetColorThemes[colorTheme];
  const categoryTheme = categoryThemes[category];

  useEffect(() => {
    if (reduceMotion) {
      drift.setValue(0.45);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: visualStyle === 'iphone' ? 2600 : 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: visualStyle === 'iphone' ? 2600 : 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift, reduceMotion, visualStyle]);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [8, -10] });
  const scale = drift.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] });
  const assetOpacity = drift.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.32] });
  const assetTranslateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: visualStyle === 'iphone' ? [-38, 26] : [-12, 12],
  });
  const assetTranslateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: visualStyle === 'nature' ? [8, -6] : [5, -8],
  });
  const assetRotate = drift.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const patternShift = drift.interpolate({
    inputRange: [0, 1],
    outputRange: patternIndex % 2 === 0 ? [-10, 10] : [10, -10],
  });
  const patternLift = drift.interpolate({
    inputRange: [0, 1],
    outputRange: patternIndex > 2 ? [-7, 7] : [7, -7],
  });
  const motionAssetTransform = visualStyle === 'iphone'
    ? [{ translateX: assetTranslateX }, { rotate: '-10deg' }, { scale }]
    : visualStyle === 'nature'
      ? [{ translateY: assetTranslateY }, { scale }]
      : [{ translateX: assetTranslateX }, { translateY: assetTranslateY }, { rotate: assetRotate }, { scale }];

  return (
    <View pointerEvents="none" style={styles.widgetMotionLayer}>
      <Animated.Image
        resizeMode="cover"
        source={widgetMotionAssets[visualStyle][category]}
        style={[
          styles.widgetMotionAsset,
          visualStyle === 'calm' && styles.widgetMotionAssetCalm,
          visualStyle === 'iphone' && styles.widgetMotionAssetIphone,
          visualStyle === 'nature' && styles.widgetMotionAssetNature,
          {
            opacity: assetOpacity,
            transform: motionAssetTransform,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.widgetGlow,
          {
            backgroundColor: option.glow,
            transform: [{ translateX }, { translateY }, { scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.widgetFlowLine,
          visualStyle === 'iphone' && styles.widgetFlowLineIphone,
          { backgroundColor: option.accent, transform: [{ translateX }] },
        ]}
      />
      <Animated.View
        style={[
          styles.widgetFlowLine,
          styles.widgetFlowLineSecond,
          { backgroundColor: categoryTheme.accent, transform: [{ translateX: translateY }] },
        ]}
      />
      {visualStyle === 'nature' ? (
        <Animated.View style={[styles.widgetHorizon, { backgroundColor: categoryTheme.accentSoft, transform: [{ translateY }] }]} />
      ) : null}
      <WidgetPatternPieces
        accentColor={option.accent}
        glowColor={option.glow}
        patternIndex={patternIndex}
        shift={patternShift}
        softColor={categoryTheme.accentSoft}
        styleName={visualStyle}
        lift={patternLift}
      />
    </View>
  );
}

function WidgetPatternPieces({
  accentColor,
  glowColor,
  lift,
  patternIndex,
  shift,
  softColor,
  styleName,
}: {
  accentColor: string;
  glowColor: string;
  lift: Animated.AnimatedInterpolation<string | number>;
  patternIndex: WidgetPatternIndex;
  shift: Animated.AnimatedInterpolation<string | number>;
  softColor: string;
  styleName: WidgetVisualStyle;
}) {
  if (styleName === 'iphone') {
    return (
      <>
        <Animated.View
          style={[
            styles.patternGlassPane,
            iphonePatternPaneStyles[patternIndex],
            { backgroundColor: glowColor, transform: [{ translateX: shift }, { translateY: lift }] },
          ]}
        />
        <Animated.View
          style={[
            styles.patternGlassLine,
            iphonePatternLineStyles[patternIndex],
            { backgroundColor: accentColor, transform: [{ translateX: shift }] },
          ]}
        />
        {patternIndex === 3 || patternIndex === 4 ? (
          <Animated.View
            style={[
              styles.patternGlassDotGrid,
              { borderColor: softColor, transform: [{ translateY: lift }] },
            ]}
          />
        ) : null}
      </>
    );
  }

  if (styleName === 'nature') {
    return (
      <>
        <Animated.View
          style={[
            styles.patternNatureArc,
            naturePatternArcStyles[patternIndex],
            { borderColor: accentColor, transform: [{ translateX: shift }, { translateY: lift }] },
          ]}
        />
        <Animated.View
          style={[
            styles.patternNatureLeaf,
            naturePatternLeafStyles[patternIndex],
            { backgroundColor: softColor, transform: [{ translateY: lift }, { rotate: patternIndex % 2 === 0 ? '-18deg' : '18deg' }] },
          ]}
        />
        <Animated.View
          style={[
            styles.patternNatureTrail,
            naturePatternTrailStyles[patternIndex],
            { backgroundColor: glowColor, transform: [{ translateX: shift }] },
          ]}
        />
      </>
    );
  }

  return (
    <>
      <Animated.View
        style={[
          styles.patternCalmRing,
          calmPatternRingStyles[patternIndex],
          { borderColor: softColor, transform: [{ translateX: shift }, { translateY: lift }] },
        ]}
      />
      <Animated.View
        style={[
          styles.patternCalmLine,
          calmPatternLineStyles[patternIndex],
          { backgroundColor: accentColor, transform: [{ translateX: shift }] },
        ]}
      />
      <Animated.View
        style={[
          styles.patternCalmDot,
          calmPatternDotStyles[patternIndex],
          { backgroundColor: glowColor, transform: [{ translateY: lift }] },
        ]}
      />
    </>
  );
}

function useStoredAppState() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [preferredCategories, setPreferredCategoriesState] = useState<QuoteCategory[]>(['Meditation']);
  const [widgetColorTheme, setWidgetColorThemeState] = useState<WidgetColorTheme>('dawn');
  const [widgetVisualStyle, setWidgetVisualStyleState] = useState<WidgetVisualStyle>('calm');
  const [widgetPreviewSize, setWidgetPreviewSizeState] = useState<WidgetPreviewSize>('home');
  const [isOnboardingCompleted, setOnboardingCompletedState] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const [storedPreference, storedOnboarding] = await Promise.all([
          getStoredValue(preferenceKey),
          getStoredValue(onboardingKey),
        ]);
        const legacyPreference = await getStoredValue(legacyPreferenceKey);
        const storedWidgetColorTheme = await getStoredValue(widgetColorThemeKey);
        const legacyWidgetStyle = await getStoredValue(legacyWidgetStyleKey);
        const storedWidgetVisualStyle = await getStoredValue(widgetVisualStyleKey);
        const storedWidgetPreviewSize = await getStoredValue(widgetPreviewSizeKey);

        if (!isMounted) {
          return;
        }

        if (storedPreference) {
          try {
            const parsed = JSON.parse(storedPreference) as QuoteCategory[];
            const validCategories = parsed.filter((category) => categories.includes(category));
            if (validCategories.length > 0) {
              setPreferredCategoriesState(validCategories);
            }
          } catch {
            if (categories.includes(storedPreference as QuoteCategory)) {
              setPreferredCategoriesState([storedPreference as QuoteCategory]);
            }
          }
        } else if (categories.includes(legacyPreference as QuoteCategory)) {
          setPreferredCategoriesState([legacyPreference as QuoteCategory]);
        }

        const colorTheme = storedWidgetColorTheme ?? legacyWidgetStyle;
        if (colorTheme && Object.keys(widgetColorThemes).includes(colorTheme)) {
          setWidgetColorThemeState(colorTheme as WidgetColorTheme);
        }

        if (storedWidgetVisualStyle && Object.keys(widgetVisualStyles).includes(storedWidgetVisualStyle)) {
          setWidgetVisualStyleState(storedWidgetVisualStyle as WidgetVisualStyle);
        }

        if (storedWidgetPreviewSize && Object.keys(widgetPreviewSizeLabels).includes(storedWidgetPreviewSize)) {
          setWidgetPreviewSizeState(storedWidgetPreviewSize as WidgetPreviewSize);
        }

        setOnboardingCompletedState(storedOnboarding === 'true');
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const setPreferredCategories = useCallback(async (nextCategories: QuoteCategory[]) => {
    const uniqueCategories = nextCategories.filter((category, index) => (
      categories.includes(category) && nextCategories.indexOf(category) === index
    ));
    const safeCategories = uniqueCategories.length > 0 ? uniqueCategories : ['Meditation' as QuoteCategory];
    setPreferredCategoriesState(safeCategories);
    await setStoredValue(preferenceKey, JSON.stringify(safeCategories));
  }, []);

  const setOnboardingCompleted = useCallback(async (value: boolean) => {
    setOnboardingCompletedState(value);
    await setStoredValue(onboardingKey, String(value));
  }, []);

  const setWidgetColorTheme = useCallback(async (style: WidgetColorTheme) => {
    setWidgetColorThemeState(style);
    await setStoredValue(widgetColorThemeKey, style);
  }, []);

  const setWidgetVisualStyle = useCallback(async (style: WidgetVisualStyle) => {
    setWidgetVisualStyleState(style);
    await setStoredValue(widgetVisualStyleKey, style);
  }, []);

  const setWidgetPreviewSize = useCallback(async (size: WidgetPreviewSize) => {
    setWidgetPreviewSizeState(size);
    await setStoredValue(widgetPreviewSizeKey, size);
  }, []);

  return {
    isHydrated,
    preferredCategories,
    setPreferredCategories,
    widgetColorTheme,
    setWidgetColorTheme,
    widgetVisualStyle,
    setWidgetVisualStyle,
    widgetPreviewSize,
    setWidgetPreviewSize,
    isOnboardingCompleted,
    setOnboardingCompleted,
  };
}

function useReducedMotionPreference() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isMounted) {
        setReduceMotion(isEnabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    [appFontFamily]: require('./assets/fonts/Quicksand.ttf'),
  });
  const {
    isHydrated,
    preferredCategories,
    setPreferredCategories,
    widgetColorTheme,
    setWidgetColorTheme,
    widgetVisualStyle,
    setWidgetVisualStyle,
    widgetPreviewSize,
    setWidgetPreviewSize,
    isOnboardingCompleted,
    setOnboardingCompleted,
  } = useStoredAppState();
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [dailySelection, setDailySelection] = useState<QuoteOrVerse>();
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    bgMusicTrack: '',
    voiceoverTrack: '',
  });
  const reduceMotion = useReducedMotionPreference();

  const activeCategory = dailySelection?.category ?? preferredCategories[0] ?? 'Meditation';
  const activeTheme = categoryThemes[activeCategory];
  const activeWidgetTheme = widgetColorThemes[widgetColorTheme];
  const activePatternIndex = getWidgetPatternIndex(dailySelection?.id ?? categories.indexOf(activeCategory));
  const previewCategoriesKey = useMemo(() => preferredCategories.join('|'), [preferredCategories]);
  const widgetPreviewSelection = useMemo(
    () => dailySelection && preferredCategories.includes(dailySelection.category)
      ? dailySelection
      : getRandomPreviewSelection(preferredCategories),
    [dailySelection, preferredCategories, previewCategoriesKey]
  );
  const onboardingPreviewSelection = useMemo(
    () => getRandomPreviewSelection(preferredCategories),
    [preferredCategories, previewCategoriesKey]
  );

  const loadDailySelection = useCallback(async (selectedCategories: QuoteCategory[]) => {
    const selection = await dataRepository.getDailySelectionForCategories(selectedCategories);
    setDailySelection(selection);
    setPlayback((current) => ({
      ...current,
      bgMusicTrack: selection.ambientAudioPath,
      voiceoverTrack: selection.voiceAudioPath,
      selection,
    }));
    return selection;
  }, []);

  const togglePreferredCategory = useCallback((category: QuoteCategory) => {
    const isSelected = preferredCategories.includes(category);
    if (isSelected && preferredCategories.length === 1) {
      return;
    }

    const nextCategories = isSelected
      ? preferredCategories.filter((item) => item !== category)
      : [category, ...preferredCategories];

    setPreferredCategories(nextCategories);
  }, [preferredCategories, setPreferredCategories]);

  const startPreviewPlayback = useCallback((selection: QuoteOrVerse) => {
    setPlayback({
      isPlaying: true,
      bgMusicTrack: selection.ambientAudioPath,
      voiceoverTrack: selection.voiceAudioPath,
      selection,
    });
  }, []);

  const togglePlayback = useCallback(() => {
    if (!dailySelection) {
      return;
    }

    if (playback.isPlaying) {
      setPlayback((current) => ({ ...current, isPlaying: false }));
      return;
    }

    startPreviewPlayback(dailySelection);
  }, [dailySelection, playback.isPlaying, startPreviewPlayback]);

  const handleDeepLink = useCallback((url: string) => {
    const parsed = new URL(url);
    if (parsed.protocol !== 'dailyfocus:') {
      return;
    }

    const category = parsed.searchParams.get('category') as QuoteCategory | null;
    const id = Number(parsed.searchParams.get('id'));
    const selection = Number.isFinite(id) ? dataRepository.getByID(id) : undefined;

    if (!category || !categories.includes(category) || !selection) {
      Alert.alert('Deep link ignored', 'The preview could not parse that widget URL.');
      return;
    }

    setPreferredCategories([category, ...preferredCategories.filter((item) => item !== category)]);
    setDailySelection(selection);
    startPreviewPlayback(selection);
  }, [preferredCategories, setPreferredCategories, startPreviewPlayback]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, [handleDeepLink]);

  useEffect(() => {
    if (isHydrated && isOnboardingCompleted) {
      loadDailySelection(preferredCategories);
    }
  }, [isHydrated, isOnboardingCompleted, loadDailySelection, preferredCategories]);

  if (!isHydrated || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.centerPanel}>
          <Text style={styles.appName}>{appDisplayName}</Text>
          <Text style={styles.mutedText}>Preparing your daily selection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isOnboardingCompleted) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: activeTheme.background }]}>
        <StatusBar style="dark" />
        <Onboarding
          step={onboardingStep}
          selectedCategories={preferredCategories}
          activeCategory={activeCategory}
          widgetColorTheme={widgetColorTheme}
          widgetVisualStyle={widgetVisualStyle}
          widgetPreviewSize={widgetPreviewSize}
          reduceMotion={reduceMotion}
          previewSelection={onboardingPreviewSelection}
          onToggleCategory={togglePreferredCategory}
          onSelectWidgetColorTheme={setWidgetColorTheme}
          onSelectWidgetVisualStyle={setWidgetVisualStyle}
          onSelectWidgetPreviewSize={setWidgetPreviewSize}
          onNext={() => setOnboardingStep((step) => Math.min(step + 1, 4))}
          onBack={() => setOnboardingStep((step) => Math.max(step - 1, 0))}
          onComplete={() => setOnboardingCompleted(true)}
        />
      </SafeAreaView>
    );
  }

  if (isPreferencesOpen) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: activeTheme.background }]}>
        <StatusBar style="dark" />
        <PreferencesView
          selectedCategories={preferredCategories}
          activeCategory={activeCategory}
          widgetColorTheme={widgetColorTheme}
          widgetVisualStyle={widgetVisualStyle}
          widgetPreviewSize={widgetPreviewSize}
          reduceMotion={reduceMotion}
          previewSelection={widgetPreviewSelection}
          onToggleCategory={togglePreferredCategory}
          onSelectWidgetColorTheme={setWidgetColorTheme}
          onSelectWidgetVisualStyle={setWidgetVisualStyle}
          onSelectWidgetPreviewSize={setWidgetPreviewSize}
          onDone={() => setIsPreferencesOpen(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: activeWidgetTheme.background }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
        <Image
          resizeMode="cover"
          source={widgetMotionAssets[widgetVisualStyle][activeCategory]}
          style={styles.mainBackgroundImage}
        />
        <View style={[styles.mainBackgroundVeil, { backgroundColor: activeWidgetTheme.background }]} />
        <View style={[styles.backgroundWash, { backgroundColor: activeTheme.accentSoft }]} />
        <View style={[styles.mainGlow, styles.mainGlowOne, { backgroundColor: activeWidgetTheme.glow }]} />
        <View style={[styles.mainGlow, styles.mainGlowTwo, { backgroundColor: activeTheme.accentSoft }]} />
        <View style={[styles.mainLine, styles.mainLineOne, { backgroundColor: activeWidgetTheme.accent }]} />
        <View style={[styles.mainLine, styles.mainLineTwo, { backgroundColor: activeTheme.accent }]} />
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: activeTheme.accent }]}>Today</Text>
            <Text style={[styles.title, { color: activeTheme.ink }]}>
              {preferredCategories.length > 1 ? 'Daily Mix' : categoryLabels[activeCategory]}
            </Text>
          </View>
          <Pressable
            style={[styles.smallButton, { borderColor: activeTheme.hairline }]}
            onPress={() => setIsPreferencesOpen(true)}
          >
            <Text style={styles.smallButtonText}>Preferences</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel={playback.isPlaying ? 'Pause daily reflection audio' : 'Start daily reflection audio'}
          accessibilityRole="button"
          disabled={!dailySelection}
          onPress={togglePlayback}
          style={({ pressed }) => [
            styles.todayPanel,
            widgetVisualStyle === 'calm' && styles.todayPanelCalm,
            widgetVisualStyle === 'iphone' && styles.todayPanelFuturistic,
            widgetVisualStyle === 'nature' && styles.todayPanelNature,
            {
              backgroundColor: activeWidgetTheme.background,
            },
            playback.isPlaying ? styles.todayPanelPlaying : styles.todayPanelIdle,
            pressed && dailySelection && styles.todayPanelPressed,
          ]}
        >
          <WidgetMotionLayer
            category={activeCategory}
            colorTheme={widgetColorTheme}
            patternIndex={activePatternIndex}
            reduceMotion={reduceMotion}
            visualStyle={widgetVisualStyle}
          />
          <View style={styles.todayPanelVeil} />
          <Image
            resizeMode="contain"
            source={categoryIconImages[activeCategory]}
            style={[styles.todayCategoryWatermark, { tintColor: activeTheme.accent }]}
          />
          {dailySelection ? (
            <>
              <View
                style={[
                  styles.todayPanelTop,
                  widgetVisualStyle === 'calm' && styles.todayPanelTopCalm,
                  widgetVisualStyle === 'iphone' && styles.todayPanelTopFuturistic,
                  widgetVisualStyle === 'nature' && styles.todayPanelTopNature,
                ]}
              >
                <View style={[styles.categoryBadge, { backgroundColor: categoryThemes[dailySelection.category].accentSoft }]}>
                  <Text style={[styles.categoryBadgeText, { color: categoryThemes[dailySelection.category].accent }]}>
                    {categoryLabels[dailySelection.category]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.quoteText, styles.todayQuoteText, { color: activeTheme.ink }]}>
                {dailySelection.text}
              </Text>
              <View style={styles.referenceRow}>
                <View style={[styles.referenceRule, { backgroundColor: activeTheme.accent }]} />
                <Text style={[styles.reference, { color: activeTheme.accent }]}>
                  {dailySelection.referenceOrAuthor}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.centerPanel}>
              <Text style={styles.mutedText}>Loading today...</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Onboarding({
  step,
  selectedCategories,
  activeCategory,
  widgetColorTheme,
  widgetVisualStyle,
  widgetPreviewSize,
  reduceMotion,
  previewSelection,
  onToggleCategory,
  onSelectWidgetColorTheme,
  onSelectWidgetVisualStyle,
  onSelectWidgetPreviewSize,
  onNext,
  onBack,
  onComplete,
}: {
  step: number;
  selectedCategories: QuoteCategory[];
  activeCategory: QuoteCategory;
  widgetColorTheme: WidgetColorTheme;
  widgetVisualStyle: WidgetVisualStyle;
  widgetPreviewSize: WidgetPreviewSize;
  reduceMotion: boolean;
  previewSelection?: QuoteOrVerse;
  onToggleCategory: (category: QuoteCategory) => void;
  onSelectWidgetColorTheme: (style: WidgetColorTheme) => void;
  onSelectWidgetVisualStyle: (style: WidgetVisualStyle) => void;
  onSelectWidgetPreviewSize: (size: WidgetPreviewSize) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  const theme = categoryThemes[activeCategory];
  const selectedLabels = selectedCategories.map((category) => categoryLabels[category]).join(', ');
  const [hasPressedIntro, setHasPressedIntro] = useState(false);

  const handleIntroPress = useCallback(() => {
    if (hasPressedIntro) {
      return;
    }

    setHasPressedIntro(true);
    onNext();
  }, [hasPressedIntro, onNext]);

  if (step === 0) {
    return (
      <Pressable
        accessibilityLabel="Continue onboarding"
        accessibilityRole="button"
        disabled={hasPressedIntro}
        onPress={handleIntroPress}
        style={({ pressed }) => [
          styles.introHeroScreen,
          pressed && styles.introHeroScreenPressed,
        ]}
      >
        <IntroStorySequence />
        <View pointerEvents="none" style={styles.introContinuePrompt}>
          <Text style={styles.introContinueText}>Press to continue</Text>
        </View>
      </Pressable>
    );
  }

  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={styles.onboardingContent}>
        <ProgressDots step={step} total={5} color={theme.accent} softColor={theme.accentSoft} />
        <View style={styles.onboardingHeaderBlock}>
          <Text style={[styles.appName, { color: theme.accent }]}>{appDisplayName}</Text>
          <Text style={[styles.heroTitle, { color: theme.ink }]}>Choose your daily focus.</Text>
          <Text style={[styles.screenSubtitle, { color: theme.muted }]}>Pick one or more for your daily rotation.</Text>
        </View>
        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            const cardTheme = categoryThemes[category];
            return (
              <Pressable
                key={category}
                style={({ pressed }) => [
                  styles.categoryCard,
                  styles.onboardingCategoryCard,
                  { borderColor: isSelected ? cardTheme.accent : '#E0D8CF' },
                  isSelected && { backgroundColor: cardTheme.accent },
                  pressed && styles.onboardingCardPressed,
                ]}
                onPress={() => onToggleCategory(category)}
              >
                <Image
                  resizeMode="contain"
                  source={categoryIconImages[category]}
                  style={[
                    styles.categoryCardImage,
                    { tintColor: isSelected ? '#FFFFFF' : cardTheme.accent },
                    isSelected && styles.categoryCardImageSelected,
                  ]}
                />
                <View style={[styles.categoryCardScrim, { backgroundColor: isSelected ? cardTheme.accent : '#FFFFFF' }]} />
                <View style={styles.categoryCardTop}>
                  <View style={[styles.categoryGlyph, { backgroundColor: isSelected ? '#FFFFFF22' : cardTheme.accentSoft }]}>
                    <CategoryGlyph category={category} selected={isSelected} />
                  </View>
                  <Text style={[styles.categoryTitle, isSelected && styles.selectedText]}>
                    {categoryLabels[category]}
                  </Text>
                  <Text style={[styles.selectionMark, isSelected && styles.selectionMarkActive]}>
                    {isSelected ? 'Selected' : 'Tap to add'}
                  </Text>
                </View>
                <Text style={[styles.categoryDescription, isSelected && styles.selectedText]}>
                  {category === 'Meditation'
                    ? 'Breath, stillness, and reset'
                    : category === 'Bible'
                      ? 'Verse, prayer, and comfort'
                      : 'Clarity, courage, and perspective'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (step === 2) {
    return (
      <ScrollView contentContainerStyle={styles.onboardingContent}>
        <ProgressDots step={step} total={5} color={theme.accent} softColor={theme.accentSoft} />
        <View style={styles.onboardingHeaderBlock}>
          <Text style={[styles.appName, { color: theme.accent }]}>Widget Preview</Text>
          <Text style={[styles.heroTitle, { color: theme.ink }]}>Make it feel at home.</Text>
          <Text style={[styles.screenSubtitle, { color: theme.muted }]}>Choose the look now. You can refine it anytime.</Text>
        </View>
        <View style={styles.widgetPreviewPickerRow}>
          <WidgetPreviewSizeDropdown
            activeTheme={theme}
            selectedSize={widgetPreviewSize}
            onSelect={onSelectWidgetPreviewSize}
          />
        </View>
        <WidgetPreviewCard
          widgetColorTheme={widgetColorTheme}
          widgetVisualStyle={widgetVisualStyle}
          category={activeCategory}
          previewSize={widgetPreviewSize}
          reduceMotion={reduceMotion}
          selectedLabels={selectedLabels}
          selection={previewSelection}
        />
        <Text style={[styles.optionGroupTitle, { color: theme.ink }]}>Color Theme</Text>
        <View style={styles.widgetStyleGrid}>
          {(Object.keys(widgetColorThemes) as WidgetColorTheme[]).map((style) => {
            const option = widgetColorThemes[style];
            const isSelected = style === widgetColorTheme;
            return (
              <Pressable
                key={style}
                style={[
                  styles.widgetStyleOption,
                  {
                    backgroundColor: option.background,
                    borderColor: isSelected ? option.accent : theme.hairline,
                  },
                ]}
                onPress={() => onSelectWidgetColorTheme(style)}
              >
                <Text style={[styles.widgetStyleName, { color: option.foreground }]}>
                  {option.label}
                </Text>
                <View style={[styles.widgetStyleSwatch, { backgroundColor: option.accent }]} />
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.optionGroupTitle, { color: theme.ink }]}>Style</Text>
        <View style={styles.widgetStyleGrid}>
          {(Object.keys(widgetVisualStyles) as WidgetVisualStyle[]).map((style) => {
            const option = widgetVisualStyles[style];
            const isSelected = style === widgetVisualStyle;
            return (
              <Pressable
                key={style}
                style={[
                  styles.visualStyleOption,
                  {
                    borderColor: isSelected ? theme.accent : theme.hairline,
                    backgroundColor: isSelected ? theme.accentSoft : '#FFFFFF',
                  },
                ]}
                onPress={() => onSelectWidgetVisualStyle(style)}
              >
                <StylePreviewGlyph visualStyle={style} theme={theme} />
                <Text style={[styles.visualStyleName, { color: theme.ink }]}>{option.label}</Text>
                <Text style={[styles.visualStyleDescription, { color: theme.muted }]}>{option.description}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (step === 3) {
    return (
      <View style={styles.onboardingContent}>
        <ProgressDots step={step} total={5} color={theme.accent} softColor={theme.accentSoft} />
        <View style={styles.onboardingHeaderBlock}>
          <Text style={[styles.appName, { color: theme.accent }]}>Optional Support</Text>
          <Text style={[styles.heroTitle, { color: theme.ink }]}>Help the library grow.</Text>
        </View>
        <View style={[styles.supportPanel, { borderColor: theme.hairline }]}>
          <View style={styles.supportVisual}>
            <View style={[styles.supportOrb, { backgroundColor: categoryThemes.Meditation.accentSoft }]}>
              <CategoryGlyph category="Meditation" selected={false} />
            </View>
            <View style={[styles.supportOrb, styles.supportOrbCenter, { backgroundColor: categoryThemes.Bible.accentSoft }]}>
              <CategoryGlyph category="Bible" selected={false} />
            </View>
            <View style={[styles.supportOrb, { backgroundColor: categoryThemes.Quote.accentSoft }]}>
              <CategoryGlyph category="Quote" selected={false} />
            </View>
          </View>
          <View style={styles.supportPriceRow}>
            <Text style={[styles.price, { color: theme.ink }]}>$1.99</Text>
            <Text style={[styles.supportBadge, { backgroundColor: theme.accentSoft, color: theme.accent }]}>One time</Text>
          </View>
          <Text style={styles.supportCopy}>
            Supports more verses, quotes, voiceovers, and ambient tracks.
          </Text>
          <Text style={[styles.supportFinePrint, { color: theme.muted }]}>
            No subscription. No account. Skipping keeps the full app open.
          </Text>
        </View>
        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Support for $1.99</Text>
        </Pressable>
        <Pressable style={styles.textButton} onPress={onNext}>
          <Text style={styles.textButtonLabel}>Continue Free</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.onboardingContent}>
      <ProgressDots step={step} total={5} color={theme.accent} softColor={theme.accentSoft} />
      <View style={styles.onboardingHeaderBlock}>
        <Text style={[styles.appName, { color: theme.accent }]}>Widget Setup</Text>
        <Text style={[styles.heroTitle, { color: theme.ink }]}>Add your daily moment.</Text>
        <Text style={[styles.screenSubtitle, { color: theme.muted }]}>One tap from your screen back into listening.</Text>
      </View>
      <View style={[styles.setupPreview, { borderColor: theme.hairline, backgroundColor: theme.accentSoft }]}>
        <View style={styles.setupPreviewPhone}>
          <View style={[styles.setupPreviewDate, { backgroundColor: theme.panel }]} />
          <View style={[styles.setupPreviewTime, { backgroundColor: theme.accent }]} />
          <View style={[styles.setupPreviewWidget, { backgroundColor: widgetColorThemes[widgetColorTheme].background, borderColor: widgetColorThemes[widgetColorTheme].accent }]}>
            <CategoryGlyph category={activeCategory} selected={false} />
          </View>
        </View>
      </View>
      <View style={[styles.stepsPanel, { borderColor: theme.hairline }]}>
        {['Long-press your Home Screen or Lock Screen.', 'Tap Edit or the add button.', `Choose ${appDisplayName} and place the widget.`].map((stepText, index) => (
          <View key={stepText} style={styles.instructionRow}>
            <Text style={[styles.stepNumber, { backgroundColor: theme.accentSoft, color: theme.accent }]}>{index + 1}</Text>
            <Text style={styles.stepText}>{stepText}</Text>
          </View>
        ))}
      </View>
      <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={onComplete}>
        <Text style={styles.primaryButtonText}>Finish</Text>
      </Pressable>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
}

function PreferencesView({
  selectedCategories,
  activeCategory,
  widgetColorTheme,
  widgetVisualStyle,
  widgetPreviewSize,
  reduceMotion,
  previewSelection,
  onToggleCategory,
  onSelectWidgetColorTheme,
  onSelectWidgetVisualStyle,
  onSelectWidgetPreviewSize,
  onDone,
}: {
  selectedCategories: QuoteCategory[];
  activeCategory: QuoteCategory;
  widgetColorTheme: WidgetColorTheme;
  widgetVisualStyle: WidgetVisualStyle;
  widgetPreviewSize: WidgetPreviewSize;
  reduceMotion: boolean;
  previewSelection?: QuoteOrVerse;
  onToggleCategory: (category: QuoteCategory) => void;
  onSelectWidgetColorTheme: (style: WidgetColorTheme) => void;
  onSelectWidgetVisualStyle: (style: WidgetVisualStyle) => void;
  onSelectWidgetPreviewSize: (size: WidgetPreviewSize) => void;
  onDone: () => void;
}) {
  const theme = categoryThemes[activeCategory];
  const selectedLabels = selectedCategories.map((category) => categoryLabels[category]).join(', ');

  return (
    <ScrollView contentContainerStyle={styles.preferencesContent} showsVerticalScrollIndicator={false}>
      <View style={styles.preferencesHeader}>
        <View>
          <Text style={[styles.appName, { color: theme.accent }]}>Preferences</Text>
          <Text style={[styles.preferencesTitle, { color: theme.ink }]}>Tune your daily mix.</Text>
        </View>
        <Pressable style={[styles.smallButton, { borderColor: theme.hairline }]} onPress={onDone}>
          <Text style={styles.smallButtonText}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.preferencesSection}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Content</Text>
        <Text style={[styles.mutedText, { color: theme.muted }]}>
          Choose one or more. We&apos;ll rotate today&apos;s reflection from these.
        </Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            const cardTheme = categoryThemes[category];
            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryCard,
                  styles.compactCategoryCard,
                  { borderColor: isSelected ? cardTheme.accent : theme.hairline },
                  isSelected && { backgroundColor: cardTheme.accent },
                ]}
                onPress={() => onToggleCategory(category)}
              >
                <View style={styles.categoryCardTop}>
                  <View style={[styles.categoryGlyph, { backgroundColor: isSelected ? '#FFFFFF22' : cardTheme.accentSoft }]}>
                    <CategoryGlyph category={category} selected={isSelected} />
                  </View>
                  <Text style={[styles.categoryTitle, isSelected && styles.selectedText]}>
                    {categoryLabels[category]}
                  </Text>
                  <Text style={[styles.selectionMark, isSelected && styles.selectionMarkActive]}>
                    {isSelected ? 'On' : 'Off'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.preferencesSection}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Widget</Text>
        <WidgetPreviewSizeDropdown
          activeTheme={theme}
          selectedSize={widgetPreviewSize}
          onSelect={onSelectWidgetPreviewSize}
        />
        <WidgetPreviewCard
          widgetColorTheme={widgetColorTheme}
          widgetVisualStyle={widgetVisualStyle}
          category={activeCategory}
          previewSize={widgetPreviewSize}
          reduceMotion={reduceMotion}
          selectedLabels={selectedLabels}
          selection={previewSelection}
        />
        <Text style={[styles.optionGroupTitle, { color: theme.ink }]}>Color Theme</Text>
        <View style={styles.widgetStyleGrid}>
          {(Object.keys(widgetColorThemes) as WidgetColorTheme[]).map((style) => {
            const option = widgetColorThemes[style];
            const isSelected = style === widgetColorTheme;
            return (
              <Pressable
                key={style}
                style={[
                  styles.widgetStyleOption,
                  {
                    backgroundColor: option.background,
                    borderColor: isSelected ? option.accent : theme.hairline,
                  },
                ]}
                onPress={() => onSelectWidgetColorTheme(style)}
              >
                <Text style={[styles.widgetStyleName, { color: option.foreground }]}>
                  {option.label}
                </Text>
                <View style={[styles.widgetStyleSwatch, { backgroundColor: option.accent }]} />
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.optionGroupTitle, { color: theme.ink }]}>Style</Text>
        <View style={styles.widgetStyleGrid}>
          {(Object.keys(widgetVisualStyles) as WidgetVisualStyle[]).map((style) => {
            const option = widgetVisualStyles[style];
            const isSelected = style === widgetVisualStyle;
            return (
              <Pressable
                key={style}
                style={[
                  styles.visualStyleOption,
                  {
                    borderColor: isSelected ? theme.accent : theme.hairline,
                    backgroundColor: isSelected ? theme.accentSoft : '#FFFFFF',
                  },
                ]}
                onPress={() => onSelectWidgetVisualStyle(style)}
              >
                <StylePreviewGlyph visualStyle={style} theme={theme} />
                <Text style={[styles.visualStyleName, { color: theme.ink }]}>{option.label}</Text>
                <Text style={[styles.visualStyleDescription, { color: theme.muted }]}>{option.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function WidgetPreviewSizeDropdown({
  activeTheme,
  selectedSize,
  onSelect,
}: {
  activeTheme: CategoryTheme;
  selectedSize: WidgetPreviewSize;
  onSelect: (size: WidgetPreviewSize) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.previewSizeDropdownWrap}>
      <Pressable
        style={[styles.previewSizeDropdownButton, { borderColor: activeTheme.hairline }]}
        onPress={() => setIsOpen((value) => !value)}
      >
        <Text style={[styles.previewSizeDropdownText, { color: activeTheme.ink }]}>
          {widgetPreviewSizeLabels[selectedSize]}
        </Text>
      </Pressable>
      {isOpen ? (
        <View style={[styles.previewSizeDropdownMenu, { borderColor: activeTheme.hairline }]}>
          {(Object.keys(widgetPreviewSizeLabels) as WidgetPreviewSize[]).map((size) => {
            const isSelected = size === selectedSize;
            return (
              <Pressable
                key={size}
                style={[
                  styles.previewSizeDropdownOption,
                  isSelected && { backgroundColor: activeTheme.accentSoft },
                ]}
                onPress={() => {
                  onSelect(size);
                  setIsOpen(false);
                }}
              >
                <Text style={[styles.previewSizeDropdownOptionText, { color: activeTheme.ink }]}>
                  {widgetPreviewSizeLabels[size]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function StylePreviewGlyph({
  visualStyle,
  theme,
}: {
  visualStyle: WidgetVisualStyle;
  theme: CategoryTheme;
}) {
  if (visualStyle === 'iphone') {
    return (
      <View style={[styles.styleGlyph, styles.styleGlyphIphone, { borderColor: theme.hairline }]}>
        <View style={styles.styleGlyphIsland} />
        <View style={[styles.styleGlyphGlassCard, { backgroundColor: theme.accentSoft }]} />
        <View style={[styles.styleGlyphGlassLine, { backgroundColor: theme.accent }]} />
      </View>
    );
  }

  if (visualStyle === 'nature') {
    return (
      <View style={[styles.styleGlyph, styles.styleGlyphNature, { borderColor: theme.hairline }]}>
        <View style={[styles.styleGlyphSun, { backgroundColor: theme.accent }]} />
        <View style={[styles.styleGlyphHillBack, { backgroundColor: theme.accentSoft }]} />
        <View style={[styles.styleGlyphHillFront, { backgroundColor: theme.accent }]} />
      </View>
    );
  }

  return (
    <View style={[styles.styleGlyph, styles.styleGlyphCalm, { borderColor: theme.hairline }]}>
      <View style={[styles.styleGlyphRing, { borderColor: theme.accentSoft }]} />
      <View style={[styles.styleGlyphDot, { backgroundColor: theme.accent }]} />
      <View style={[styles.styleGlyphLine, { backgroundColor: theme.accentSoft }]} />
    </View>
  );
}

function IntroStorySequence() {
  const opacities = useRef(introStorySlides.map((_, index) => new Animated.Value(index === 0 ? 1 : 0))).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slideDuration = 3200;
    const fadeInDuration = 650;
    const holdDuration = 1900;
    const fadeOutDuration = 520;
    const cycleDuration = introStorySlides.length * slideDuration;

    const slideLoops = opacities.map((opacity, index) => {
      opacity.setValue(index === 0 ? 1 : 0);
      const elapsed = (index * slideDuration) + fadeInDuration + holdDuration + fadeOutDuration;

      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * slideDuration),
          Animated.timing(opacity, {
            toValue: 1,
            duration: fadeInDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(holdDuration),
          Animated.timing(opacity, {
            toValue: 0,
            duration: fadeOutDuration,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, cycleDuration - elapsed)),
        ])
      );
    });

    progress.setValue(0);
    const flowLoop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: cycleDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    slideLoops.forEach((loop) => loop.start());
    flowLoop.start();

    return () => {
      slideLoops.forEach((loop) => loop.stop());
      flowLoop.stop();
    };
  }, [opacities, progress]);

  const slowDrift = progress.interpolate({ inputRange: [0, 1], outputRange: [-36, 36] });
  const reverseDrift = progress.interpolate({ inputRange: [0, 1], outputRange: [32, -32] });

  return (
    <View pointerEvents="none" style={styles.introStoryLayer}>
      {introStorySlides.map((slide, index) => (
        <Animated.Image
          key={`${slide.title}-background`}
          resizeMode="cover"
          source={categoryHeroImages[slide.category]}
          style={[
            styles.introStoryBackgroundImage,
            { opacity: opacities[index] },
          ]}
        />
      ))}
      <View style={styles.introHeroVeil} />
      <Animated.View
        style={[
          styles.introAmbientLine,
          styles.introAmbientLineOne,
          { transform: [{ translateX: slowDrift }, { rotate: '-8deg' }] },
        ]}
      />
      <Animated.View
        style={[
          styles.introAmbientLine,
          styles.introAmbientLineTwo,
          { transform: [{ translateX: reverseDrift }, { rotate: '9deg' }] },
        ]}
      />
      <Animated.View
        style={[
          styles.introAmbientOrb,
          styles.introAmbientOrbOne,
          { transform: [{ translateX: slowDrift }] },
        ]}
      />
      <Animated.View
        style={[
          styles.introAmbientOrb,
          styles.introAmbientOrbTwo,
          { transform: [{ translateX: reverseDrift }] },
        ]}
      />
      <View style={styles.introStoryCenter}>
        {introStorySlides.map((slide, index) => (
          <Animated.View
            key={slide.title}
            style={[
              styles.introStoryTextLayer,
              { opacity: opacities[index] },
            ]}
          >
            <Text style={styles.introStoryTitle}>{slide.title}</Text>
            <Text style={styles.introStoryCopy}>{slide.copy}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function IntroAnimation() {
  const breath = useRef(new Animated.Value(0)).current;
  const flow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(flow, {
        toValue: 1,
        duration: 3600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [flow]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const opacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.9] });
  const flowTranslate = flow.interpolate({ inputRange: [0, 1], outputRange: [-28, 28] });
  const flowTranslateReverse = flow.interpolate({ inputRange: [0, 1], outputRange: [24, -24] });

  return (
    <View style={styles.motionStage}>
      <Animated.View style={[styles.flowOrb, styles.flowOrbOne, { transform: [{ translateX: flowTranslate }, { scale }] }]} />
      <Animated.View style={[styles.flowOrb, styles.flowOrbTwo, { transform: [{ translateX: flowTranslateReverse }] }]} />
      <Animated.View style={[styles.flowLine, styles.flowLineOne, { transform: [{ translateX: flowTranslate }, { rotate: '-10deg' }] }]} />
      <Animated.View style={[styles.flowLine, styles.flowLineTwo, { transform: [{ translateX: flowTranslateReverse }, { rotate: '8deg' }] }]} />
      <Animated.View style={[styles.flowLine, styles.flowLineThree, { transform: [{ translateX: flowTranslate }, { rotate: '16deg' }] }]} />
      <Animated.View style={[styles.flowLine, styles.flowLineFour, { transform: [{ translateX: flowTranslateReverse }, { rotate: '-18deg' }] }]} />
      <Animated.View style={[styles.motionRingOuter, { opacity, transform: [{ scale }] }]} />
      <Animated.View style={[styles.motionRingMiddle, { transform: [{ scale }] }]} />
      <View style={styles.motionWidget}>
        <Text style={styles.motionWidgetLabel}>Today</Text>
        <View style={styles.motionWidgetLine} />
        <View style={[styles.motionWidgetLine, styles.motionWidgetLineShort]} />
      </View>
    </View>
  );
}

function CategoryGlyph({ category, selected }: { category: QuoteCategory; selected: boolean }) {
  const theme = categoryThemes[category];
  const color = selected ? '#FFFFFF' : theme.accent;

  return (
    <Image
      resizeMode="contain"
      source={categoryIconImages[category]}
      style={[styles.categoryGlyphImage, { tintColor: color }]}
    />
  );
}

function WidgetPreviewCard({
  widgetColorTheme,
  widgetVisualStyle,
  category,
  previewSize,
  reduceMotion = false,
  selectedLabels,
  selection,
}: {
  widgetColorTheme: WidgetColorTheme;
  widgetVisualStyle: WidgetVisualStyle;
  category: QuoteCategory;
  previewSize: WidgetPreviewSize;
  reduceMotion?: boolean;
  selectedLabels: string;
  selection?: QuoteOrVerse;
}) {
  const option = widgetColorThemes[widgetColorTheme];
  const previewCategory = selection?.category ?? category;
  const categoryTheme = categoryThemes[previewCategory];
  const isIphone = widgetVisualStyle === 'iphone';
  const isNature = widgetVisualStyle === 'nature';
  const patternIndex = getWidgetPatternIndex(selection?.id ?? categories.indexOf(previewCategory));
  const previewMeta = selection?.referenceOrAuthor ?? selectedLabels;

  if (previewSize === 'lock') {
    return (
      <LockScreenWidgetPreview
        category={previewCategory}
        colorTheme={widgetColorTheme}
        option={option}
        patternIndex={patternIndex}
        previewMeta={previewMeta}
        reduceMotion={reduceMotion}
        selection={selection}
        visualStyle={widgetVisualStyle}
      />
    );
  }

  return (
    <View style={[styles.homeScreenPreviewFrame, { backgroundColor: categoryTheme.accentSoft }]}>
      <View style={styles.homeScreenPreviewTopBar}>
        <View style={[styles.homeScreenPreviewIsland, { backgroundColor: categoryTheme.accent }]} />
        <View style={styles.homeScreenPreviewStatusDots}>
          <View style={[styles.homeScreenPreviewStatusDot, { backgroundColor: option.accent }]} />
          <View style={[styles.homeScreenPreviewStatusDot, { backgroundColor: option.glow }]} />
        </View>
      </View>
      <View style={styles.homeScreenPreviewGrid}>
        {Array.from({ length: 8 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.homeScreenPreviewIcon,
              { backgroundColor: index % 3 === 0 ? option.glow : '#FFFFFFA8' },
            ]}
          />
        ))}
      </View>
      <View style={styles.homeScreenWidgetShadow}>
        <View
          style={[
            styles.widgetCard,
            styles.widgetCardHome,
            widgetVisualStyle === 'calm' && styles.widgetCardCalm,
            widgetVisualStyle === 'calm' && calmCardPatternStyles[patternIndex],
            isIphone && styles.widgetCardIphone,
            isIphone && iphoneCardPatternStyles[patternIndex],
            isNature && styles.widgetCardNature,
            isNature && natureCardPatternStyles[patternIndex],
            { backgroundColor: option.background, borderColor: option.accent },
          ]}
        >
          <WidgetMotionLayer
            category={previewCategory}
            colorTheme={widgetColorTheme}
            patternIndex={patternIndex}
            reduceMotion={reduceMotion}
            visualStyle={widgetVisualStyle}
          />
          <View style={styles.widgetGlassWash} />
          {widgetVisualStyle === 'calm' ? (
            <View style={[styles.widgetCalmHalo, { borderColor: categoryTheme.accentSoft }]} />
          ) : null}
          {isIphone ? (
            <>
              <View style={[styles.widgetFuturisticPane, { borderColor: option.accent, backgroundColor: option.glow }]} />
              <View style={[styles.widgetFuturisticRail, { backgroundColor: option.accent }]}>
                <View style={styles.widgetFuturisticNode} />
                <View style={styles.widgetFuturisticNode} />
                <View style={styles.widgetFuturisticNode} />
              </View>
              <View style={styles.widgetIphoneChrome}>
                <View style={styles.widgetIphoneIsland} />
                <Text style={[styles.widgetIphoneTime, { color: option.foreground }]}>9:41</Text>
              </View>
            </>
          ) : null}
          {isNature ? (
            <>
              <View style={[styles.widgetNatureSun, { backgroundColor: option.accent }]} />
              <View style={[styles.widgetNatureRidgeBack, { backgroundColor: categoryTheme.accentSoft }]} />
              <View style={[styles.widgetNatureRidgeFront, { backgroundColor: option.glow }]} />
            </>
          ) : null}
          <View
            style={[
              styles.widgetCardTop,
              widgetVisualStyle === 'calm' && styles.widgetCardTopCalm,
              isIphone && styles.widgetCardTopFuturistic,
              isNature && styles.widgetCardTopNature,
            ]}
          >
            <Text style={[styles.widgetCardKicker, { color: option.accent }]}>Today</Text>
            <View style={[styles.widgetCardDot, { backgroundColor: option.accent }]} />
          </View>
          <View
            style={[
              styles.widgetQuotePlate,
              widgetVisualStyle === 'calm' && styles.widgetQuotePlateCalm,
              isIphone && styles.widgetQuotePlateFuturistic,
              isNature && styles.widgetQuotePlateNature,
            ]}
          >
            <Text
              style={[
                styles.widgetCardQuote,
                widgetVisualStyle === 'calm' && styles.widgetCardQuoteCalm,
                widgetVisualStyle === 'calm' && calmQuotePatternStyles[patternIndex],
                isIphone && styles.widgetCardQuoteIphone,
                isIphone && iphoneQuotePatternStyles[patternIndex],
                isNature && styles.widgetCardQuoteNature,
                isNature && natureQuotePatternStyles[patternIndex],
                { color: option.foreground },
              ]}
            >
              {selection?.text ?? 'Let the next breath be simple enough to trust.'}
            </Text>
          </View>
          <View
            style={[
              styles.widgetCardFooter,
              widgetVisualStyle === 'calm' && styles.widgetCardFooterCalm,
              isIphone && styles.widgetCardFooterFuturistic,
              isNature && styles.widgetCardFooterNature,
              isNature && natureFooterPatternStyles[patternIndex],
            ]}
          >
            <Text style={[styles.widgetCardMeta, { color: option.foreground }]}>{previewMeta}</Text>
            <View style={[styles.widgetCardGlyph, { backgroundColor: categoryTheme.accentSoft }]}>
              <CategoryGlyph category={previewCategory} selected={false} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.homeScreenPreviewDock}>
        <View style={[styles.homeScreenPreviewDockIcon, { backgroundColor: option.background }]} />
        <View style={[styles.homeScreenPreviewDockIcon, { backgroundColor: option.glow }]} />
        <View style={[styles.homeScreenPreviewDockIcon, { backgroundColor: option.accent }]} />
      </View>
    </View>
  );
}

function LockScreenWidgetPreview({
  category,
  colorTheme,
  option,
  patternIndex,
  previewMeta,
  reduceMotion,
  selection,
  visualStyle,
}: {
  category: QuoteCategory;
  colorTheme: WidgetColorTheme;
  option: WidgetColorThemeConfig;
  patternIndex: WidgetPatternIndex;
  previewMeta: string;
  reduceMotion: boolean;
  selection?: QuoteOrVerse;
  visualStyle: WidgetVisualStyle;
}) {
  const categoryTheme = categoryThemes[category];

  return (
    <View style={styles.lockScreenPreviewFrame}>
      <View style={styles.lockScreenPreviewTop}>
        <Text style={styles.lockScreenDate}>Wed May 20</Text>
        <Text style={styles.lockScreenTime}>8:10</Text>
      </View>
      <View style={styles.lockScreenWidgetSlot}>
        <View
          style={[
            styles.lockWidgetCard,
            { backgroundColor: option.background, borderColor: option.accent },
            visualStyle === 'calm' && styles.lockWidgetCardCalm,
            visualStyle === 'iphone' && styles.lockWidgetCardIphone,
            visualStyle === 'nature' && styles.lockWidgetCardNature,
          ]}
        >
          <WidgetMotionLayer
            category={category}
            colorTheme={colorTheme}
            patternIndex={patternIndex}
            reduceMotion={reduceMotion}
            visualStyle={visualStyle}
          />
          <View style={styles.widgetGlassWash} />
          {visualStyle === 'iphone' ? (
            <View style={[styles.lockWidgetFuturisticPane, { borderColor: option.accent }]} />
          ) : null}
          {visualStyle === 'nature' ? (
            <View style={[styles.lockWidgetNatureHorizon, { backgroundColor: categoryTheme.accentSoft }]} />
          ) : null}
          <View
            style={[
              styles.lockWidgetAccent,
              visualStyle === 'calm' && styles.lockWidgetAccentCalm,
              visualStyle === 'iphone' && styles.lockWidgetAccentFuturistic,
              visualStyle === 'nature' && styles.lockWidgetAccentNature,
              { backgroundColor: option.accent },
            ]}
          />
          <View
            style={[
              styles.lockWidgetTextBlock,
              visualStyle === 'iphone' && styles.lockWidgetTextBlockFuturistic,
              visualStyle === 'nature' && styles.lockWidgetTextBlockNature,
            ]}
          >
            <Text style={[styles.lockWidgetKicker, { color: option.accent }]}>
              {categoryLabels[category]}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.lockWidgetQuote, { color: option.foreground }]}
            >
              {selection?.text ?? 'Let the next breath be simple enough to trust.'}
            </Text>
          </View>
          <View
            style={[
              styles.lockWidgetGlyph,
              visualStyle === 'iphone' && styles.lockWidgetGlyphFuturistic,
              visualStyle === 'nature' && styles.lockWidgetGlyphNature,
              { backgroundColor: categoryTheme.accentSoft },
            ]}
          >
            <CategoryGlyph category={category} selected={false} />
          </View>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.lockWidgetMeta}>{previewMeta}</Text>
    </View>
  );
}

function ProgressDots({
  step,
  total,
  color,
  softColor,
}: {
  step: number;
  total: number;
  color: string;
  softColor: string;
}) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            {
              backgroundColor: index <= step ? color : softColor,
              width: index === step ? 28 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  centerPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  mainContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minHeight: '100%',
    padding: 22,
    paddingBottom: 34,
    gap: 22,
    position: 'relative',
  },
  mainBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    opacity: 0.28,
    width: '100%',
  },
  mainBackgroundVeil: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.74,
  },
  backgroundWash: {
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 28,
    height: 300,
    left: 0,
    opacity: 0.72,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mainGlow: {
    borderRadius: 999,
    opacity: 0.34,
    position: 'absolute',
  },
  mainGlowOne: {
    height: 280,
    right: -120,
    top: 82,
    width: 280,
  },
  mainGlowTwo: {
    bottom: 110,
    height: 360,
    left: -170,
    width: 360,
  },
  mainLine: {
    borderRadius: 999,
    height: 2,
    opacity: 0.18,
    position: 'absolute',
    width: '96%',
  },
  mainLineOne: {
    right: -60,
    top: 280,
    transform: [{ rotate: '-10deg' }],
  },
  mainLineTwo: {
    bottom: 220,
    left: -48,
    transform: [{ rotate: '12deg' }],
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 42,
    zIndex: 2,
  },
  eyebrow: {
    color: '#7A4E42',
    fontSize: 13,
    fontFamily: appFontFamily,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#171513',
    fontSize: 32,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  appName: {
    color: '#7A4E42',
    fontSize: 15,
    fontFamily: appFontFamily,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#171513',
    fontSize: 36,
    fontFamily: appFontFamily,
    fontWeight: '800',
    lineHeight: 42,
  },
  screenSubtitle: {
    fontFamily: appFontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 23,
    marginTop: -10,
  },
  onboardingContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  onboardingHeaderBlock: {
    gap: 10,
  },
  preferencesContent: {
    flexGrow: 1,
    gap: 20,
    padding: 24,
  },
  preferencesHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  preferencesTitle: {
    fontSize: 30,
    fontFamily: appFontFamily,
    fontWeight: '700',
    lineHeight: 36,
  },
  preferencesSection: {
    gap: 12,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  progressDot: {
    borderRadius: 4,
    height: 8,
  },
  introHeroScreen: {
    backgroundColor: '#17221B',
    flex: 1,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  introHeroScreenPressed: {
    opacity: 0.98,
  },
  introHeroVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,16,14,0.26)',
  },
  introStoryCenter: {
    alignItems: 'center',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  introStoryLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  introStoryBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  introAmbientLine: {
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderRadius: 999,
    height: 2,
    left: -26,
    position: 'absolute',
    width: '112%',
  },
  introAmbientLineOne: {
    top: '22%',
  },
  introAmbientLineTwo: {
    bottom: '32%',
    opacity: 0.56,
  },
  introAmbientOrb: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.26)',
    borderRadius: 999,
    borderWidth: 1,
    height: 126,
    position: 'absolute',
    width: 126,
  },
  introAmbientOrbOne: {
    right: -48,
    top: 122,
  },
  introAmbientOrbTwo: {
    bottom: 170,
    left: -62,
  },
  introStoryTextLayer: {
    alignItems: 'center',
    bottom: 134,
    gap: 8,
    left: 24,
    position: 'absolute',
    right: 24,
  },
  introStoryTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontFamily: appFontFamily,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.38)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 10,
    textTransform: 'uppercase',
  },
  introStoryCopy: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontFamily: appFontFamily,
    fontWeight: '700',
    lineHeight: 21,
    maxWidth: 330,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.36)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 10,
  },
  introContinuePrompt: {
    alignItems: 'center',
    alignSelf: 'center',
    bottom: 72,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
    position: 'absolute',
    zIndex: 3,
  },
  introContinueText: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 15,
    fontFamily: appFontFamily,
    fontWeight: '800',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.34)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 9,
  },
  motionStage: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 184,
    justifyContent: 'center',
    marginBottom: 2,
    width: 260,
  },
  flowLine: {
    backgroundColor: '#D7CDBE',
    borderRadius: 999,
    height: 2,
    opacity: 0.7,
    position: 'absolute',
  },
  flowOrb: {
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderColor: 'rgba(255,255,255,0.72)',
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    position: 'absolute',
    width: 64,
  },
  flowOrbOne: {
    left: 18,
    top: 58,
  },
  flowOrbTwo: {
    bottom: 42,
    right: 28,
  },
  flowLineOne: {
    top: 42,
    width: 186,
  },
  flowLineTwo: {
    bottom: 48,
    width: 214,
  },
  flowLineThree: {
    bottom: 76,
    opacity: 0.42,
    width: 146,
  },
  flowLineFour: {
    opacity: 0.32,
    top: 82,
    width: 224,
  },
  motionRingOuter: {
    backgroundColor: '#EAE2D5',
    borderRadius: 76,
    height: 152,
    position: 'absolute',
    width: 152,
  },
  motionRingMiddle: {
    backgroundColor: '#F8F4EC',
    borderColor: '#E4D9C8',
    borderRadius: 58,
    borderWidth: 1,
    height: 116,
    position: 'absolute',
    width: 116,
  },
  motionWidget: {
    backgroundColor: '#FFFDF8',
    borderColor: '#E1D7C8',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
    width: 116,
  },
  motionWidgetLabel: {
    color: '#766B5D',
    fontSize: 11,
    fontFamily: appFontFamily,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  motionWidgetLine: {
    backgroundColor: '#2A251F',
    borderRadius: 2,
    height: 3,
    opacity: 0.68,
    width: 76,
  },
  motionWidgetLineShort: {
    opacity: 0.34,
    width: 48,
  },
  motionToken: {
    alignItems: 'center',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    width: 42,
  },
  motionTokenMeditation: {
    backgroundColor: '#31473A',
    left: 26,
    top: 24,
  },
  motionTokenBible: {
    backgroundColor: '#5B4A33',
    right: 24,
    top: 50,
  },
  motionTokenQuote: {
    backgroundColor: '#30475B',
    bottom: 22,
    left: 68,
  },
  introCopy: {
    color: '#4F4942',
    fontSize: 17,
    lineHeight: 25,
  },
  categoryGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D8CF',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    overflow: 'hidden',
    padding: 18,
    position: 'relative',
  },
  onboardingCategoryCard: {
    minHeight: 124,
    padding: 18,
  },
  onboardingCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  categoryCardImage: {
    height: 164,
    opacity: 0.12,
    position: 'absolute',
    right: -28,
    top: -32,
    width: 164,
  },
  categoryCardImageSelected: {
    opacity: 0.16,
  },
  categoryCardScrim: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.72,
  },
  compactCategoryCard: {
    padding: 14,
  },
  categoryCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  categoryGlyph: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  categoryGlyphImage: {
    height: '76%',
    width: '76%',
  },
  selectionMark: {
    color: '#6F6860',
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  selectionMarkActive: {
    color: '#FFFFFF',
  },
  categoryTitle: {
    color: '#171513',
    fontSize: 19,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  categoryDescription: {
    color: '#655F58',
    fontFamily: appFontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
    zIndex: 1,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#31473A',
    borderRadius: 8,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  smallButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D8CF',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  smallButtonText: {
    color: '#31473A',
    fontSize: 13,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.45,
  },
  textButton: {
    alignItems: 'center',
    padding: 10,
  },
  textButtonLabel: {
    color: '#7A4E42',
    fontSize: 15,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  backButton: {
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    color: '#655F58',
    fontSize: 14,
    fontFamily: appFontFamily,
    fontWeight: '700',
  },
  supportPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D8CF',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 22,
  },
  supportVisual: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  supportOrb: {
    alignItems: 'center',
    borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  supportOrbCenter: {
    marginHorizontal: -6,
    transform: [{ translateY: -8 }],
  },
  supportPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  price: {
    color: '#171513',
    fontSize: 44,
    fontFamily: appFontFamily,
    fontWeight: '900',
    textAlign: 'center',
  },
  supportBadge: {
    borderRadius: 8,
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  supportCopy: {
    color: '#655F58',
    fontFamily: appFontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 23,
    textAlign: 'center',
  },
  supportFinePrint: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    textAlign: 'center',
  },
  setupPreview: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
  },
  setupPreviewPhone: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    maxWidth: 260,
    padding: 16,
    width: '100%',
  },
  setupPreviewDate: {
    borderRadius: 999,
    height: 16,
    opacity: 0.74,
    width: 112,
  },
  setupPreviewTime: {
    borderRadius: 8,
    height: 46,
    opacity: 0.22,
    width: 154,
  },
  setupPreviewWidget: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 190,
  },
  stepsPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D8CF',
    borderWidth: 1,
    borderRadius: 8,
    gap: 14,
    padding: 18,
  },
  widgetPreviewPickerRow: {
    alignItems: 'center',
  },
  instructionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    backgroundColor: '#D9E6DD',
    borderRadius: 16,
    color: '#31473A',
    fontSize: 14,
    fontFamily: appFontFamily,
    fontWeight: '900',
    height: 32,
    lineHeight: 32,
    textAlign: 'center',
    width: 32,
  },
  stepText: {
    color: '#28231F',
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  quotePanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D8CF',
    borderWidth: 1,
    borderRadius: 8,
    gap: 22,
    marginTop: 8,
    padding: 26,
  },
  todayPanel: {
    borderRadius: 8,
    borderWidth: 2,
    gap: 24,
    justifyContent: 'center',
    marginBottom: 18,
    minHeight: 520,
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingVertical: 34,
    position: 'relative',
    shadowOffset: { height: 0, width: 0 },
    shadowRadius: 32,
    zIndex: 2,
  },
  todayPanelCalm: {
    alignItems: 'center',
  },
  todayPanelFuturistic: {
    alignItems: 'flex-start',
    paddingLeft: 44,
  },
  todayPanelNature: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingBottom: 48,
  },
  todayPanelIdle: {
    borderColor: 'rgba(85, 130, 93, 0.72)',
    shadowColor: '#6CA874',
    shadowOpacity: 0.24,
  },
  todayPanelPlaying: {
    borderColor: 'rgba(210, 179, 93, 0.86)',
    shadowColor: '#E7C760',
    shadowOpacity: 0.34,
  },
  todayPanelPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  todayPanelVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  todayCategoryWatermark: {
    bottom: 26,
    height: 220,
    opacity: 0.08,
    position: 'absolute',
    right: -36,
    width: 220,
  },
  todayPanelTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 2,
  },
  todayPanelTopCalm: {
    alignSelf: 'center',
  },
  todayPanelTopFuturistic: {
    alignSelf: 'flex-start',
  },
  todayPanelTopNature: {
    alignSelf: 'flex-start',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quoteText: {
    color: '#171513',
    fontSize: 29,
    fontFamily: appFontFamily,
    fontWeight: '800',
    lineHeight: 38,
  },
  todayQuoteText: {
    fontSize: 34,
    lineHeight: 44,
    maxWidth: 660,
    zIndex: 2,
  },
  referenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    zIndex: 2,
  },
  referenceRule: {
    borderRadius: 2,
    height: 2,
    width: 34,
  },
  reference: {
    color: '#7A4E42',
    fontSize: 16,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  playerPanel: {
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: '#E0D8CF',
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    overflow: 'hidden',
    padding: 18,
    position: 'relative',
  },
  playerHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
  },
  playOrbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  playOrb: {
    alignItems: 'center',
    borderRadius: 8,
    height: 106,
    justifyContent: 'center',
    width: 106,
  },
  playOrbText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: appFontFamily,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#171513',
    fontSize: 18,
    fontFamily: appFontFamily,
    fontWeight: '900',
  },
  mutedText: {
    color: '#655F58',
    fontFamily: appFontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  widgetPreview: {
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  widgetPreviewHeader: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    maxWidth: 360,
    zIndex: 10,
    width: '100%',
  },
  widgetLabel: {
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  previewSizeDropdownWrap: {
    alignItems: 'stretch',
    minWidth: 122,
    position: 'relative',
    zIndex: 20,
  },
  previewSizeDropdownButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    minHeight: 34,
    paddingHorizontal: 10,
  },
  previewSizeDropdownText: {
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '900',
  },
  previewSizeDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 38,
    zIndex: 30,
  },
  previewSizeDropdownOption: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  previewSizeDropdownOptionText: {
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  homeScreenPreviewFrame: {
    alignSelf: 'center',
    borderColor: 'rgba(255,255,255,0.68)',
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 392,
    overflow: 'hidden',
    padding: 18,
    position: 'relative',
    width: '100%',
  },
  homeScreenPreviewTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    opacity: 0.74,
  },
  homeScreenPreviewIsland: {
    borderRadius: 999,
    height: 10,
    opacity: 0.22,
    width: 54,
  },
  homeScreenPreviewStatusDots: {
    flexDirection: 'row',
    gap: 5,
  },
  homeScreenPreviewStatusDot: {
    borderRadius: 4,
    height: 8,
    opacity: 0.58,
    width: 8,
  },
  homeScreenPreviewGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    opacity: 0.4,
    padding: 18,
  },
  homeScreenPreviewIcon: {
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    width: 42,
  },
  homeScreenWidgetShadow: {
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  homeScreenPreviewDock: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderColor: 'rgba(255,255,255,0.52)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
    padding: 9,
  },
  homeScreenPreviewDockIcon: {
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    borderWidth: 1,
    height: 22,
    opacity: 0.76,
    width: 22,
  },
  widgetCard: {
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    maxWidth: 360,
    overflow: 'hidden',
    padding: 18,
    position: 'relative',
    width: '100%',
  },
  widgetGlassWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  widgetCardHome: {
    maxWidth: 320,
    minHeight: 216,
  },
  widgetCardCalm: {
    alignItems: 'center',
    minHeight: 220,
    paddingHorizontal: 24,
  },
  widgetCardIphone: {
    borderColor: 'rgba(255,255,255,0.72)',
    gap: 12,
    minHeight: 236,
    paddingBottom: 18,
    paddingLeft: 58,
    paddingRight: 18,
    paddingTop: 18,
  },
  widgetCardNature: {
    minHeight: 240,
    paddingBottom: 20,
    paddingTop: 24,
  },
  widgetCardTop: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  widgetCardKicker: {
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  widgetCardDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  widgetCardTopCalm: {
    justifyContent: 'center',
    gap: 8,
  },
  widgetCardTopFuturistic: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: '72%',
  },
  widgetCardTopNature: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    width: '62%',
  },
  widgetCardQuote: {
    fontSize: 20,
    fontFamily: appFontFamily,
    fontWeight: '700',
    lineHeight: 27,
  },
  widgetQuotePlate: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  widgetQuotePlateCalm: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  widgetQuotePlateFuturistic: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderColor: 'rgba(255,255,255,0.30)',
    padding: 12,
    width: '82%',
  },
  widgetQuotePlateNature: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
    padding: 10,
    width: '78%',
  },
  widgetCardQuoteCalm: {
    maxWidth: 270,
    textAlign: 'center',
  },
  widgetCardQuoteIphone: {
    fontSize: 21,
    fontFamily: appFontFamily,
    fontWeight: '600',
    lineHeight: 28,
    paddingTop: 4,
  },
  widgetCardQuoteNature: {
    fontSize: 22,
    fontFamily: appFontFamily,
    fontWeight: '700',
    lineHeight: 30,
    paddingRight: 26,
  },
  widgetCardFooter: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  widgetCardFooterNature: {
    marginTop: 'auto',
  },
  widgetCardFooterCalm: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetCardFooterFuturistic: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    justifyContent: 'space-between',
    padding: 8,
    width: '78%',
  },
  widgetCardMeta: {
    flex: 1,
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '700',
    opacity: 0.72,
  },
  widgetCardGlyph: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  lockScreenPreviewFrame: {
    alignSelf: 'center',
    backgroundColor: '#151821',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    maxWidth: 360,
    overflow: 'hidden',
    padding: 18,
    width: '100%',
  },
  lockScreenPreviewTop: {
    alignItems: 'center',
    gap: 2,
    paddingBottom: 8,
  },
  lockScreenDate: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 16,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  lockScreenTime: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 72,
    fontFamily: appFontFamily,
    fontWeight: '900',
    lineHeight: 78,
  },
  lockScreenWidgetSlot: {
    borderColor: 'rgba(255,255,255,0.34)',
    borderRadius: 8,
    borderWidth: 2,
    padding: 7,
  },
  lockWidgetCard: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 78,
    overflow: 'hidden',
    paddingHorizontal: 12,
    position: 'relative',
  },
  lockWidgetCardCalm: {
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  lockWidgetCardIphone: {
    borderColor: 'rgba(255,255,255,0.56)',
    gap: 8,
    paddingLeft: 42,
  },
  lockWidgetCardNature: {
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingRight: 10,
  },
  lockWidgetAccent: {
    borderRadius: 999,
    height: 36,
    opacity: 0.22,
    width: 5,
  },
  lockWidgetAccentCalm: {
    height: 46,
    opacity: 0.16,
    width: 46,
  },
  lockWidgetAccentFuturistic: {
    bottom: 12,
    height: 52,
    left: 16,
    opacity: 0.42,
    position: 'absolute',
    top: 12,
    width: 4,
  },
  lockWidgetAccentNature: {
    bottom: 0,
    height: 5,
    left: 14,
    opacity: 0.28,
    position: 'absolute',
    right: 14,
  },
  lockWidgetTextBlock: {
    flex: 1,
    gap: 3,
  },
  lockWidgetTextBlockFuturistic: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 8,
    flex: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  lockWidgetTextBlockNature: {
    paddingBottom: 4,
  },
  lockWidgetKicker: {
    fontSize: 10,
    fontFamily: appFontFamily,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  lockWidgetQuote: {
    fontSize: 14,
    fontFamily: appFontFamily,
    fontWeight: '800',
    lineHeight: 18,
  },
  lockWidgetGlyph: {
    alignItems: 'center',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  lockWidgetGlyphFuturistic: {
    borderRadius: 8,
    height: 36,
    width: 36,
  },
  lockWidgetGlyphNature: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    height: 40,
    width: 40,
  },
  lockWidgetFuturisticPane: {
    borderRadius: 8,
    borderWidth: 1,
    bottom: 8,
    left: 32,
    opacity: 0.22,
    position: 'absolute',
    top: 8,
    width: 128,
  },
  lockWidgetNatureHorizon: {
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    bottom: -24,
    height: 48,
    left: 18,
    opacity: 0.72,
    position: 'absolute',
    right: 24,
  },
  lockWidgetMeta: {
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    fontFamily: appFontFamily,
    fontWeight: '800',
    maxWidth: 300,
  },
  widgetStyleGrid: {
    gap: 10,
  },
  optionGroupTitle: {
    fontSize: 14,
    fontFamily: appFontFamily,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  widgetStyleOption: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  widgetStyleName: {
    fontSize: 15,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  widgetStyleSwatch: {
    borderRadius: 8,
    height: 22,
    width: 22,
  },
  visualStyleOption: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  visualStyleName: {
    fontSize: 16,
    fontFamily: appFontFamily,
    fontWeight: '800',
  },
  visualStyleDescription: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  styleGlyph: {
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    overflow: 'hidden',
    position: 'relative',
    width: 62,
  },
  styleGlyphCalm: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  styleGlyphIphone: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingTop: 7,
  },
  styleGlyphNature: {
    backgroundColor: '#F8FBF5',
  },
  styleGlyphRing: {
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    position: 'absolute',
    width: 28,
  },
  styleGlyphDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  styleGlyphLine: {
    borderRadius: 999,
    bottom: 9,
    height: 2,
    position: 'absolute',
    width: 36,
  },
  styleGlyphIsland: {
    alignSelf: 'center',
    backgroundColor: '#171513',
    borderRadius: 999,
    height: 8,
    width: 28,
  },
  styleGlyphGlassCard: {
    borderRadius: 6,
    height: 20,
    left: 8,
    position: 'absolute',
    right: 8,
    top: 18,
  },
  styleGlyphGlassLine: {
    borderRadius: 999,
    bottom: 6,
    height: 2,
    left: 14,
    position: 'absolute',
    right: 14,
  },
  styleGlyphSun: {
    borderRadius: 9,
    height: 18,
    position: 'absolute',
    right: 10,
    top: 8,
    width: 18,
  },
  styleGlyphHillBack: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    bottom: 0,
    height: 24,
    left: -8,
    position: 'absolute',
    right: 12,
  },
  styleGlyphHillFront: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    bottom: -7,
    height: 25,
    left: 12,
    opacity: 0.72,
    position: 'absolute',
    right: -8,
  },
  widgetCalmHalo: {
    borderRadius: 82,
    borderWidth: 1,
    height: 164,
    opacity: 0.72,
    position: 'absolute',
    top: 34,
    width: 164,
  },
  widgetIphoneChrome: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  widgetIphoneIsland: {
    backgroundColor: '#161411',
    borderRadius: 999,
    height: 14,
    width: 54,
  },
  widgetIphoneTime: {
    fontSize: 12,
    fontFamily: appFontFamily,
    fontWeight: '900',
    opacity: 0.62,
  },
  widgetFuturisticPane: {
    borderRadius: 8,
    borderWidth: 1,
    bottom: 28,
    left: 36,
    opacity: 0.18,
    position: 'absolute',
    top: 34,
    width: 174,
  },
  widgetFuturisticRail: {
    alignItems: 'center',
    borderRadius: 999,
    bottom: 20,
    gap: 18,
    justifyContent: 'center',
    left: 22,
    opacity: 0.5,
    position: 'absolute',
    top: 46,
    width: 8,
  },
  widgetFuturisticNode: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    height: 10,
    opacity: 0.78,
    width: 10,
  },
  widgetNatureSun: {
    borderRadius: 22,
    height: 44,
    opacity: 0.16,
    position: 'absolute',
    right: 24,
    top: 50,
    width: 44,
  },
  widgetNatureRidgeBack: {
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    bottom: -18,
    height: 86,
    left: -18,
    opacity: 0.76,
    position: 'absolute',
    right: 46,
  },
  widgetNatureRidgeFront: {
    borderTopLeftRadius: 140,
    borderTopRightRadius: 140,
    bottom: -28,
    height: 82,
    left: 74,
    opacity: 0.82,
    position: 'absolute',
    right: -26,
  },
  widgetMotionLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  widgetMotionAsset: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  widgetMotionAssetCalm: {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  widgetMotionAssetIphone: {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  widgetMotionAssetNature: {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  widgetCalmPatternCenter: {
    justifyContent: 'center',
  },
  widgetCalmPatternRail: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  widgetCalmPatternLow: {
    justifyContent: 'flex-end',
    paddingTop: 42,
  },
  widgetCalmPatternBreath: {
    justifyContent: 'center',
    paddingVertical: 30,
  },
  widgetCalmPatternQuiet: {
    justifyContent: 'space-around',
  },
  widgetIphonePatternCompact: {
    paddingBottom: 18,
  },
  widgetIphonePatternPoster: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  widgetIphonePatternStack: {
    justifyContent: 'space-between',
  },
  widgetIphonePatternFloat: {
    paddingTop: 26,
  },
  widgetIphonePatternDock: {
    justifyContent: 'flex-end',
  },
  widgetNaturePatternHorizon: {
    justifyContent: 'space-between',
  },
  widgetNaturePatternCanopy: {
    paddingBottom: 26,
    paddingTop: 32,
  },
  widgetNaturePatternTrail: {
    justifyContent: 'center',
  },
  widgetNaturePatternMeadow: {
    paddingBottom: 20,
  },
  widgetNaturePatternSunrise: {
    justifyContent: 'space-around',
  },
  widgetQuoteLeft: {
    alignSelf: 'flex-start',
    maxWidth: 250,
    textAlign: 'left',
  },
  widgetQuoteRight: {
    alignSelf: 'flex-end',
    maxWidth: 252,
    textAlign: 'right',
  },
  widgetQuoteNarrow: {
    maxWidth: 220,
  },
  widgetQuoteWide: {
    maxWidth: 292,
  },
  widgetQuoteLarge: {
    fontSize: 23,
    lineHeight: 31,
  },
  widgetQuoteSmall: {
    fontSize: 19,
    lineHeight: 26,
  },
  widgetNatureFooterLifted: {
    marginBottom: 18,
  },
  widgetNatureFooterLow: {
    marginTop: 24,
  },
  patternCalmRing: {
    borderRadius: 120,
    borderWidth: 1,
    opacity: 0.42,
    position: 'absolute',
  },
  patternCalmRingOne: {
    height: 180,
    left: 78,
    top: 24,
    width: 180,
  },
  patternCalmRingTwo: {
    height: 138,
    left: 18,
    top: 72,
    width: 138,
  },
  patternCalmRingThree: {
    height: 210,
    right: -74,
    top: 8,
    width: 210,
  },
  patternCalmRingFour: {
    bottom: 24,
    height: 150,
    left: 82,
    width: 150,
  },
  patternCalmRingFive: {
    height: 118,
    right: 42,
    top: 64,
    width: 118,
  },
  patternCalmLine: {
    borderRadius: 999,
    height: 2,
    opacity: 0.18,
    position: 'absolute',
  },
  patternCalmLineOne: {
    left: 34,
    top: 62,
    width: 170,
  },
  patternCalmLineTwo: {
    bottom: 54,
    right: 24,
    width: 138,
  },
  patternCalmLineThree: {
    left: 70,
    top: 150,
    width: 210,
  },
  patternCalmLineFour: {
    bottom: 86,
    left: 18,
    width: 118,
  },
  patternCalmLineFive: {
    right: 42,
    top: 96,
    width: 148,
  },
  patternCalmDot: {
    borderRadius: 16,
    height: 32,
    opacity: 0.34,
    position: 'absolute',
    width: 32,
  },
  patternCalmDotOne: {
    right: 38,
    top: 38,
  },
  patternCalmDotTwo: {
    bottom: 38,
    left: 44,
  },
  patternCalmDotThree: {
    bottom: 74,
    right: 72,
  },
  patternCalmDotFour: {
    left: 36,
    top: 52,
  },
  patternCalmDotFive: {
    bottom: 48,
    right: 34,
  },
  patternGlassPane: {
    borderRadius: 26,
    height: 90,
    opacity: 0.2,
    position: 'absolute',
    width: 180,
  },
  patternGlassPaneOne: {
    right: -34,
    top: 20,
  },
  patternGlassPaneTwo: {
    left: -44,
    top: 54,
  },
  patternGlassPaneThree: {
    bottom: 26,
    right: 18,
  },
  patternGlassPaneFour: {
    left: 34,
    top: 18,
  },
  patternGlassPaneFive: {
    bottom: 36,
    left: -28,
  },
  patternGlassLine: {
    borderRadius: 999,
    height: 3,
    opacity: 0.2,
    position: 'absolute',
    width: 170,
  },
  patternGlassLineOne: {
    right: -18,
    top: 78,
  },
  patternGlassLineTwo: {
    left: 22,
    top: 42,
  },
  patternGlassLineThree: {
    bottom: 64,
    right: 28,
  },
  patternGlassLineFour: {
    left: -10,
    top: 126,
  },
  patternGlassLineFive: {
    bottom: 40,
    left: 48,
  },
  patternGlassDotGrid: {
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    opacity: 0.18,
    position: 'absolute',
    right: 22,
    top: 32,
    width: 46,
  },
  patternNatureArc: {
    borderRadius: 100,
    borderWidth: 2,
    opacity: 0.2,
    position: 'absolute',
  },
  patternNatureArcOne: {
    height: 122,
    right: -34,
    top: 42,
    width: 122,
  },
  patternNatureArcTwo: {
    height: 152,
    left: -42,
    top: 20,
    width: 152,
  },
  patternNatureArcThree: {
    bottom: 22,
    height: 116,
    right: 28,
    width: 116,
  },
  patternNatureArcFour: {
    bottom: 40,
    height: 170,
    left: 36,
    width: 170,
  },
  patternNatureArcFive: {
    height: 98,
    right: 50,
    top: 18,
    width: 98,
  },
  patternNatureLeaf: {
    borderBottomLeftRadius: 26,
    borderTopRightRadius: 26,
    height: 54,
    opacity: 0.28,
    position: 'absolute',
    width: 34,
  },
  patternNatureLeafOne: {
    right: 34,
    top: 96,
  },
  patternNatureLeafTwo: {
    left: 36,
    top: 74,
  },
  patternNatureLeafThree: {
    bottom: 70,
    right: 76,
  },
  patternNatureLeafFour: {
    left: 88,
    top: 34,
  },
  patternNatureLeafFive: {
    bottom: 48,
    left: 48,
  },
  patternNatureTrail: {
    borderRadius: 999,
    height: 3,
    opacity: 0.28,
    position: 'absolute',
    width: 180,
  },
  patternNatureTrailOne: {
    bottom: 92,
    left: 26,
  },
  patternNatureTrailTwo: {
    right: 22,
    top: 74,
  },
  patternNatureTrailThree: {
    bottom: 56,
    right: 18,
  },
  patternNatureTrailFour: {
    left: 48,
    top: 108,
  },
  patternNatureTrailFive: {
    bottom: 112,
    left: 8,
  },
  widgetGlow: {
    borderRadius: 70,
    height: 140,
    opacity: 0.48,
    position: 'absolute',
    right: -34,
    top: -46,
    width: 140,
  },
  widgetFlowLine: {
    borderRadius: 999,
    height: 2,
    left: -24,
    opacity: 0.32,
    position: 'absolute',
    top: 54,
    width: 210,
  },
  widgetFlowLineIphone: {
    height: 3,
    opacity: 0.24,
    top: 38,
  },
  widgetFlowLineSecond: {
    left: 48,
    opacity: 0.18,
    top: 126,
    width: 190,
  },
  widgetHorizon: {
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    bottom: -34,
    height: 74,
    left: -12,
    opacity: 0.76,
    position: 'absolute',
    right: -12,
  },
});

const calmCardPatternStyles = [
  styles.widgetCalmPatternCenter,
  styles.widgetCalmPatternRail,
  styles.widgetCalmPatternLow,
  styles.widgetCalmPatternBreath,
  styles.widgetCalmPatternQuiet,
] as const;

const calmQuotePatternStyles = [
  styles.widgetQuoteWide,
  styles.widgetQuoteLeft,
  styles.widgetQuoteRight,
  styles.widgetQuoteNarrow,
  styles.widgetQuoteLarge,
] as const;

const iphoneCardPatternStyles = [
  styles.widgetIphonePatternCompact,
  styles.widgetIphonePatternPoster,
  styles.widgetIphonePatternStack,
  styles.widgetIphonePatternFloat,
  styles.widgetIphonePatternDock,
] as const;

const iphoneQuotePatternStyles = [
  styles.widgetQuoteWide,
  styles.widgetQuoteLarge,
  styles.widgetQuoteLeft,
  styles.widgetQuoteRight,
  styles.widgetQuoteSmall,
] as const;

const natureCardPatternStyles = [
  styles.widgetNaturePatternHorizon,
  styles.widgetNaturePatternCanopy,
  styles.widgetNaturePatternTrail,
  styles.widgetNaturePatternMeadow,
  styles.widgetNaturePatternSunrise,
] as const;

const natureQuotePatternStyles = [
  styles.widgetQuoteWide,
  styles.widgetQuoteLeft,
  styles.widgetQuoteRight,
  styles.widgetQuoteNarrow,
  styles.widgetQuoteLarge,
] as const;

const natureFooterPatternStyles = [
  styles.widgetNatureFooterLow,
  styles.widgetNatureFooterLifted,
  styles.widgetNatureFooterLow,
  styles.widgetNatureFooterLifted,
  styles.widgetNatureFooterLow,
] as const;

const calmPatternRingStyles = [
  styles.patternCalmRingOne,
  styles.patternCalmRingTwo,
  styles.patternCalmRingThree,
  styles.patternCalmRingFour,
  styles.patternCalmRingFive,
] as const;

const calmPatternLineStyles = [
  styles.patternCalmLineOne,
  styles.patternCalmLineTwo,
  styles.patternCalmLineThree,
  styles.patternCalmLineFour,
  styles.patternCalmLineFive,
] as const;

const calmPatternDotStyles = [
  styles.patternCalmDotOne,
  styles.patternCalmDotTwo,
  styles.patternCalmDotThree,
  styles.patternCalmDotFour,
  styles.patternCalmDotFive,
] as const;

const iphonePatternPaneStyles = [
  styles.patternGlassPaneOne,
  styles.patternGlassPaneTwo,
  styles.patternGlassPaneThree,
  styles.patternGlassPaneFour,
  styles.patternGlassPaneFive,
] as const;

const iphonePatternLineStyles = [
  styles.patternGlassLineOne,
  styles.patternGlassLineTwo,
  styles.patternGlassLineThree,
  styles.patternGlassLineFour,
  styles.patternGlassLineFive,
] as const;

const naturePatternArcStyles = [
  styles.patternNatureArcOne,
  styles.patternNatureArcTwo,
  styles.patternNatureArcThree,
  styles.patternNatureArcFour,
  styles.patternNatureArcFive,
] as const;

const naturePatternLeafStyles = [
  styles.patternNatureLeafOne,
  styles.patternNatureLeafTwo,
  styles.patternNatureLeafThree,
  styles.patternNatureLeafFour,
  styles.patternNatureLeafFive,
] as const;

const naturePatternTrailStyles = [
  styles.patternNatureTrailOne,
  styles.patternNatureTrailTwo,
  styles.patternNatureTrailThree,
  styles.patternNatureTrailFour,
  styles.patternNatureTrailFive,
] as const;
