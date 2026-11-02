# Oren Scribe

A home assignment for Sumit: a recorded clinical visit becomes a note the physician
reviews, signs, and sends to the EMR.

The project has three parts:

| Part | Where |
|---|---|
| Fake Oren EMR (schedule, patient screen, API per spec) | `app/page.tsx`, `app/patient/`, `app/api/emr/` |
| Oren Scribe (recording → AI summary → review → sign) | stages 2–5 |
| Fake speech-to-text service | stage 2 |

Assignment files: `data/encounters.json`, `data/transcripts.json`, `docs/integration_spec.md`, `design/wireframes.pdf`.

## Running locally

```bash
cd oren-scribe
npm install
npm run dev
# open http://localhost:3000
```

## Fake EMR API

All calls need the header `Authorization: Bearer oren-demo-token`.

| Endpoint | What it does |
|---|---|
| `GET /api/emr/encounters/{id}` | Returns the patient's chart. `401` without a token, `404` if the visit doesn't exist |
| `POST /api/emr/encounters/{id}/notes` | Writes a note. Validates against the spec (`422`), returns `409` if the visit is closed. A signed note closes the visit |
