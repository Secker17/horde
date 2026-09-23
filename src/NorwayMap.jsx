import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { Minus, Plus, RotateCcw } from 'lucide-react'

const COLORS = {
  likely: '#d99b43',
  unsure: '#769f89',
  unlikely: '#536059',
  excluded: '#dc4c4c',
  none: '#24352c',
}

const LABELS = {
  likely: 'Sannsynlig',
  unsure: 'Usikkert',
  unlikely: 'Lite sannsynlig',
  excluded: 'Utelukket',
  none: 'Ikke vurdert',
}

// D3's spherical path renderer uses the opposite polygon winding convention
// from standard GeoJSON. Flip every ring so Norway is rendered, not its inverse
function forD3(feature) {
  const geometry = feature.geometry
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) return feature
  const coordinates = geometry.type === 'Polygon'
    ? geometry.coordinates.map((ring) => [...ring].reverse())
    : geometry.coordinates.map((polygon) => polygon.map((ring) => [...ring].reverse()))
  return { ...feature, geometry: { ...geometry, coordinates } }
}

export default function NorwayMap({ data, statuses, selected, onSelect, mode }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef(null)
  const suppressClick = useRef(false)

  const paths = useMemo(() => {
    if (!data) return []
    const normalized = { ...data, features: data.features.map(forD3) }
    const projection = geoMercator().fitExtent([[42, 24], [488, 736]], normalized)
    const path = geoPath(projection)
    return normalized.features.map((feature) => ({
      id: String(feature.properties.kommunenummer || feature.properties.fylkesnummer || feature.properties.id),
      name: feature.properties.kommunenavn || feature.properties.fylkesnavn || feature.properties.name,
      d: path(feature),
    }))
  }, [data])

  const reset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="map-stage">
      <div className="map-caption"><span>{mode === 'municipality' ? '357 kommuner' : '15 fylker'}</span><small>Trykk for å utforske</small></div>
      <svg
        className="norway-map"
        viewBox="0 0 530 760"
        role="img"
        aria-label={`Interaktivt kart over Norges ${mode === 'municipality' ? 'kommuner' : 'fylker'}`}
        onPointerDown={(event) => {
          if (zoom === 1) return
          drag.current = { x: event.clientX, y: event.clientY, pan, moved: false }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!drag.current || zoom === 1) return
          const dx = event.clientX - drag.current.x
          const dy = event.clientY - drag.current.y
          if (Math.hypot(dx, dy) > 4) drag.current.moved = true
          setPan({
            x: drag.current.pan.x + dx / zoom,
            y: drag.current.pan.y + dy / zoom,
          })
        }}
        onPointerUp={(event) => {
          suppressClick.current = Boolean(drag.current?.moved)
          drag.current = null
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
      >
        <defs>
          <filter id="mapGlow"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity=".36" /></filter>
        </defs>
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`} style={{ transformOrigin: '265px 380px' }} filter="url(#mapGlow)">
          {paths.map((item) => {
            const key = `${mode}:${item.id}`
            const status = statuses[key]?.status || 'none'
            const isSelected = selected?.key === key
            return (
              <path
                key={key}
                d={item.d}
                fill={COLORS[status] || COLORS.none}
                className={`map-region ${isSelected ? 'selected' : ''}`}
                onClick={(event) => {
                  if (suppressClick.current) {
                    suppressClick.current = false
                    return
                  }
                  event.stopPropagation()
                  onSelect({ key, id: item.id, name: item.name, type: mode, status })
                }}
                tabIndex="0"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect({ key, id: item.id, name: item.name, type: mode, status })
                  }
                }}
              >
                <title>{item.name} — {LABELS[status] || LABELS.none}</title>
              </path>
            )
          })}
        </g>
      </svg>
      <div className="map-controls" aria-label="Kartkontroller">
        <button onClick={() => setZoom((z) => Math.min(2.5, z + .25))} aria-label="Zoom inn"><Plus size={17} /></button>
        <button onClick={() => setZoom((z) => Math.max(1, z - .25))} aria-label="Zoom ut"><Minus size={17} /></button>
        <button onClick={reset} aria-label="Nullstill kart"><RotateCcw size={16} /></button>
      </div>
    </div>
  )
}
