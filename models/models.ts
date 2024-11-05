export interface IProject {
    projectId: number,
    name: string,
    description: string,
    owner: number,
    editor: number | null
}

export interface IOwner {
    userId: number,
    name: string,
    email: string
}

export interface IProjectWithOwner {
    projectId: number,
    name: string,
    description: string,
    ownId: number,
    ownName: string,
    ownEmail: string,
    editId: number,
    editName: string
}

export interface ITask {
    taskId: number,
    name: string,
    description: string,
    priority: string,
    completionDate: string, //'YYYY-MM-DD'
    projectId: number,
    member: number,
    status: string,
    editor: number | null
}

export interface ITasksWithMemberAndProject extends Omit<ITask, 'projectId' | 'member' | 'editor'> {
    proId: number,
    proName: string,
    memId: number,
    memName: string,
    memEmail: string,
    editId: number,
    editName: string
}

export interface ITasksWithMember extends Omit<ITask, 'member' | 'projectId' | 'description'> {
    memId: number,
    memName: string,
    memEmail: string
}

export interface ITaskStatusIn extends Omit<ITaskStatusOut, 'projectId'> {
}

export interface ITaskStatusOut extends Pick<ITask, 'taskId' | 'status' | 'projectId'> {
}

export interface INotification {
    notificationId: number,
    taskId: number,
    scheduledTime: any, //Date
    status: string, //scheduled (Запланировано), pending (В ожидании), completed (Завершено), failed (Ошибка)
    type: string
}

export enum taskStatusMap {
    assigned = 'Назначено',
    inProgress = 'В работе',
    completed = 'Завершено',
}

export interface ICurrentData extends Pick<INotification, 'taskId' | 'scheduledTime' | 'status' | 'type'> {
    email: string,
    taskStatus: 'assigned' | 'inProgress' | 'completed'
}

export interface ICreateProjectData {
    name: string,
    description: string,
    owner: number
}

export interface IUpdateProjectData extends ICreateProjectData {
    projectId: number
}

export interface IRegistrationData {
    name: string,
    email: string,
    password: string,
}

export interface IRefreshTokenData {
    refreshToken: string,
}

export interface IGetUsersData {
    query: string
}

export interface IUpdateEditor extends Pick<ITask, 'taskId'> {
    editor: Pick<IOwner, 'userId' | 'name'> | null
}