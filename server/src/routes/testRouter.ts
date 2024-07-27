import { Router } from "express";
import { testController } from "./../controllers/testController";
import { authMiddleware } from "./../utils/middlewares/authMiddleware";
import { createTestValidation } from "../validations/testValidation";
import { validationMiddleware } from "../utils/middlewares/validationMiddleware";


const router = Router();

router.get('/test/:id', testController.getTest);
router.post('/test', createTestValidation, validationMiddleware, authMiddleware, testController.createTest);
router.put('/test/:id', authMiddleware, testController.updateTest);
router.delete('/test/:id', authMiddleware, testController.deleteTest);
router.get('/tests', testController.getTen);
router.get('/tests/:id', authMiddleware, testController.getUserTests);
router.post('/tests/search', testController.search);
router.get('/testsPagination', testController.pagination);
router.post('/submitTest', authMiddleware, testController.submit);

export const testRouter = router;