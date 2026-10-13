import { createContext, useContext, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

import type { MapPressEvent, MapRegion, MapViewProps, MarkerProps } from './MapView.types';

const MapRegionContext = createContext<MapRegion | null>(null);

export function Marker({ coordinate, title, description }: MarkerProps) {
  const region = useContext(MapRegionContext);
  if (!region) {
    return null;
  }

  const latitudeDelta = region.latitudeDelta || 0.1;
  const longitudeDelta = region.longitudeDelta || 0.1;
  const left = Math.max(0, Math.min(100, 50 + ((coordinate.longitude - region.longitude) / longitudeDelta) * 100));
  const top = Math.max(0, Math.min(100, 50 - ((coordinate.latitude - region.latitude) / latitudeDelta) * 100));

  return (
    <View
      accessibilityLabel={[title, description].filter(Boolean).join('. ')}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        marginLeft: -7,
        marginTop: -7,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 3,
        borderColor: '#ffffff',
        backgroundColor: '#dc2626',
        elevation: 3,
      }}
    />
  );
}

export default function MapView({
  accessibilityLabel,
  children,
  initialRegion,
  onPress,
  style,
}: MapViewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handlePress = (event: GestureResponderEvent) => {
    if (!onPress) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const x = dimensions.width ? locationX / dimensions.width : 0.5;
    const y = dimensions.height ? locationY / dimensions.height : 0.5;
    const mapEvent: MapPressEvent = {
      nativeEvent: {
        coordinate: {
          latitude: initialRegion.latitude + (0.5 - y) * initialRegion.latitudeDelta,
          longitude: initialRegion.longitude + (x - 0.5) * initialRegion.longitudeDelta,
        },
      },
    };

    onPress(mapEvent);
  };

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setDimensions(event.nativeEvent.layout)}
      style={[
        {
          overflow: 'hidden',
          borderRadius: 8,
          backgroundColor: '#e2e8f0',
        },
        style,
      ]}
    >
      <MapRegionContext.Provider value={initialRegion}>
        <Pressable
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={onPress ? `${accessibilityLabel ?? 'Map'}. Tap to choose a location.` : accessibilityLabel}
          onPress={handlePress}
          style={{ flex: 1, justifyContent: 'space-between', padding: 12 }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'space-evenly',
            }}
          >
            {[0, 1, 2].map((index) => (
              <View key={index} style={{ height: 1, backgroundColor: '#cbd5e1' }} />
            ))}
          </View>
          <Text style={{ color: '#334155', fontSize: 12, fontWeight: '600' }}>
            {onPress ? 'Tap map to choose a location' : 'Map preview'}
          </Text>
          {children}
        </Pressable>
      </MapRegionContext.Provider>
    </View>
  );
}
