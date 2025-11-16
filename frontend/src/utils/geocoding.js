/**
 * Get user's current location using browser Geolocation API
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Reverse geocode coordinates to address using OpenStreetMap Nominatim
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap Nominatim (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
      {
        headers: {
          'User-Agent': 'PWA-Store-Ecommerce' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    return parseAddress(data);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

/**
 * Parse OpenStreetMap address data into structured format
 */
const parseAddress = (data) => {
  const address = data.address || {};
  
  // Extract address components
  const streetNumber = address.house_number || '';
  const streetName = address.road || address.street || '';
  const street = [streetNumber, streetName].filter(Boolean).join(' ').trim();
  
  const city = address.city || 
               address.town || 
               address.village || 
               address.municipality || 
               '';
  
  const state = address.state || 
                address.region || 
                address.province || 
                '';
  
  const postalCode = address.postcode || '';
  
  const country = address.country || '';
  const countryCode = address.country_code?.toUpperCase() || '';
  
  // Build formatted address string
  const addressParts = [
    street,
    city,
    state,
    postalCode,
    country
  ].filter(Boolean);
  
  const formattedAddress = addressParts.join(', ');
  
  return {
    street: street || 'Address not available',
    city: city || 'City not available',
    state: state || '',
    postalCode: postalCode || '',
    country: country || 'Country not available',
    countryCode: countryCode,
    formatted: formattedAddress || data.display_name || 'Address not available',
    raw: data
  };
};

/**
 * Get user's address automatically
 */
export const getCurrentAddress = async () => {
  try {
    // Get location
    const location = await getCurrentLocation();
    
    // Reverse geocode
    const address = await reverseGeocode(location.latitude, location.longitude);
    
    return {
      ...address,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    };
  } catch (error) {
    console.error('Error getting current address:', error);
    throw error;
  }
};

