import { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Map as GLMap } from 'maplibre-gl';
import {
  MapLibreContext,
  useControlContainer,
} from '../../context/MapLibreContext';
import { useI18n } from '../../hooks/useI18n';
import { Hexagon, Table } from 'lucide-react';
import { HexTableModal } from './HexTableModal';

const MAP_CONTROL_ICON_PROPS = {
  size: 17,
  strokeWidth: 1.85,
  absoluteStrokeWidth: true as const,
};

interface HexLayerToggleControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  hexes: Array<{ h3: string; count: number }>;
  resolution: number;
  searchQuery?: string;
  queryString?: string;
  loading?: boolean;
  mapInstance?: GLMap | null;
  stackOrder?: 'default' | 'beforeBasemap';
}

export function HexLayerToggleControl({
  enabled,
  onToggle,
  hexes,
  resolution,
  searchQuery,
  queryString,
  loading,
  mapInstance,
}: HexLayerToggleControlProps) {
  const context = useContext(MapLibreContext);
  const map = context ?? mapInstance ?? null;
  const container = useControlContainer(map);
  const { t } = useI18n();
  const [isTableOpen, setIsTableOpen] = useState(false);

  if (!container) return null;

  return createPortal(
    <>
      <HexTableModal
        isOpen={isTableOpen}
        onClose={() => setIsTableOpen(false)}
        hexes={hexes}
        resolution={resolution}
        searchQuery={searchQuery}
        queryString={queryString}
        loading={loading}
      />
      <div>
        <button
          type="button"
          onClick={() => {
            const next = !enabled;
            onToggle(next);
            if (!next) {
              setIsTableOpen(false);
            }
          }}
          aria-label={t(enabled ? 'map.hideHex' : 'map.showHex')}
          title={t(enabled ? 'map.hideHex' : 'map.showHex')}
          className={`discovery-control-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors ${
            enabled ? 'bg-blue-50 hover:bg-blue-100' : ''
          }`}
        >
          <Hexagon
            {...MAP_CONTROL_ICON_PROPS}
            className={enabled ? 'text-blue-600 fill-current' : 'text-gray-500'}
            fill={enabled ? 'currentColor' : 'none'}
          />
        </button>
        <button
          type="button"
          onClick={() => setIsTableOpen((open) => !open)}
          disabled={!enabled}
          aria-haspopup="dialog"
          aria-expanded={isTableOpen}
          aria-label={t(isTableOpen ? 'map.closeHexTable' : 'map.hexTable')}
          title={t(isTableOpen ? 'map.closeHexTable' : 'map.hexTable')}
          className="discovery-control-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:cursor-not-allowed disabled:text-gray-300"
        >
          <Table {...MAP_CONTROL_ICON_PROPS} className="text-gray-700" />
        </button>
      </div>
    </>,
    container
  );
}
