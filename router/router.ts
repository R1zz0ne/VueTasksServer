import express, {Router} from "express";
import userController from "../controllers/user-controller";

const router: Router = express.Router();

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.get('/refresh', userController.refresh)

export default router;