# Oren Health: integration notes (fictional)

Oren Health is a fictional hospital network. Your product sits between two systems: Oren's EMR, where doctors work, and a speech-to-text API. Both are simplified. You may mock either one.

## 1. Oren EMR (the doctor's system)

- Doctors work inside the EMR. An encounter (visit) is open while the patient is in the room.
- Third-party tools can be embedded in the encounter screen as a web component. The EMR passes the component the `encounter_id` and a short-lived access token.
- The EMR runs on Oren's internal network. Outgoing traffic is allowed only to approved domains.

**Read the visit context**

`GET /encounters/{encounter_id}` returns the patient, active problems, medications, allergies and recent results. See `encounters.json`.

**Write a note**

`POST /encounters/{encounter_id}/notes`

```json
{
  "author_id": "DR-1107",
  "status": "draft",
  "sections": [
    {"code": "REASON", "text": "..."},
    {"code": "PLAN", "text": "..."}
  ]
}
```

- Section codes: `REASON`, `HISTORY`, `EXAM`, `ASSESSMENT`, `PLAN`, `MEDICATIONS`, `FOLLOW_UP`.
- `status` is `draft` or `signed`. Only the encounter's physician can sign.
- Plain text only, up to 2,000 characters per section.
- A signed note cannot be edited. Corrections are added as an addendum.

**Errors:** `401` token expired, `409` encounter already closed, `422` validation error, `503` EMR unavailable.

## 2. Speech-to-text API

- `POST /jobs` with an audio file (wav or mp3), `language: "he-IL"` and an optional `reference` string, which is returned as-is. Returns `{ "job_id": "...", "status": "queued" }`.
- `GET /jobs/{job_id}` returns `status` (`queued`, `processing`, `done`, `failed`) and, when done, the transcript.
- Speakers are separated automatically and labeled `SPEAKER_00`, `SPEAKER_01` and so on. They are not named.

For this assignment, treat each item in `transcripts.json` as the response you would get from `GET /jobs/{job_id}`. Its `reference` is the encounter it was recorded in.
