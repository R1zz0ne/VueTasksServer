export interface IProject {
    project_id: number,
    name: string,
    description: string,
    owner: number,
    editor: number | null
}

export interface IOwner {
    user_id: number,
    name: string,
    email: string
}

export interface IProjectWithOwner {
    project_id: number,
    name: string,
    description: string,
    ownid: number,
    ownname: string,
    ownemail: string,
    editid: number,
    editname: string
}

export interface ITask {
    task_id: number,
    name: string,
    description: string,
    priority: string,
    complation_date: string, //'YYYY-MM-DD'
    project_id: number,
    member: number,
    status: string,
    editor: number | null
}

export interface ITasksWithMemberAndProject extends Omit<ITask, 'project_id' | 'member' | 'editor'> {
    proid: number,
    proname: string,
    memid: number,
    memname: string,
    mememail: string,
    editid: number,
    editname: string
}

export interface ITasksWithMember extends Omit<ITask, 'member' | 'project_id' | 'description'> {
    memid: number,
    memname: string,
    mememail: string
}

export interface ITaskStatusIn extends Omit<ITaskStatusOut, 'project_id'> {
}

export interface ITaskStatusOut extends Pick<ITask, 'task_id' | 'status' | 'project_id'> {
}

export interface INotification {
    notification_id: number,
    task_id: number,
    scheduled_time: any, //Date
    status: string, //scheduled (Запланировано), pending (В ожидании), completed (Завершено), failed (Ошибка)
    type: string
}

export enum taskStatusMap {
    assigned = 'Назначено',
    in_progress = 'В работе',
    completed = 'Завершено',
}

export interface ICurrentData extends Pick<INotification, 'task_id' | 'scheduled_time' | 'status' | 'type'> {
    email: string,
    taskstatus: 'assigned' | 'in_progress' | 'completed'
}

export interface ICreateProjectData {
    name: string,
    description: string,
    owner: number
}

export interface IUpdateProjectData extends ICreateProjectData {
    project_id: number
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

export interface IUpdateEditor extends Pick<ITask, 'task_id'> {
    editor: Pick<IOwner, 'user_id' | 'name'> | null
}