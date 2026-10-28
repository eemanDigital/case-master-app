# Hearing Logic & Timeline Redesign - Handoff Notes

## Summary
Split first-time filing vs editing after grace; added admin/super-admin/privileged override with justification + audit trail; fixed upcoming hearings (include today, fallback to hearing.date, deduplicate); updated backend model/controllers and frontend permissions/UI.

## Done
### Backend
- `backend/models/litigationDetailModel.js`: added `dateToBeCommunicated`, `lateReport`, `lateReason`, `reportFiledAt`, `reportFiledBy`, `editReason`, `auditTrail[]`
- `backend/controllers/litigationController.js`:
  - `getUpcomingHearings`: include today, fallback to `hearing.date`, deduplicate by matter, fixed week/month stats
  - `getMatterHearings`, `getLitigationDetails`: populate `reportFiledBy`, `auditTrail.by`
  - `updateHearing`: hour-based 48h grace, distinguish first-time vs edit, privileged late filing/edit with justification, audit logging, adjourned allows TBC, next date validation by day
  - `downloadUpcomingHearingsPdf`: same fallback/dedup

### Frontend
- `frontend/src/components/litigation/HearingTimeline.jsx`: privilege detection, first-time vs edit flags, allow privileged in locked phase with justification fields, validation, updated banners

## To Do
1. Redesign `frontend/src/components/litigation/HearingTimelineItems.jsx` for better UX (clean cards, status, late badge, next hearing prominent, mobile)
2. Display late/audit info (lateReport, lateReason, reportFiledBy, auditTrail)
3. Add populations in other hearing-returning endpoints if missing
4. Test flows

## Key Files
Backend: `backend/models/litigationDetailModel.js`, `backend/controllers/litigationController.js`  
Frontend: `frontend/src/components/litigation/HearingTimeline.jsx`, `frontend/src/components/litigation/HearingTimelineItems.jsx`
