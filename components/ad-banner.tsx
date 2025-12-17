import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Linking, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing, Radius } from '@/constants/theme';
// Note: trpc ads router can be added later for dynamic ads

type AdBannerProps = {
  placement: 'home' | 'matches' | 'players' | 'more';
  style?: any;
  showAds?: boolean; // If false, don't show ads (for premium users)
  onUpgrade?: () => void;
};

type Ad = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
  sponsor: string;
};

// Default ads for when no custom ads are configured
const DEFAULT_ADS: Ad[] = [
  {
    id: 'default-1',
    title: 'Zostań sponsorem!',
    description: 'Twoja reklama może być tutaj. Skontaktuj się z nami.',
    linkUrl: 'mailto:reklama@smallclubmanager.pl',
    sponsor: 'Small Club Manager',
  },
  {
    id: 'default-2',
    title: 'Sprzęt sportowy',
    description: 'Najlepszy sprzęt dla Twojego klubu w atrakcyjnych cenach.',
    linkUrl: 'https://example.com/sports-equipment',
    sponsor: 'Partner',
  },
];

export function AdBanner({ placement, style, showAds = true, onUpgrade }: AdBannerProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // For now, use default ads. Server-side ads can be added later.
  const ads = DEFAULT_ADS;
  const currentAd = ads[currentAdIndex];

  // Rotate ads every 30 seconds
  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [ads.length]);

  if (dismissed || !showAds) return null;

  const handlePress = () => {
    if (currentAd.linkUrl) {
      Linking.openURL(currentAd.linkUrl);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Reset after 5 minutes
    setTimeout(() => setDismissed(false), 5 * 60 * 1000);
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable style={styles.adContent} onPress={handlePress}>
        {currentAd.imageUrl ? (
          <Image source={{ uri: currentAd.imageUrl }} style={styles.adImage} />
        ) : (
          <View style={styles.adIcon}>
            <MaterialIcons name="campaign" size={24} color={AppColors.primary} />
          </View>
        )}
        <View style={styles.adText}>
          <ThemedText style={styles.adTitle} numberOfLines={1}>
            {currentAd.title}
          </ThemedText>
          <ThemedText style={styles.adDescription} numberOfLines={2}>
            {currentAd.description}
          </ThemedText>
          <ThemedText style={styles.adSponsor}>
            Sponsor: {currentAd.sponsor}
          </ThemedText>
        </View>
      </Pressable>
      <Pressable style={styles.dismissButton} onPress={handleDismiss}>
        <MaterialIcons name="close" size={16} color="#64748b" />
      </Pressable>
      {ads.length > 1 && (
        <View style={styles.indicators}>
          {ads.map((_: Ad, index: number) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentAdIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Affiliate link component for specific products/services
type AffiliateLinkProps = {
  title: string;
  description: string;
  linkUrl: string;
  icon?: string;
};

export function AffiliateLink({ title, description, linkUrl, icon }: AffiliateLinkProps) {
  const handlePress = () => {
    Linking.openURL(linkUrl);
  };

  return (
    <Pressable style={styles.affiliateContainer} onPress={handlePress}>
      <View style={styles.affiliateIcon}>
        <MaterialIcons name={(icon as any) || 'link'} size={20} color={AppColors.secondary} />
      </View>
      <View style={styles.affiliateText}>
        <ThemedText style={styles.affiliateTitle}>{title}</ThemedText>
        <ThemedText style={styles.affiliateDescription}>{description}</ThemedText>
      </View>
      <MaterialIcons name="open-in-new" size={18} color="#64748b" />
    </Pressable>
  );
}

// Sponsored content section for more screen
export function SponsoredSection() {
  return (
    <View style={styles.sponsoredSection}>
      <ThemedText style={styles.sponsoredTitle}>Polecane</ThemedText>
      <AffiliateLink
        title="Ubezpieczenie dla sportowców"
        description="Specjalna oferta dla członków klubu"
        linkUrl="https://example.com/insurance"
        icon="security"
      />
      <AffiliateLink
        title="Stroje sportowe"
        description="Profesjonalne stroje z nadrukiem"
        linkUrl="https://example.com/uniforms"
        icon="checkroom"
      />
      <AffiliateLink
        title="Organizacja turniejów"
        description="Pomoc w organizacji wydarzeń sportowych"
        linkUrl="https://example.com/tournaments"
        icon="emoji-events"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    position: 'relative',
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
  },
  adIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: AppColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adText: {
    flex: 1,
  },
  adTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#fff',
  },
  adDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: '#94a3b8',
    marginTop: 2,
  },
  adSponsor: {
    fontSize: 10,
    lineHeight: 14,
    color: '#64748b',
    marginTop: 4,
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  indicatorActive: {
    backgroundColor: AppColors.primary,
    width: 12,
  },
  affiliateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  affiliateIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: AppColors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  affiliateText: {
    flex: 1,
  },
  affiliateTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#fff',
  },
  affiliateDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: '#94a3b8',
    marginTop: 2,
  },
  sponsoredSection: {
    marginTop: Spacing.lg,
  },
  sponsoredTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
