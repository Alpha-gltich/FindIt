import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Fonts } from '../constants/colors';

type LogoSize = 'small' | 'large';

interface LogoProps {
  size?: LogoSize;
  showTagline?: boolean;
  animate?: boolean;
}

const LETTERS = ['F', 'i', 'n', 'd', 'I', 't'];

/** Single place to swap the final logo file when the owner supplies it. */
export default function Logo({
  size = 'small',
  showTagline = false,
  animate = false,
}: LogoProps) {
  const large = size === 'large';
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(0.72)).current;
  const badgeOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const letterAnims = useRef(
    LETTERS.map(() => new Animated.Value(animate ? 0 : 1))
  ).current;

  useEffect(() => {
    let active = true;

    const setFinalState = () => {
      introOpacity.setValue(0);
      introScale.setValue(1);
      badgeOpacity.setValue(1);
      letterAnims.forEach((value) => value.setValue(1));
    };

    const run = (reduced: boolean) => {
      if (!active) return;

      if (!animate || reduced) {
        setFinalState();
        return;
      }

      introOpacity.setValue(0);
      introScale.setValue(0.72);
      badgeOpacity.setValue(0);
      letterAnims.forEach((value) => value.setValue(0));

      const ease = Easing.out(Easing.cubic);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(introOpacity, {
            toValue: 1,
            duration: 180,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(introScale, {
            toValue: 1.12,
            duration: 220,
            easing: ease,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(introOpacity, {
            toValue: 0,
            duration: 220,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(introScale, {
            toValue: 1.45,
            duration: 260,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.stagger(
            65,
            letterAnims
              .map((value, index) => ({ value, index }))
              .reverse()
              .map(({ value }) =>
                Animated.timing(value, {
                  toValue: 1,
                  duration: 230,
                  easing: ease,
                  useNativeDriver: true,
                })
              )
          ),
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 260,
            delay: 320,
            easing: ease,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    AccessibilityInfo.isReduceMotionEnabled().then(run).catch(() => run(false));

    return () => {
      active = false;
    };
  }, [animate, badgeOpacity, introOpacity, introScale, letterAnims]);

  return (
    <View style={styles.container}>
      <View style={[styles.stage, large ? styles.stageLarge : styles.stageSmall]}>
        {animate ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.introGlass,
              large ? styles.introGlassLarge : styles.introGlassSmall,
              { opacity: introOpacity, transform: [{ scale: introScale }] },
            ]}
          >
            <View style={[styles.glass, large ? styles.glassLarge : styles.glassSmall]} />
            <View
              style={[
                styles.handle,
                large ? styles.handleLarge : styles.handleSmall,
              ]}
            />
          </Animated.View>
        ) : null}

        <View style={styles.wordmarkRow}>
          {LETTERS.map((letter, index) => (
            <Animated.Text
              key={`${letter}-${index}`}
              style={[
                styles.wordmark,
                { fontSize: large ? 40 : 22 },
                {
                  opacity: letterAnims[index],
                  transform: [
                    {
                      translateX: letterAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}

          <Animated.View
            style={[
              styles.lensBadge,
              large ? styles.lensBadgeLarge : styles.lensBadgeSmall,
              { opacity: badgeOpacity },
            ]}
          >
            <View style={[styles.glass, large ? styles.glassLarge : styles.glassSmall]} />
            <View
              style={[
                styles.handle,
                large ? styles.handleLarge : styles.handleSmall,
              ]}
            />
          </Animated.View>
        </View>
      </View>

      {showTagline ? <Text style={styles.tagline}>Campus Lost &amp; Found</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  stage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageLarge: {
    minHeight: 52,
  },
  stageSmall: {
    minHeight: 30,
  },
  introGlass: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  introGlassLarge: {
    width: 44,
    height: 44,
  },
  introGlassSmall: {
    width: 26,
    height: 26,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    color: Colors.primary,
    fontFamily: Fonts.extraBold,
    letterSpacing: -1.2,
  },
  lensBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    marginTop: 2,
  },
  lensBadgeLarge: {
    width: 18,
    height: 18,
  },
  lensBadgeSmall: {
    width: 12,
    height: 12,
  },
  glass: {
    borderRadius: 999,
    borderColor: Colors.cyan,
  },
  glassLarge: {
    width: '100%',
    height: '100%',
    borderWidth: 2.5,
  },
  glassSmall: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
  },
  handle: {
    position: 'absolute',
    right: -4,
    bottom: -1,
    backgroundColor: Colors.cyan,
    borderRadius: 999,
    transform: [{ rotate: '45deg' }],
  },
  handleLarge: {
    width: 9,
    height: 3,
  },
  handleSmall: {
    width: 6,
    height: 2,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
});
