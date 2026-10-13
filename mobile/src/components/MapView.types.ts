import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapPressEvent = {
  nativeEvent: {
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
};

export type MarkerProps = {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
};

export type MapViewProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  initialRegion: MapRegion;
  onPress?: (event: MapPressEvent) => void;
  scrollEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
};
