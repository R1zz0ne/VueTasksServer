import express, {Router} from "express";
import userController from "../controllers/user-controller";
import authMiddleware from "../middlewares/auth-middleware";
import projectController from "../controllers/project-controller";
import taskController from "../controllers/task-controller";

const router: Router = express.Router();

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.get('/refresh', userController.refresh)
router.get('/users', authMiddleware, userController.getUsers)
router.post('/project', authMiddleware, projectController.createProject)
router.post('/projectUpdate', authMiddleware, projectController.updateProject)
router.get('/projectList', authMiddleware, projectController.getProjectList)
router.get('/project', authMiddleware, projectController.getProject)
router.post('/task', authMiddleware, taskController.createTask)
router.post('/taskUpdate', authMiddleware, taskController.updateTask)
router.get('/taskInfo', authMiddleware, taskController.getInfoForTask)
router.post('/taskStatusUpdate', authMiddleware, taskController.updateStatusTask)
router.get('/taskMyList', authMiddleware, taskController.getUserTasks)
router.get('/taskCloseMyList', authMiddleware, taskController.getCloseUserTasks)

export default router;