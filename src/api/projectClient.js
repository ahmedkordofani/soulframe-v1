// V6.0.4 explicit local API operations with optimistic concurrency tokens.
// Nothing here automatically uploads browser projects or audio.

async function requestProjectApi(path, { fetcher = globalThis.fetch, method = 'GET', body, signal, expectedRevision } = {}) {
  if (expectedRevision !== undefined && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)) {
    throw new TypeError('Expected a positive project revision');
  }
  const response = await fetcher(path, {
    method, signal, cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(expectedRevision === undefined ? {} : { 'If-Match': `"${expectedRevision}"` }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const error = new Error(result.error || `Local project API error (${response.status})`);
    error.status = response.status;
    throw error;
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
