const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch {
    const live = 'https://hands-on-labs.vercel.app/?demo=wc1986-hand-of-god'
    throw new Error(
      window.location.hostname === 'localhost'
        ? 'Cannot reach the API. Run refmind\\scripts\\start-demo.cmd — or use the live demo.'
        : `Connection problem. Try refreshing, or open the live demo: ${live}`,
    )
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  getIncidents: () => request('/incidents'),
  getIncident: (id) => request(`/incidents/${id}`),
  submitVote: (id, userVote) =>
    request(`/incidents/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ user_vote: userVote }),
    }),
  analyze: (id, userVote) =>
    request(`/incidents/${id}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ user_vote: userVote }),
    }),
  mindChange: (id, body) =>
    request(`/incidents/${id}/mind-change`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  askRef: (incidentId, question, analysisContext) =>
    request('/ask-ref', {
      method: 'POST',
      body: JSON.stringify({
        incident_id: incidentId,
        question,
        analysis_context: analysisContext,
      }),
    }),
  analyzeControversy: ({ facts, side_a, side_b }) =>
    request('/controversy/analyze', {
      method: 'POST',
      body: JSON.stringify({ facts, side_a, side_b }),
    }),
  askGemini: (incidentId, question, analysisContext) =>
    request('/gemini/ask', {
      method: 'POST',
      body: JSON.stringify({
        incident_id: incidentId,
        question,
        analysis_context: analysisContext,
      }),
    }),
  translate: (text, targetLang) =>
    request('/gemini/translate', {
      method: 'POST',
      body: JSON.stringify({ text, target_lang: targetLang }),
    }),
  geminiVision: (incidentId, imageUrl) =>
    request('/gemini/vision', {
      method: 'POST',
      body: JSON.stringify({ incident_id: incidentId, image_url: imageUrl }),
    }),
  health: () => request('/health'),
}
