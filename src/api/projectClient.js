// Explicit API operations for a future V6.0.3 user-triggered sync UI.
// Nothing here automatically uploads browser projects or audio.

async function requestProjectApi(path, { fetcher = globalThis.fetch, method = 'GET', body, signal } = {}) {
  const response = await fetcher(path, {
    method, signal, cache: 'no-store',
    headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Local project API error (${response.status})`);
  }
  const result = await response.json();
  if (result?.ok !== true) throw new Error('Invalid local project API response');
  return result;
}

export const listApiProjects = (options = {}) => requestProjectApi('/api/projects', options);
export const createApiProject = (project, options = {}) => requestProjectApi('/api/projects', { ...options, method: 'POST', body: project });
export const readApiProject = (id, options = {}) => requestProjectApi(`/api/projects/${encodeURIComponent(id)}`, options);
export const updateApiProject = (id, project, options = {}) => requestProjectApi(`/api/projects/${encodeURIComponent(id)}`, { ...options, method: 'PUT', body: project });
export const deleteApiProject = (id, options = {}) => requestProjectApi(`/api/projects/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
