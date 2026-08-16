export const getImageUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // Full remote URLs or data/blob URIs
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('data:') || 
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Normalize Windows backslashes and strip duplicate leading slashes
  const cleanPath = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');

  // Handle absolute or relative paths with uploads/
  const uploadIndex = cleanPath.indexOf('uploads/');
  if (uploadIndex !== -1) {
    return '/' + cleanPath.substring(uploadIndex);
  }

  // Handle shared_uploads/ from Hostinger deployments
  const sharedIndex = cleanPath.indexOf('shared_uploads/');
  if (sharedIndex !== -1) {
    return '/uploads/' + cleanPath.substring(sharedIndex + 'shared_uploads/'.length);
  }

  // Handle raw multer timestamp filenames (e.g. 1740000000000-123456789.jpg)
  if (/^\d{10,}/.test(cleanPath)) {
    return `/uploads/${cleanPath}`;
  }

  // Static assets from public folder (e.g. internship-photos/..., field-visit-media/..., hero_medical.png, etc.)
  return `/${cleanPath}`;
};

