import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
const onboardingKey = 'isOnboardingCompleted';
const categories: QuoteCategory[] = ['Meditation', 'Bible', 'Quote'];
const appDisplayName = 'QuoteVerse';
type WidgetColorTheme = 'dawn' | 'sage' | 'night' | 'lavender' | 'candle';
type WidgetVisualStyle = 'calm' | 'iphone' | 'nature';

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
    label: 'iPhone',
    description: 'Glass-like layers with a modern system feel.',
  },
  nature: {
    label: 'Nature',
    description: 'Organic motion with softer placement.',
  },
};

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

const widgetMotionAssets: Record<WidgetVisualStyle, number> = {
  calm: require('./assets/images/widget-motion-calm.jpg'),
  iphone: require('./assets/images/widget-motion-iphone.jpg'),
  nature: require('./assets/images/widget-motion-nature.jpg'),
};

type CategoryTheme = (typeof categoryThemes)[QuoteCategory];

type PlaybackState = {
  isPlaying: boolean;
  bgMusicTrack: string;
  voiceoverTrack: string;
  selection?: QuoteOrVerse;
};

function WidgetMotionLayer({
  colorTheme,
  visualStyle,
  category,
}: {
  colorTheme: WidgetColorTheme;
  visualStyle: WidgetVisualStyle;
  category: QuoteCategory;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const option = widgetColorThemes[colorTheme];
  const categoryTheme = categoryThemes[category];

  useEffect(() => {
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
  }, [drift, visualStyle]);

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
  const motionAssetTransform = visualStyle === 'iphone'
    ? [{ translateX: assetTranslateX }, { rotate: '-10deg' }, { scale }]
    : visualStyle === 'nature'
      ? [{ translateY: assetTranslateY }, { scale }]
      : [{ translateX: assetTranslateX }, { translateY: assetTranslateY }, { rotate: assetRotate }, { scale }];

  return (
    <View pointerEvents="none" style={styles.widgetMotionLayer}>
      <Animated.Image
        resizeMode="cover"
        source={widgetMotionAssets[visualStyle]}
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
    </View>
  );
}

function useStoredAppState() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [preferredCategories, setPreferredCategoriesState] = useState<QuoteCategory[]>(['Meditation']);
  const [widgetColorTheme, setWidgetColorThemeState] = useState<WidgetColorTheme>('dawn');
  const [widgetVisualStyle, setWidgetVisualStyleState] = useState<WidgetVisualStyle>('calm');
  const [isOnboardingCompleted, setOnboardingCompletedState] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const [storedPreference, storedOnboarding] = await Promise.all([
        getStoredValue(preferenceKey),
        getStoredValue(onboardingKey),
      ]);
      const legacyPreference = await getStoredValue(legacyPreferenceKey);
      const storedWidgetColorTheme = await getStoredValue(widgetColorThemeKey);
      const legacyWidgetStyle = await getStoredValue(legacyWidgetStyleKey);
      const storedWidgetVisualStyle = await getStoredValue(widgetVisualStyleKey);

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

      setOnboardingCompletedState(storedOnboarding === 'true');
      setIsHydrated(true);
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

  return {
    isHydrated,
    preferredCategories,
    setPreferredCategories,
    widgetColorTheme,
    setWidgetColorTheme,
    widgetVisualStyle,
    setWidgetVisualStyle,
    isOnboardingCompleted,
    setOnboardingCompleted,
  };
}

export default function App() {
  const {
    isHydrated,
    preferredCategories,
    setPreferredCategories,
    widgetColorTheme,
    setWidgetColorTheme,
    widgetVisualStyle,
    setWidgetVisualStyle,
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

  const activeCategory = dailySelection?.category ?? preferredCategories[0] ?? 'Meditation';
  const activeTheme = categoryThemes[activeCategory];
  const selectedCategoryLabels = useMemo(
    () => preferredCategories.map((category) => categoryLabels[category]).join(', '),
    [preferredCategories]
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
    if (parsed.protocol !== 'quoteverse:') {
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

  const widgetURL = useMemo(() => {
    if (!dailySelection) {
      return '';
    }

    return `quoteverse://play?category=${dailySelection.category}&id=${dailySelection.id}`;
  }, [dailySelection]);

  if (!isHydrated) {
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
          previewSelection={dailySelection}
          onToggleCategory={togglePreferredCategory}
          onSelectWidgetColorTheme={setWidgetColorTheme}
          onSelectWidgetVisualStyle={setWidgetVisualStyle}
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
          previewSelection={dailySelection}
          onToggleCategory={togglePreferredCategory}
          onSelectWidgetColorTheme={setWidgetColorTheme}
          onSelectWidgetVisualStyle={setWidgetVisualStyle}
          onDone={() => setIsPreferencesOpen(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: activeTheme.background }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.backgroundWash, { backgroundColor: activeTheme.accentSoft }]} />
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

        {dailySelection ? (
          <View style={[styles.quotePanel, { borderColor: activeTheme.hairline }]}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryThemes[dailySelection.category].accentSoft }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryThemes[dailySelection.category].accent }]}>
                {categoryLabels[dailySelection.category]}
              </Text>
            </View>
            <Text style={[styles.quoteText, { color: activeTheme.ink }]}>
              {dailySelection.text}
            </Text>
            <View style={styles.referenceRow}>
              <View style={[styles.referenceRule, { backgroundColor: activeTheme.accent }]} />
              <Text style={[styles.reference, { color: activeTheme.accent }]}>
                {dailySelection.referenceOrAuthor}
              </Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.playerPanel,
            {
              backgroundColor: widgetColorThemes[widgetColorTheme].background,
              borderColor: widgetColorThemes[widgetColorTheme].accent,
            },
          ]}
        >
          <WidgetMotionLayer colorTheme={widgetColorTheme} visualStyle={widgetVisualStyle} category={activeCategory} />
          <View style={styles.playerHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: widgetColorThemes[widgetColorTheme].foreground }]}>
                Listen
              </Text>
              <Text style={[styles.mutedText, { color: widgetColorThemes[widgetColorTheme].foreground, opacity: 0.68 }]}>
                Take one quiet minute
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: widgetColorThemes[widgetColorTheme].glow }]}>
              <Text style={[styles.statusBadgeText, { color: widgetColorThemes[widgetColorTheme].foreground }]}>
                {playback.isPlaying ? 'Playing' : 'Ready'}
              </Text>
            </View>
          </View>

          <View style={styles.playOrbWrap}>
            <Pressable
              style={[
                styles.playOrb,
                { backgroundColor: widgetColorThemes[widgetColorTheme].accent },
                !dailySelection && styles.disabledButton,
              ]}
              disabled={!dailySelection}
              onPress={togglePlayback}
            >
              <Text style={styles.playOrbText}>{playback.isPlaying ? 'Pause' : 'Play'}</Text>
            </Pressable>
          </View>
          <PlaybackPill playback={playback} />
        </View>

        <View style={styles.widgetPreview}>
          <View style={styles.widgetPreviewHeader}>
            <Text style={[styles.widgetLabel, { color: activeTheme.muted }]}>Home Screen Widget</Text>
            <Pressable disabled={!dailySelection} onPress={() => widgetURL && handleDeepLink(widgetURL)}>
              <Text style={[styles.previewWidgetText, { color: activeTheme.accent }]}>Preview</Text>
            </Pressable>
          </View>
          <WidgetPreviewCard
            widgetColorTheme={widgetColorTheme}
            widgetVisualStyle={widgetVisualStyle}
            category={activeCategory}
            selectedLabels={selectedCategoryLabels}
            selection={dailySelection}
          />
        </View>
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
  previewSelection,
  onToggleCategory,
  onSelectWidgetColorTheme,
  onSelectWidgetVisualStyle,
  onNext,
  onBack,
  onComplete,
}: {
  step: number;
  selectedCategories: QuoteCategory[];
  activeCategory: QuoteCategory;
  widgetColorTheme: WidgetColorTheme;
  widgetVisualStyle: WidgetVisualStyle;
  previewSelection?: QuoteOrVerse;
  onToggleCategory: (category: QuoteCategory) => void;
  onSelectWidgetColorTheme: (style: WidgetColorTheme) => void;
  onSelectWidgetVisualStyle: (style: WidgetVisualStyle) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  const theme = categoryThemes[activeCategory];
  const selectedLabels = selectedCategories.map((category) => categoryLabels[category]).join(', ');

  if (step === 0) {
    return (
      <ImageBackground
        source={categoryHeroImages[activeCategory]}
        style={styles.introHeroScreen}
        imageStyle={styles.introHeroImage}
      >
        <View style={[styles.introHeroVeil, { backgroundColor: theme.background }]} />
        <View style={styles.introHeroTop}>
          <ProgressDots step={step} total={5} color={theme.accent} softColor="rgba(255,255,255,0.44)" />
          <Text style={styles.introHeroBrand}>{appDisplayName}</Text>
        </View>

        <View style={styles.introHeroVisualWrap}>
          <IntroAnimation />
          <View style={styles.introImageRail}>
            {categories.map((category) => (
              <ImageBackground
                key={category}
                source={categoryHeroImages[category]}
                style={[
                  styles.introImageTile,
                  category === activeCategory && styles.introImageTileActive,
                ]}
                imageStyle={styles.introImageTileImage}
              >
                <View style={styles.introImageTileScrim} />
                <Text style={styles.introImageTileText}>{categoryLabels[category]}</Text>
              </ImageBackground>
            ))}
          </View>
        </View>

        <View style={styles.introHeroCopyBlock}>
          <Text style={styles.introHeroTitle}>Listen. Reflect. Return.</Text>
          <Text style={styles.introHeroCopy}>One daily moment with audio and a widget.</Text>
          <View style={styles.introHeroChips}>
            {['Daily', 'Audio', 'Widget'].map((label) => (
              <View key={label} style={styles.introHeroChip}>
                <Text style={styles.introHeroChipText}>{label}</Text>
              </View>
            ))}
          </View>
          <Pressable style={[styles.primaryButton, styles.introHeroButton, { backgroundColor: theme.accent }]} onPress={onNext}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={styles.onboardingContent}>
        <ProgressDots step={step} total={5} color={theme.accent} softColor={theme.accentSoft} />
        <Text style={[styles.appName, { color: theme.accent }]}>{appDisplayName}</Text>
        <Text style={[styles.heroTitle, { color: theme.ink }]}>Choose your daily focus.</Text>
        <Text style={[styles.screenSubtitle, { color: theme.muted }]}>
          Pick one or more.
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
                  { borderColor: isSelected ? cardTheme.accent : '#E0D8CF' },
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
                    {isSelected ? 'Selected' : 'Tap to add'}
                  </Text>
                </View>
                <Text style={[styles.categoryDescription, isSelected && styles.selectedText]}>
                  {category === 'Meditation'
                    ? 'Breath + calm'
                    : category === 'Bible'
                      ? 'Verse + prayer'
                      : 'Words + clarity'}
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
        <Text style={[styles.appName, { color: theme.accent }]}>Widget Preview</Text>
        <Text style={[styles.heroTitle, { color: theme.ink }]}>Make it feel at home.</Text>
        <Text style={[styles.screenSubtitle, { color: theme.muted }]}>
          Preview how today&apos;s reflection can sit on your screen. You can refine this later.
        </Text>
        <WidgetPreviewCard
          widgetColorTheme={widgetColorTheme}
          widgetVisualStyle={widgetVisualStyle}
          category={activeCategory}
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
        <Text style={[styles.appName, { color: theme.accent }]}>Optional Support</Text>
        <Text style={[styles.heroTitle, { color: theme.ink }]}>Help the library grow.</Text>
        <View style={[styles.supportPanel, { borderColor: theme.hairline }]}>
          <Text style={[styles.price, { color: theme.ink }]}>$1.99</Text>
          <Text style={styles.supportCopy}>
            A one-time tip that supports the app and helps extend the meditation,
            Bible verse, quote, voiceover, and ambient audio libraries.
          </Text>
          <Text style={[styles.supportFinePrint, { color: theme.muted }]}>
            No subscription. No account required. The app still works if you skip; this is simply
            a way to partner with the project.
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
      <Text style={[styles.appName, { color: theme.accent }]}>Widget Setup</Text>
      <Text style={[styles.heroTitle, { color: theme.ink }]}>Add your daily moment.</Text>
      <Text style={[styles.screenSubtitle, { color: theme.muted }]}>
        Your widget becomes a one-tap path back to today&apos;s reflection.
      </Text>
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
  previewSelection,
  onToggleCategory,
  onSelectWidgetColorTheme,
  onSelectWidgetVisualStyle,
  onDone,
}: {
  selectedCategories: QuoteCategory[];
  activeCategory: QuoteCategory;
  widgetColorTheme: WidgetColorTheme;
  widgetVisualStyle: WidgetVisualStyle;
  previewSelection?: QuoteOrVerse;
  onToggleCategory: (category: QuoteCategory) => void;
  onSelectWidgetColorTheme: (style: WidgetColorTheme) => void;
  onSelectWidgetVisualStyle: (style: WidgetVisualStyle) => void;
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
        <WidgetPreviewCard
          widgetColorTheme={widgetColorTheme}
          widgetVisualStyle={widgetVisualStyle}
          category={activeCategory}
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
      <View style={[styles.motionToken, styles.motionTokenMeditation]}>
        <CategoryGlyph category="Meditation" selected />
      </View>
      <View style={[styles.motionToken, styles.motionTokenBible]}>
        <CategoryGlyph category="Bible" selected />
      </View>
      <View style={[styles.motionToken, styles.motionTokenQuote]}>
        <CategoryGlyph category="Quote" selected />
      </View>
    </View>
  );
}

function CategoryGlyph({ category, selected }: { category: QuoteCategory; selected: boolean }) {
  const theme = categoryThemes[category];
  const color = selected ? '#FFFFFF' : theme.accent;

  if (category === 'Bible') {
    return (
      <View style={styles.bookIcon}>
        <View style={[styles.bookPage, { borderColor: color }]} />
        <View style={[styles.bookPage, { borderColor: color }]} />
      </View>
    );
  }

  if (category === 'Quote') {
    return (
      <View style={styles.quoteIcon}>
        <View style={[styles.quoteStroke, { backgroundColor: color }]} />
        <View style={[styles.quoteStroke, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.leafIcon}>
      <View style={[styles.leafShape, { borderColor: color }]} />
      <View style={[styles.leafStem, { backgroundColor: color }]} />
    </View>
  );
}

function WidgetPreviewCard({
  widgetColorTheme,
  widgetVisualStyle,
  category,
  selectedLabels,
  selection,
}: {
  widgetColorTheme: WidgetColorTheme;
  widgetVisualStyle: WidgetVisualStyle;
  category: QuoteCategory;
  selectedLabels: string;
  selection?: QuoteOrVerse;
}) {
  const option = widgetColorThemes[widgetColorTheme];
  const previewCategory = selection?.category ?? category;
  const categoryTheme = categoryThemes[previewCategory];
  const isIphone = widgetVisualStyle === 'iphone';
  const isNature = widgetVisualStyle === 'nature';
  const previewMeta = selection?.referenceOrAuthor ?? selectedLabels;

  return (
    <View
      style={[
        styles.widgetCard,
        widgetVisualStyle === 'calm' && styles.widgetCardCalm,
        isIphone && styles.widgetCardIphone,
        isNature && styles.widgetCardNature,
        { backgroundColor: option.background, borderColor: option.accent },
      ]}
    >
      <WidgetMotionLayer colorTheme={widgetColorTheme} visualStyle={widgetVisualStyle} category={previewCategory} />
      {widgetVisualStyle === 'calm' ? (
        <View style={[styles.widgetCalmHalo, { borderColor: categoryTheme.accentSoft }]} />
      ) : null}
      {isIphone ? (
        <View style={styles.widgetIphoneChrome}>
          <View style={styles.widgetIphoneIsland} />
          <Text style={[styles.widgetIphoneTime, { color: option.foreground }]}>9:41</Text>
        </View>
      ) : null}
      {isNature ? (
        <>
          <View style={[styles.widgetNatureSun, { backgroundColor: option.accent }]} />
          <View style={[styles.widgetNatureRidgeBack, { backgroundColor: categoryTheme.accentSoft }]} />
          <View style={[styles.widgetNatureRidgeFront, { backgroundColor: option.glow }]} />
        </>
      ) : null}
      <View style={styles.widgetCardTop}>
        <Text style={[styles.widgetCardKicker, { color: option.accent }]}>Today</Text>
        <View style={[styles.widgetCardDot, { backgroundColor: option.accent }]} />
      </View>
      <Text
        style={[
          styles.widgetCardQuote,
          widgetVisualStyle === 'calm' && styles.widgetCardQuoteCalm,
          isIphone && styles.widgetCardQuoteIphone,
          isNature && styles.widgetCardQuoteNature,
          { color: option.foreground },
        ]}
      >
        {selection?.text ?? 'Let the next breath be simple enough to trust.'}
      </Text>
      <View style={[styles.widgetCardFooter, isNature && styles.widgetCardFooterNature]}>
        <Text style={[styles.widgetCardMeta, { color: option.foreground }]}>{previewMeta}</Text>
        <View style={[styles.widgetCardGlyph, { backgroundColor: categoryTheme.accentSoft }]}>
          <CategoryGlyph category={previewCategory} selected={false} />
        </View>
      </View>
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

function PlaybackPill({ playback }: { playback: PlaybackState }) {
  return (
    <View style={styles.playbackPill}>
      <Text style={styles.playbackDetail}>
        {playback.isPlaying ? 'Your reflection is playing.' : 'Ready when you want a quiet minute.'}
      </Text>
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
    padding: 22,
    gap: 18,
    position: 'relative',
  },
  backgroundWash: {
    borderBottomLeftRadius: 48,
    height: 210,
    left: 0,
    opacity: 0.62,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 12,
  },
  eyebrow: {
    color: '#7A4E42',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#171513',
    fontSize: 32,
    fontWeight: '800',
  },
  appName: {
    color: '#7A4E42',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#171513',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  screenSubtitle: {
    fontSize: 16,
    lineHeight: 23,
    marginTop: -10,
  },
  onboardingContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
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
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 22,
  },
  introHeroImage: {
    opacity: 0.92,
  },
  introHeroVeil: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  introHeroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  introHeroBrand: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.24)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 8,
    textTransform: 'uppercase',
  },
  introHeroVisualWrap: {
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
  },
  introImageRail: {
    flexDirection: 'row',
    gap: 10,
  },
  introImageTile: {
    borderColor: 'rgba(255,255,255,0.48)',
    borderRadius: 8,
    borderWidth: 1,
    height: 72,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 8,
    width: 82,
  },
  introImageTileActive: {
    borderColor: '#FFFFFF',
    transform: [{ translateY: -6 }],
  },
  introImageTileImage: {
    borderRadius: 8,
  },
  introImageTileScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  introImageTileText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4,
  },
  introHeroCopyBlock: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderColor: 'rgba(255,255,255,0.78)',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    overflow: 'hidden',
    padding: 20,
  },
  introHeroTitle: {
    color: '#171513',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 42,
  },
  introHeroCopy: {
    color: '#4F4942',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  introHeroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  introHeroChip: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderColor: 'rgba(255,255,255,0.82)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  introHeroChipText: {
    color: '#2D2A25',
    fontSize: 12,
    fontWeight: '900',
  },
  introHeroButton: {
    marginTop: 2,
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
    padding: 18,
    gap: 8,
  },
  compactCategoryCard: {
    padding: 14,
  },
  categoryCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  categoryGlyph: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  leafIcon: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  leafShape: {
    borderRadius: 10,
    borderTopLeftRadius: 2,
    borderWidth: 2,
    height: 17,
    transform: [{ rotate: '-35deg' }],
    width: 17,
  },
  leafStem: {
    borderRadius: 1,
    height: 16,
    position: 'absolute',
    transform: [{ rotate: '42deg' }],
    width: 2,
  },
  bookIcon: {
    flexDirection: 'row',
    gap: 2,
  },
  bookPage: {
    borderRadius: 3,
    borderWidth: 2,
    height: 20,
    width: 12,
  },
  quoteIcon: {
    flexDirection: 'row',
    gap: 5,
  },
  quoteStroke: {
    borderRadius: 3,
    height: 18,
    width: 6,
  },
  selectionMark: {
    color: '#6F6860',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  selectionMarkActive: {
    color: '#FFFFFF',
  },
  categoryTitle: {
    color: '#171513',
    fontSize: 19,
    fontWeight: '800',
  },
  categoryDescription: {
    color: '#655F58',
    fontSize: 15,
    lineHeight: 21,
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
    fontWeight: '800',
  },
  backButton: {
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    color: '#655F58',
    fontSize: 14,
    fontWeight: '700',
  },
  supportPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D8CF',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 22,
  },
  price: {
    color: '#171513',
    fontSize: 44,
    fontWeight: '900',
  },
  supportCopy: {
    color: '#655F58',
    fontSize: 16,
    lineHeight: 23,
  },
  supportFinePrint: {
    fontSize: 13,
    lineHeight: 19,
  },
  stepsPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D8CF',
    borderWidth: 1,
    borderRadius: 8,
    gap: 14,
    padding: 18,
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
    fontWeight: '900',
    height: 32,
    lineHeight: 32,
    textAlign: 'center',
    width: 32,
  },
  stepText: {
    color: '#28231F',
    flex: 1,
    fontSize: 16,
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
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quoteText: {
    color: '#171513',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 38,
  },
  referenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  referenceRule: {
    borderRadius: 2,
    height: 2,
    width: 34,
  },
  reference: {
    color: '#7A4E42',
    fontSize: 16,
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
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
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
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#171513',
    fontSize: 18,
    fontWeight: '900',
  },
  mutedText: {
    color: '#655F58',
    fontSize: 14,
    lineHeight: 20,
  },
  playbackPill: {
    backgroundColor: '#F8F7F4',
    borderRadius: 8,
    gap: 4,
    padding: 14,
  },
  playbackDetail: {
    color: '#655F58',
    fontSize: 13,
  },
  widgetPreview: {
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  widgetPreviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  widgetLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  previewWidgetText: {
    fontSize: 13,
    fontWeight: '800',
  },
  widgetCard: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    overflow: 'hidden',
    padding: 18,
    position: 'relative',
  },
  widgetCardCalm: {
    alignItems: 'center',
    minHeight: 220,
    paddingHorizontal: 24,
  },
  widgetCardIphone: {
    borderColor: 'rgba(255,255,255,0.72)',
    gap: 14,
    minHeight: 236,
    padding: 20,
  },
  widgetCardNature: {
    minHeight: 240,
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
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  widgetCardDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  widgetCardQuote: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 27,
  },
  widgetCardQuoteCalm: {
    maxWidth: 270,
    textAlign: 'center',
  },
  widgetCardQuoteIphone: {
    fontSize: 21,
    fontWeight: '600',
    lineHeight: 28,
    paddingTop: 4,
  },
  widgetCardQuoteNature: {
    fontSize: 22,
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
  widgetCardMeta: {
    flex: 1,
    fontSize: 12,
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
  widgetStyleGrid: {
    gap: 10,
  },
  optionGroupTitle: {
    fontSize: 14,
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
    fontWeight: '900',
    opacity: 0.62,
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
    borderRadius: 8,
    position: 'absolute',
  },
  widgetMotionAssetCalm: {
    height: 174,
    left: '50%',
    marginLeft: -87,
    top: 28,
    width: 174,
  },
  widgetMotionAssetIphone: {
    height: 152,
    left: -54,
    top: 18,
    width: 270,
  },
  widgetMotionAssetNature: {
    bottom: -24,
    height: 136,
    left: -24,
    width: 268,
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
