import { debug, error } from '../utils/logger';

// Available languages
export type AvailableLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

// Interface for translations
export interface Translations {
  [key: string]: string | Translations;
}

// Default language
const DEFAULT_LANGUAGE: AvailableLanguage = 'en';

// Language storage key
const LANGUAGE_STORAGE_KEY = 'flight-finder-language';

// Currently loaded translations
let currentTranslations: Translations = {};

// Currently active language
let currentLanguage: AvailableLanguage = DEFAULT_LANGUAGE;

/**
 * Initialize the i18n system
 */
export async function initializeI18n(): Promise<void> {
  try {
    // Try to load saved language preference
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AvailableLanguage;
    
    // Set current language
    currentLanguage = savedLanguage || getPreferredBrowserLanguage() || DEFAULT_LANGUAGE;
    
    // Load translations for current language
    await loadTranslations(currentLanguage);
    
    debug(`Initialized i18n with language: ${currentLanguage}`);
  } catch (err) {
    error('Failed to initialize i18n:', err);
    
    // Fallback to English
    currentLanguage = 'en';
    await loadTranslations('en');
  }
}

/**
 * Change the active language
 */
export async function changeLanguage(language: AvailableLanguage): Promise<void> {
  try {
    // Load translations for new language
    await loadTranslations(language);
    
    // Update current language
    currentLanguage = language;
    
    // Save language preference
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    // Trigger a custom event for components to update
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
    
    debug(`Changed language to: ${language}`);
  } catch (err) {
    error(`Failed to change language to ${language}:`, err);
    throw new Error(`Failed to change language to ${language}`);
  }
}

/**
 * Get the currently active language
 */
export function getCurrentLanguage(): AvailableLanguage {
  return currentLanguage;
}

/**
 * Get all available languages with their display names
 */
export function getAvailableLanguages(): Array<{ code: AvailableLanguage; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' }
  ];
}

/**
 * Translate a key to the current language
 */
export function t(key: string, variables: Record<string, string> = {}): string {
  try {
    // Split the key by dots to access nested translations
    const parts = key.split('.');
    
    // Navigate through the translations object
    let translation: any = currentTranslations;
    for (const part of parts) {
      translation = translation[part];
      
      // If translation is undefined, return the key
      if (translation === undefined) {
        debug(`Missing translation for key: ${key}`);
        return key;
      }
    }
    
    // If translation is not a string, return the key
    if (typeof translation !== 'string') {
      debug(`Translation for key ${key} is not a string`);
      return key;
    }
    
    // Replace variables in the translation
    let result = translation;
    for (const [name, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
    }
    
    return result;
  } catch (err) {
    error(`Error translating key ${key}:`, err);
    return key;
  }
}

/**
 * Get the preferred browser language
 */
function getPreferredBrowserLanguage(): AvailableLanguage | null {
  try {
    const browserLanguages = navigator.languages || [navigator.language];
    
    // Check each browser language against our available languages
    for (const browserLang of browserLanguages) {
      // Get the first part of the language code (e.g., 'en' from 'en-US')
      const langCode = browserLang.split('-')[0] as AvailableLanguage;
      
      // Check if this language is available
      if (getAvailableLanguages().some(lang => lang.code === langCode)) {
        return langCode;
      }
    }
    
    return null;
  } catch (err) {
    error('Error getting browser language:', err);
    return null;
  }
}

/**
 * Load translations for a language
 */
async function loadTranslations(language: AvailableLanguage): Promise<void> {
  try {
    // In a real app, this would load translations from a server or static file
    // For now, we'll use mock data
    
    // Simulate an API call
    const translations = await mockTranslationLoader(language);
    
    // Update current translations
    currentTranslations = translations;
    
    debug(`Loaded translations for language: ${language}`);
  } catch (err) {
    error(`Failed to load translations for ${language}:`, err);
    throw new Error(`Failed to load translations for ${language}`);
  }
}

/**
 * Mock translation loader (simulates loading from an API or file)
 */
async function mockTranslationLoader(language: AvailableLanguage): Promise<Translations> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock translations
  const translations: Record<AvailableLanguage, Translations> = {
    en: {
      common: {
        search: 'Search',
        book: 'Book',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        edit: 'Edit',
        delete: 'Delete',
        loading: 'Loading...',
        noResults: 'No results found',
        error: 'An error occurred',
        retry: 'Retry'
      },
      flights: {
        search: 'Search Flights',
        findFlight: 'Find me a flight',
        from: 'From',
        to: 'To',
        departureDate: 'Departure Date',
        returnDate: 'Return Date',
        passengers: 'Passengers',
        cabin: 'Cabin Class',
        flightResults: 'Flight Results',
        stops: {
          nonstop: 'Nonstop',
          oneStop: '1 Stop',
          multipleStops: '{count} Stops'
        },
        sort: {
          price: 'Price',
          duration: 'Duration',
          departureTime: 'Departure Time',
          arrivalTime: 'Arrival Time'
        },
        priceAlert: {
          create: 'Create Price Alert',
          notify: 'Notify me when the price drops',
          success: 'Price alert created successfully'
        }
      },
      filters: {
        title: 'Filters',
        price: 'Price',
        stops: 'Stops',
        airlines: 'Airlines',
        times: {
          title: 'Times',
          departure: 'Departure Time',
          arrival: 'Arrival Time'
        },
        reset: 'Reset Filters',
        apply: 'Apply Filters'
      }
    },
    es: {
      common: {
        search: 'Buscar',
        book: 'Reservar',
        save: 'Guardar',
        cancel: 'Cancelar',
        close: 'Cerrar',
        edit: 'Editar',
        delete: 'Eliminar',
        loading: 'Cargando...',
        noResults: 'No se encontraron resultados',
        error: 'Se produjo un error',
        retry: 'Reintentar'
      },
      flights: {
        search: 'Buscar Vuelos',
        findFlight: 'Encuentra un vuelo',
        from: 'Desde',
        to: 'Hasta',
        departureDate: 'Fecha de Salida',
        returnDate: 'Fecha de Regreso',
        passengers: 'Pasajeros',
        cabin: 'Clase de Cabina',
        flightResults: 'Resultados de Vuelos',
        stops: {
          nonstop: 'Sin escalas',
          oneStop: '1 Escala',
          multipleStops: '{count} Escalas'
        },
        sort: {
          price: 'Precio',
          duration: 'Duración',
          departureTime: 'Hora de Salida',
          arrivalTime: 'Hora de Llegada'
        },
        priceAlert: {
          create: 'Crear Alerta de Precio',
          notify: 'Notificarme cuando baje el precio',
          success: 'Alerta de precio creada exitosamente'
        }
      },
      filters: {
        title: 'Filtros',
        price: 'Precio',
        stops: 'Escalas',
        airlines: 'Aerolíneas',
        times: {
          title: 'Horarios',
          departure: 'Hora de Salida',
          arrival: 'Hora de Llegada'
        },
        reset: 'Restablecer Filtros',
        apply: 'Aplicar Filtros'
      }
    },
    fr: {
      common: {
        search: 'Rechercher',
        book: 'Réserver',
        save: 'Enregistrer',
        cancel: 'Annuler',
        close: 'Fermer',
        edit: 'Modifier',
        delete: 'Supprimer',
        loading: 'Chargement...',
        noResults: 'Aucun résultat trouvé',
        error: 'Une erreur est survenue',
        retry: 'Réessayer'
      },
      flights: {
        search: 'Rechercher des Vols',
        findFlight: 'Trouvez-moi un vol',
        from: 'De',
        to: 'À',
        departureDate: 'Date de Départ',
        returnDate: 'Date de Retour',
        passengers: 'Passagers',
        cabin: 'Classe de Cabine',
        flightResults: 'Résultats de Vols',
        stops: {
          nonstop: 'Sans escale',
          oneStop: '1 Escale',
          multipleStops: '{count} Escales'
        },
        sort: {
          price: 'Prix',
          duration: 'Durée',
          departureTime: 'Heure de Départ',
          arrivalTime: 'Heure d\'Arrivée'
        },
        priceAlert: {
          create: 'Créer une Alerte de Prix',
          notify: 'M\'avertir quand le prix baisse',
          success: 'Alerte de prix créée avec succès'
        }
      },
      filters: {
        title: 'Filtres',
        price: 'Prix',
        stops: 'Escales',
        airlines: 'Compagnies Aériennes',
        times: {
          title: 'Horaires',
          departure: 'Heure de Départ',
          arrival: 'Heure d\'Arrivée'
        },
        reset: 'Réinitialiser les Filtres',
        apply: 'Appliquer les Filtres'
      }
    },
    // Add German translations
    de: {
      common: {
        search: 'Suchen',
        book: 'Buchen',
        save: 'Speichern',
        cancel: 'Abbrechen',
        close: 'Schließen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        loading: 'Wird geladen...',
        noResults: 'Keine Ergebnisse gefunden',
        error: 'Ein Fehler ist aufgetreten',
        retry: 'Wiederholen'
      },
      flights: {
        search: 'Flüge Suchen',
        findFlight: 'Finde einen Flug für mich',
        from: 'Von',
        to: 'Nach',
        departureDate: 'Abflugdatum',
        returnDate: 'Rückkehrdatum',
        passengers: 'Passagiere',
        cabin: 'Kabinenklasse',
        flightResults: 'Flugergebnisse',
        stops: {
          nonstop: 'Nonstop',
          oneStop: '1 Zwischenstopp',
          multipleStops: '{count} Zwischenstopps'
        },
        sort: {
          price: 'Preis',
          duration: 'Dauer',
          departureTime: 'Abflugzeit',
          arrivalTime: 'Ankunftszeit'
        },
        priceAlert: {
          create: 'Preisalarm Erstellen',
          notify: 'Benachrichtigen wenn der Preis sinkt',
          success: 'Preisalarm erfolgreich erstellt'
        }
      },
      filters: {
        title: 'Filter',
        price: 'Preis',
        stops: 'Stopps',
        airlines: 'Fluggesellschaften',
        times: {
          title: 'Zeiten',
          departure: 'Abflugzeit',
          arrival: 'Ankunftszeit'
        },
        reset: 'Filter Zurücksetzen',
        apply: 'Filter Anwenden'
      }
    },
    // Add Chinese translations
    zh: {
      common: {
        search: '搜索',
        book: '预订',
        save: '保存',
        cancel: '取消',
        close: '关闭',
        edit: '编辑',
        delete: '删除',
        loading: '加载中...',
        noResults: '未找到结果',
        error: '发生错误',
        retry: '重试'
      },
      flights: {
        search: '搜索航班',
        findFlight: '为我找航班',
        from: '出发地',
        to: '目的地',
        departureDate: '出发日期',
        returnDate: '返回日期',
        passengers: '乘客',
        cabin: '舱位等级',
        flightResults: '航班结果',
        stops: {
          nonstop: '直飞',
          oneStop: '1个中转',
          multipleStops: '{count}个中转'
        },
        sort: {
          price: '价格',
          duration: '时长',
          departureTime: '出发时间',
          arrivalTime: '到达时间'
        },
        priceAlert: {
          create: '创建价格提醒',
          notify: '价格下降时通知我',
          success: '价格提醒创建成功'
        }
      },
      filters: {
        title: '筛选',
        price: '价格',
        stops: '中转',
        airlines: '航空公司',
        times: {
          title: '时间',
          departure: '出发时间',
          arrival: '到达时间'
        },
        reset: '重置筛选',
        apply: '应用筛选'
      }
    },
    // Add Japanese translations
    ja: {
      common: {
        search: '検索',
        book: '予約',
        save: '保存',
        cancel: 'キャンセル',
        close: '閉じる',
        edit: '編集',
        delete: '削除',
        loading: '読み込み中...',
        noResults: '結果が見つかりません',
        error: 'エラーが発生しました',
        retry: '再試行'
      },
      flights: {
        search: 'フライト検索',
        findFlight: 'フライトを探す',
        from: '出発地',
        to: '目的地',
        departureDate: '出発日',
        returnDate: '帰国日',
        passengers: '乗客',
        cabin: '客室クラス',
        flightResults: 'フライト結果',
        stops: {
          nonstop: '直行便',
          oneStop: '1回乗り継ぎ',
          multipleStops: '{count}回乗り継ぎ'
        },
        sort: {
          price: '価格',
          duration: '所要時間',
          departureTime: '出発時間',
          arrivalTime: '到着時間'
        },
        priceAlert: {
          create: '価格アラートを作成',
          notify: '価格が下がったら通知',
          success: '価格アラートが正常に作成されました'
        }
      },
      filters: {
        title: 'フィルター',
        price: '価格',
        stops: '乗り継ぎ',
        airlines: '航空会社',
        times: {
          title: '時間',
          departure: '出発時間',
          arrival: '到着時間'
        },
        reset: 'フィルターをリセット',
        apply: 'フィルターを適用'
      }
    }
  };
  
  return translations[language];
}