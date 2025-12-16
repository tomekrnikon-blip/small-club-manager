import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { AppColors, Radius } from '@/constants/theme';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const getBackgroundColor = () => {
    if (disabled) return '#4b5563';
    switch (variant) {
      case 'primary':
        return AppColors.primary;
      case 'secondary':
        return AppColors.secondary;
      case 'danger':
        return AppColors.danger;
      case 'outline':
        return 'transparent';
      default:
        return AppColors.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return AppColors.primary;
    return '#fff';
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 18, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        getSizeStyles(),
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: variant === 'outline' ? AppColors.primary : undefined,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <MaterialIcons
              name={icon as any}
              size={getIconSize()}
              color={getTextColor()}
              style={styles.iconLeft}
            />
          )}
          <ThemedText
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getTextSize(), lineHeight: getTextSize() * 1.3 },
              textStyle,
            ]}
          >
            {title}
          </ThemedText>
          {icon && iconPosition === 'right' && (
            <MaterialIcons
              name={icon as any}
              size={getIconSize()}
              color={getTextColor()}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
