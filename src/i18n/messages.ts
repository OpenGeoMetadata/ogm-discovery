export type MessageValue = string | Record<string, MessageValue>;

export const messages = {
  en: {
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
