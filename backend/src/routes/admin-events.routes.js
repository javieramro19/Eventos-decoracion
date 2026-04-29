const router = require('express').Router();
const controller = require('../controllers/events.controller');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/auth.middleware');
const { uploadGalleryImages } = require('../middleware/upload.middleware');
const { createEventoValidators, updateEventoValidators } = require('../validators/events.validators');

router.use(authMiddleware);
router.use(adminOnlyMiddleware);

router.get('/stats/summary', controller.getStatsSummary);
router.get('/contacts', controller.getAdminContacts);
router.get('/', controller.getAdminEvents);
router.get('/:id', controller.getAdminEventById);
router.get('/:id/gallery', controller.getAdminEventGallery);
router.get('/:id/sections', controller.getAdminEventSections);
router.get('/:id/contacts', controller.getAdminEventContacts);
router.post('/', createEventoValidators, controller.createAdminEvent);
router.post('/:id/gallery/upload', uploadGalleryImages.array('images', 12), controller.uploadAdminEventGalleryImages);
router.put('/:id/gallery/reorder', controller.reorderAdminEventGallery);
router.put('/:id/gallery/:imageId', controller.updateAdminEventGalleryImage);
router.put('/:id/sections/reorder', controller.reorderAdminEventSections);
router.put('/:id/sections/:sectionId', controller.updateAdminEventSection);
router.delete('/:id/gallery/:imageId', controller.removeAdminEventGalleryImage);
router.put('/:id/publish', controller.publishAdminEvent);
router.put('/:id/unpublish', controller.unpublishAdminEvent);
router.put('/:id/approve', controller.approveAdminEvent);
router.put('/:id/reject', controller.rejectAdminEvent);
router.put('/:id/status', controller.updateAdminEventStatus);
router.put('/contacts/:contactId/status', controller.updateAdminContactStatus);
router.put('/:id', updateEventoValidators, controller.updateAdminEvent);
router.delete('/:id', controller.removeAdminEvent);

module.exports = router;
