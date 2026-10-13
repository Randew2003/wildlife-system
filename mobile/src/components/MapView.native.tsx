import NativeMapView, { Marker as NativeMarker } from 'react-native-maps';

import type { MapViewProps } from './MapView.types';

export const Marker = NativeMarker;

export default function MapView(props: MapViewProps) {
  return <NativeMapView {...props} />;
}
