# Facial Recognition (Optional – Local Mac API or Skip)

## US-5.1 Detect faces locally
**As a** user  
**I want** faces in photos to be detected using a simple local Mac API  
**So that** I can group or search by person without sending data to the cloud.

- Use local framework (e.g. Vision on macOS).
- Store face regions or face IDs in metadata; no external service.

## US-5.2 Name a person and match across photos
**As a** user  
**I want** to label a face as “Person X” and see that label on other photos where they appear  
**So that** I can find all photos of that person.

- “Name this person” on one photo; app suggests same person in others.
- Optional: confirm/reject suggestions.

## US-5.3 Skip facial recognition
**As a** user  
**I want** to disable or skip facial recognition entirely  
**So that** the app works without face features and with minimal permissions.

- Setting: “Facial recognition: Off”. No face indexing when off.
