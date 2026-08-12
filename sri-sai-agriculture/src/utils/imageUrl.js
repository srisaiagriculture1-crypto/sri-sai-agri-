export const getImageUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');
  if (cleanPath.startsWith('uploads/')) {
    return `/${cleanPath}`;
  }
  if (cleanPath.includes('/')) {
    return `/${cleanPath}`;
  }
  if (/^\d{10,}/.test(cleanPath)) {
    return `/uploads/${cleanPath}`;
  }
  return `/${cleanPath}`;
};
