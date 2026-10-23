import api from '../api/axios';

export async function savePendingThemeMedia(themeId, module, recordId, images = {}) {
  if (!themeId || !recordId) return;
  for (const [slot, image] of Object.entries(images)) {
    await api.put(`/website/themes/${themeId}/media`, {
      module,
      recordId,
      slot,
      key: image.key,
    });
  }
}
