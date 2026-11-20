export type MessageValue = string | { [key: string]: MessageValue };

export const messages = {
  en: {
    research: {
      findBy: 'Search by',
      location: 'Location',
      mapName: 'Map name',
      findLocation: 'Find a city, place or address',
      findMapName: 'Find maps by name',
      locationHelp: 'Choose a place to find maps covering its area.',
      mapNameHelp:
        'Search map metadata across this collection, independent of the map extent.',
      findingPlaces: 'Finding locations…',
      placeError:
        'Locations could not be loaded. Check your connection and search again.',
      noPlaces: 'No locations found. Add a state or country and try again.',
      mapExplorer: 'Historical map explorer',
      searchArea: 'Search this area',
      clickToSearch: 'Click the map to search nearby.',
      footprints: 'Show loaded map footprints',
      closeMap: 'Back to coverage',
      fitMap: 'Fit selected map',
      showScan: 'Show historical scan',
      opacity: 'Scan opacity',
      relatedScans: 'Related scans',
      relatedHelp:
        'Scans with matching names and bounds among loaded results. Load more results to find more scans; this is not a verified edition series.',
      singleMap: 'Single map · no comparison',
      matchingMaps: 'Maps in this area',
      nearPoint: 'Near {point} · a small bounding area around the point',
      selectedArea: 'Selected map area',
      namedMaps: 'Map metadata matching “{query}”',
      startLocation: 'Start with a location',
      yearFrom: 'Publication year from',
      yearTo: 'Publication year to',
      applyYears: 'Apply years',
      allYears: 'All years',
      yearError:
        'Use four-digit years with the first year before or equal to the last.',
      discoveryStart:
        'Search for a place above, click a location on the map, or pan and choose Search this area. Select a result to inspect the original scan.',
      loadedMaps: '{count} of {total} maps loaded',
      mapSearchError:
        'Maps could not be loaded. Check your connection and retry. This does not mean there are no maps here.',
      noMaps:
        'No maps match this area and year range. Try a wider area or All years.',
      loadMoreMaps: 'Load more maps',
      coverageHelp:
        'Outlines show the bounding boxes of loaded results. Publication years do not necessarily indicate when features were surveyed.',
      samePlace: 'Map tools',
      locateCoordinates: 'Go to coordinates',
      viewEdition: 'View {year} edition',
      compareMaps: 'Compare maps',
      compareWith: 'Compare with',
      editionStrip: 'Map editions',
      editionStripHelp:
        'Choose a publication year. Different printings may depict the same survey; inspect source dates below the map.',
      focusHelp:
        'Pan and zoom to explore. In comparison view, both maps follow the same location. Click a map to search a small area around that location.',
      pinnedLocation: 'Pinned location',
      cursorLocation: 'Shared cursor',
      movePointer: 'Move over a map',
      pointCoordinates: 'Longitude, latitude (WGS84)',
      pointExample: 'For example: -89.40, 43.07',
      locatePoint: 'Locate & pin',
      clearPin: 'Clear pin',
      pointError:
        'Enter longitude, latitude as two numbers, within ±180° longitude and ±85° latitude.',
      shareWorkspace: 'Create link to this view',
      shareLink: 'Snapshot link · selected scans, location and zoom',
      openSharedView: 'Open saved view',
      inspectSource: 'Inspect dates, map margins & citation',
      indexPublicationYear: 'Publication year',
      unstructuredDate: 'See description or map margins',
      printingYear: 'Printing year',
      scale: 'Scale',
      dateEvidenceHelp:
        'A later printing is not necessarily a new survey. Check the full map’s margins for compilation, revision and aerial-photo dates, legends and datums. Different features may represent different dates.',
      openCollar: 'Open full map PDF · dates & legend ↗',
      sourceRecord: 'USGS source record ↗',
      sourceMetadata: 'Original source metadata ↗',
      copyCitation: 'Copy citation',
      citationCopied: 'Citation copied.',
      citationCopyFallback: 'Select and copy the citation above.',
      pathways: 'Collection pathways',
      discoveryMode: 'Search & browse',
      discoveryDescription:
        'Explore the catalog, map, filters and full metadata.',
      researchMode: 'Research workspace',
      previewError:
        'Scan preview unavailable. Use the metadata and download links below.',
      moreTiles: 'Show more tiles ({count} remaining)',
      findMore: 'Find more in this collection',
      searchCollection: 'Search collection metadata',
      search: 'Search',
      searchError:
        'Search could not be completed. Try again or browse the catalog.',
      searchHelp:
        'Showing up to 20 matching records ({count} returned). Refine your search for more specific results. Comparison support is checked after selection.',
      skip: 'Skip to research workspace',
      navigation: 'Collection navigation',
      catalog: 'Browse catalog',
      about: 'About the collection',
      switch: 'Switch collection',
      prototype: 'Research workspace · prototype',
      linkHelp:
        'Your selections stay in this page’s URL. Copy it to share this workspace.',
      record: 'Metadata & citation',
      assetsError:
        'Asset metadata could not be loaded. Open the record to retry.',
      extent: 'Study area bounds',
      bboxHelp: 'West, south, east, north · longitude / latitude',
      bboxError:
        'Enter four valid coordinates, west < east and south < north, between ±180° longitude and ±85° latitude. Areas crossing the antimeridian are not supported.',
      applyArea: 'Apply extent',
      useMap: 'Use map view',
      observation: 'Observation date',
      imageError:
        'Imagery could not be loaded. Open the image request to inspect the service response.',
      loading: 'Loading live collection data…',
      imageryAlt:
        'Satellite imagery for {date}, covering the shared study area.',
      openImage: 'Open full image request ↗',
      imageryStep: '01 / Layer, dates & place',
      layer: 'Imagery layer',
      before: 'First date',
      after: 'Second date',
      dateRange:
        'Daily coverage: {start} – {end}, across {count} intervals. Gaps are checked before requesting imagery.',
      invalidDates:
        'A chosen date is outside the available daily intervals. Choose another date; the service may otherwise substitute a nearby day.',
      source: 'Open source viewer ↗',
      comparison: 'Imagery comparison',
      sameExtent: 'ONE LAYER · SHARED GEOGRAPHIC EXTENT',
      domainError:
        'Daily availability could not be verified for this layer. Comparison is unavailable. Open its metadata or source viewer, or reload to retry.',
      chooseDates: 'Choose two available dates to compare.',
      areaStep: '01 / Product & study area',
      product: 'Elevation product',
      studyArea: 'Study area',
      tileFootprints: 'Nominal tile footprints',
      downloadStep: '02 / Select original tiles',
      overlapping: '{count} overlapping tiles',
      indexError:
        'The source index could not be loaded. Reload to retry, or browse the catalog.',
      noTiles:
        'No indexed tiles overlap this extent. Move the map or edit the bounds.',
      selectAll: 'Select all',
      clear: 'Clear selection',
      published: 'Published',
      unknown: 'Not recorded',
      selected: '{count} tiles selected',
      export: 'Export tile manifest ↓',
      manifestHelp:
        'The manifest contains original download URLs and your study-area bounds. Review each tile’s source metadata for vertical datum, units and nodata before analysis.',
      findIndex: 'Find maps in another state or region',
      findIndexHelp:
        'Search a state or region (for example, Wisconsin), choose a scale index, then choose a map sheet. The sheet list covers only the selected index.',
      browseIndexes: 'Browse all map indexes',
      selectedIndex: 'Selected map index',
      resultsPage:
        '{count} results · Page {page}. Select a result to load its maps.',
      noMatches: 'No matching records. Try a broader search.',
      previousResults: 'Previous results',
      nextResults: 'Next results',
      retrySearch: 'Retry search',
      sheetStep: '01 / Choose a place & sheet',
      index: 'Map index',
      sheet: 'Map sheet',
      editionsCount: 'editions across {count} scans / printings',
      linkedMaps:
        'Linked views · Pan or zoom to inspect the selected scans. To find maps elsewhere, change the index and map sheet above.',
      noSheets: 'No sheets are available in this index.',
      printingForYear: 'Printing / scan · {year}',
      editionA: '02 / First edition or printing',
      editionB: '03 / Second edition or printing',
      survey: 'Survey year',
      printed: 'printed {year}',
      printUnknown: 'printing year not recorded',
      chronology: 'Choose an edition for the second map',
      printings: '{count} scans / printings',
    },
    map: {
      label: 'Interactive map',
      basemap: 'Basemap',
      retry: 'Retry basemap',
      fallback: 'The selected basemap is unavailable. Showing an alternative.',
      unavailable:
        'Basemaps are unavailable. Resource overlays remain visible.',
      webgl:
        'This device could not display the interactive map. You can still use search and the results list.',
      geometryMissing: 'Location geometry is unavailable.',
      location: 'Location',
      searchPlaces: 'Search places',
      clear: 'Clear',
      within: 'Within',
      intersects: 'Overlap',
      clearLocation: 'Clear location filter',
      relation: 'Spatial relationship',
      showHex: 'Show hex map layer',
      hideHex: 'Hide hex map layer',
      hexTable: 'View hex data as table',
      closeHexTable: 'Close hex data table',
      resources: 'Resources',
      resolution: 'Resolution',
      area: 'Area',
      searchHex: 'Search this hex',
      noResults: 'No mappable results found in this page.',
      details: 'View Details',
      untitled: 'Untitled',
      result: 'Result {number}',
      overlayError: 'Preview unavailable. Showing the record footprint.',
      loading: 'Loading map data…',
      dataError: 'Map data could not be loaded.',
    },
    common: {
      about: 'About',
      advancedSearch: 'Advanced search',
      allRightsReserved: 'All rights reserved.',
      api: 'API',
      bookmarks: 'Bookmarks',
      browseAllResources: 'Browse All Resources',
      close: 'Close',
      documentation: 'Documentation',
      feedback: 'Feedback',
      featuredCollections: 'Featured Collections',
      filterResults: 'Filter Results',
      goHome: 'Go home',
      hide: 'Hide',
      language: 'Language',
      loading: 'Loading…',
      loadingMap: 'Loading map…',
      loadingStories: 'Loading stories…',
      mainNavigation: 'Main navigation',
      menu: 'Menu',
      noApiRequestsYet: 'No API requests yet',
      noStoriesAvailable: 'No stories available yet.',
      partnerInstitutions: 'Partner Institutions',
      place: 'Place',
      publisher: 'Publisher',
      resourceType: 'Resource Type',
      search: 'Search',
      searchHere: 'Search here',
      searchPlaceholder: 'Search for maps, data, imagery...',
      theme: 'Theme',
      topic: 'Theme',
      tryAgain: 'Try again',
      utilityNavigation: 'Utility navigation',
      viewAllCollections: 'View all collections',
      viewAllResources: 'View all resources',
      viewAllStories: 'View all stories',
      viewCollectionRecord: 'View collection record',
      viewMore: 'View more',
      viewOriginal: 'View original',
    },
    bookmarks: {
      pageTitle: 'Bookmarked Resources',
    },
    citation: {
      copyCitation: 'Copy citation',
      exportForCitationTools: 'Export for citation tools',
      heading: 'Cite & Reference',
      permalink: 'Permalink',
    },
    errorPages: {
      backToResults: 'Back to results',
      nextStepsTitle: 'Next steps',
      notFoundDescription:
        'This address does not match a page in the geoportal.',
      notFoundStepCheckUrl:
        'Check the address for a misspelled path or resource id.',
      notFoundStepSearch:
        'Search the catalog for maps, data, imagery, and records.',
      notFoundTitle: 'Page not found',
      resourceNotFoundDescription:
        'We could not find a resource record for "{resourceId}". It may have moved, been withdrawn, or fallen outside this site\'s current collection scope.',
      resourceNotFoundDescriptionNoId:
        "We could not find that resource record. It may have moved, been withdrawn, or fallen outside this site's current collection scope.",
      resourceNotFoundStepScope:
        'The record may be outside the active institution scope for this site.',
      resourceNotFoundStepSearch:
        'Search for the title or provider if you reached this page from an old link.',
      resourceNotFoundTitle: 'Resource not found',
      searchResources: 'Search resources',
      serverErrorDescription:
        'The geoportal could not load this page right now. Try again, or start a new search while the request recovers.',
      serverErrorStepRetry:
        'Retry the request; temporary API or network errors often clear quickly.',
      serverErrorStepSearch:
        'Start from search if this page continues to fail.',
      serverErrorTitle: 'Something went wrong',
      statusLabel: 'Error {statusCode}',
      technicalDetails: 'Technical details',
    },
    footer: {
      lastApiRequest: 'Last API Request:',
    },
    home: {
      openMedia: 'Open featured media',
    },
    resourceAdmin: {
      backToResource: 'Back to resource',
      endpointLabel: 'API endpoint:',
      eyebrow: 'Admin JSON',
      fetchError: 'Unable to load resource metadata.',
      heading: 'Aardvark Metadata',
      jsonLabel: 'Complete resource JSON',
      loading: 'Loading resource metadata...',
      noResourceId: 'No resource id was provided.',
      pageDescription: 'Complete resource JSON response from the API.',
      pageTitle: 'Aardvark Metadata',
      pageTitleWithTitle: 'Aardvark Metadata: {title}',
    },
    resource: {
      viewerLoadError: 'Unable to load the image viewer.',
      previewLoadError: 'Unable to load the resource preview.',
      previewLabel: 'Resource preview',
    },
    search: {
      customArea: 'Custom area',
      didYouMean: 'Did you mean:',
      geographicAreas: 'Geographic Areas',
      in: 'in',
      noCloseSuggestions: 'No close keyword suggestions found.',
      noMatchingPlaces: 'No matching geographic areas found.',
      noResultLocationsToMap: 'No result locations to map.',
      noResultsHeading: 'No search results found',
      noResultsWithQuery:
        'Try a suggested search, a broader fielded search, or Advanced Search.',
      noResultsWithoutQuery:
        'Try clearing filters or building a more precise query in Advanced Search.',
      pageDescription:
        'Search existing resources in this geospatial discovery interface.',
      pageTitle: 'Search Results',
      preciseSearchDescription:
        'Combine fields and terms with Advanced Search.',
      preciseSearchTitle: 'Build a more precise search',
      resultsFor: 'Search results for {query}',
      results: 'Results',
      scopeSubjectTheme: 'Subject/Theme',
      scopeTitle: 'Title',
      searchOnlyIn: 'Search Only In',
      searching: 'Searching…',
      searchingPlaces: 'Searching places...',
      searchingSuggestions: 'Searching suggestions...',
      seeAllResultsFor: 'See all results for {query}',
      showingResults: 'Showing results',
      suggestions: 'Suggestions',
      of: 'of',
      viaOpenStreetMap: 'Via OpenStreetMap',
    },
    security: {
      checkingSession: 'Checking session...',
      finishingCheck: 'Finishing check...',
      turnstileDescription:
        'This quick check helps keep automated traffic from overwhelming the Geoportal.',
      turnstileError: 'Verification did not complete. Please try again.',
      turnstileTitle: 'Verifying browser session',
    },
    seo: {
      defaultDescription:
        'Discover and access geospatial resources through the BTAA Geospatial API.',
      defaultSiteTitle: 'OpenGeoMetadata Geoportal',
    },
  },
  es: {
    common: {
      about: 'Acerca de',
      advancedSearch: 'Búsqueda avanzada',
      allRightsReserved: 'Todos los derechos reservados.',
      api: 'API',
      bookmarks: 'Marcadores',
      browseAllResources: 'Explorar todos los recursos',
      close: 'Cerrar',
      documentation: 'Documentación',
      feedback: 'Comentarios',
      featuredCollections: 'Colecciones destacadas',
      filterResults: 'Filtrar resultados',
      goHome: 'Ir al inicio',
      hide: 'Ocultar',
      language: 'Idioma',
      loading: 'Cargando…',
      loadingMap: 'Cargando mapa…',
      loadingStories: 'Cargando historias…',
      mainNavigation: 'Navegación principal',
      menu: 'Menú',
      noApiRequestsYet: 'Todavía no hay solicitudes a la API',
      noStoriesAvailable: 'Todavía no hay historias disponibles.',
      partnerInstitutions: 'Instituciones asociadas',
      place: 'Lugar',
      publisher: 'Publicador',
      resourceType: 'Tipo de recurso',
      search: 'Buscar',
      searchHere: 'Buscar aquí',
      searchPlaceholder: 'Buscar mapas, datos e imágenes...',
      theme: 'Tema',
      topic: 'Tema',
      tryAgain: 'Intentar de nuevo',
      utilityNavigation: 'Navegación utilitaria',
      viewAllCollections: 'Ver todas las colecciones',
      viewAllResources: 'Ver todos los recursos',
      viewAllStories: 'Ver todas las historias',
      viewCollectionRecord: 'Ver el registro de la colección',
      viewMore: 'Ver más',
      viewOriginal: 'Ver original',
    },
    bookmarks: {
      pageTitle: 'Recursos marcados',
    },
    citation: {
      copyCitation: 'Copiar cita',
      exportForCitationTools: 'Exportar para herramientas de cita',
      heading: 'Citar y referenciar',
      permalink: 'Enlace permanente',
    },
    errorPages: {
      backToResults: 'Volver a los resultados',
      nextStepsTitle: 'Próximos pasos',
      notFoundDescription:
        'Esta dirección no coincide con una página del geoportal.',
      notFoundStepCheckUrl:
        'Revise la dirección por si hay una ruta o un id de recurso mal escrito.',
      notFoundStepSearch:
        'Busque en el catálogo mapas, datos, imágenes y registros.',
      notFoundTitle: 'Página no encontrada',
      resourceNotFoundDescription:
        'No pudimos encontrar un registro de recurso para "{resourceId}". Es posible que se haya movido, retirado o que esté fuera del alcance actual de colecciones de este sitio.',
      resourceNotFoundDescriptionNoId:
        'No pudimos encontrar ese registro de recurso. Es posible que se haya movido, retirado o que esté fuera del alcance actual de colecciones de este sitio.',
      resourceNotFoundStepScope:
        'El registro puede estar fuera del alcance institucional activo de este sitio.',
      resourceNotFoundStepSearch:
        'Busque el título o el proveedor si llegó a esta página desde un enlace antiguo.',
      resourceNotFoundTitle: 'Recurso no encontrado',
      searchResources: 'Buscar recursos',
      serverErrorDescription:
        'El geoportal no pudo cargar esta página en este momento. Inténtelo de nuevo o inicie una nueva búsqueda mientras se recupera la solicitud.',
      serverErrorStepRetry:
        'Vuelva a intentar la solicitud; los errores temporales de la API o de red suelen resolverse rápido.',
      serverErrorStepSearch:
        'Comience desde la búsqueda si esta página sigue fallando.',
      serverErrorTitle: 'Algo salió mal',
      statusLabel: 'Error {statusCode}',
      technicalDetails: 'Detalles técnicos',
    },
    footer: {
      lastApiRequest: 'Última solicitud a la API:',
    },
    home: {
      openMedia: 'Abrir contenido destacado',
    },
    resourceAdmin: {
      backToResource: 'Volver al recurso',
      endpointLabel: 'Endpoint de la API:',
      eyebrow: 'JSON de administración',
      fetchError: 'No se pudieron cargar los metadatos del recurso.',
      heading: 'Metadatos de Aardvark',
      jsonLabel: 'JSON completo del recurso',
      loading: 'Cargando metadatos del recurso...',
      noResourceId: 'No se proporcionó un id de recurso.',
      pageDescription: 'Respuesta JSON completa del recurso desde la API.',
      pageTitle: 'Metadatos de Aardvark',
      pageTitleWithTitle: 'Metadatos de Aardvark: {title}',
    },
    resource: {
      viewerLoadError: 'No se pudo cargar el visor de imágenes.',
      previewLoadError: 'No se pudo cargar la vista previa del recurso.',
      previewLabel: 'Vista previa del recurso',
    },
    search: {
      customArea: 'Área personalizada',
      didYouMean: 'Quizás quiso decir:',
      geographicAreas: 'Áreas geográficas',
      in: 'en',
      noCloseSuggestions:
        'No se encontraron sugerencias de palabras clave cercanas.',
      noMatchingPlaces: 'No se encontraron áreas geográficas coincidentes.',
      noResultLocationsToMap: 'No hay ubicaciones de resultados para mapear.',
      noResultsHeading: 'No se encontraron resultados',
      noResultsWithQuery:
        'Pruebe una búsqueda sugerida, una búsqueda por campo más amplia o la búsqueda avanzada.',
      noResultsWithoutQuery:
        'Pruebe borrar filtros o crear una consulta más precisa en la búsqueda avanzada.',
      pageDescription:
        'Busque recursos existentes en esta interfaz de descubrimiento geoespacial.',
      pageTitle: 'Resultados de búsqueda',
      preciseSearchDescription:
        'Combine campos y términos con la búsqueda avanzada.',
      preciseSearchTitle: 'Crear una búsqueda más precisa',
      resultsFor: 'Resultados de búsqueda para {query}',
      results: 'Resultados',
      scopeSubjectTheme: 'Tema/materia',
      scopeTitle: 'Título',
      searchOnlyIn: 'Buscar solo en',
      searching: 'Buscando…',
      searchingPlaces: 'Buscando lugares...',
      searchingSuggestions: 'Buscando sugerencias...',
      seeAllResultsFor: 'Ver todos los resultados para {query}',
      showingResults: 'Mostrando resultados',
      suggestions: 'Sugerencias',
      of: 'de',
      viaOpenStreetMap: 'Mediante OpenStreetMap',
    },
    security: {
      checkingSession: 'Comprobando sesión...',
      finishingCheck: 'Finalizando comprobación...',
      turnstileDescription:
        'Esta comprobación rápida ayuda a evitar que el tráfico automatizado sobrecargue el Geoportal.',
      turnstileError: 'La verificación no se completó. Inténtelo de nuevo.',
      turnstileTitle: 'Verificando la sesión del navegador',
    },
    seo: {
      defaultDescription:
        'Descubra y acceda a recursos geoespaciales mediante la BTAA Geospatial API.',
      defaultSiteTitle: 'Geoportal OpenGeoMetadata',
    },
  },
} as const;

function formatMessage(
  template: string,
  vars?: Record<string, string | number>
) {
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

function getNestedMessage(
  localeMessages: Record<string, MessageValue>,
  key: string
): string | undefined {
  const parts = key.split('.');
  let current: MessageValue | undefined = localeMessages;

  for (const part of parts) {
    if (!current || typeof current === 'string' || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}

export function translate(
  locale: string,
  fallbackLocale: string,
  key: string,
  vars?: Record<string, string | number>
): string {
  const primaryLocaleMessages =
    (messages as Record<string, Record<string, MessageValue>>)[locale] || {};
  const fallbackLocaleMessages =
    (messages as Record<string, Record<string, MessageValue>>)[
      fallbackLocale
    ] || {};
  const primary = getNestedMessage(primaryLocaleMessages, key);
  const fallback = getNestedMessage(fallbackLocaleMessages, key);
  return formatMessage(primary || fallback || key, vars);
}

export function resolveLocalizedText(
  value: string | Record<string, string> | undefined,
  locale: string,
  fallbackLocale: string
): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value[locale] || value[fallbackLocale] || Object.values(value)[0];
}
