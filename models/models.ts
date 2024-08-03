export interface IProject {
    project_id: number,
    name: string,
    description: string,
    owner: number
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
    ownemail: string
}

export interface ITask {
    task_id: number,
    name: string,
    description: string,
    priority: string,
    complation_date: string, //'YYYY-MM-DD'
    project_id: number,
    member: number,
    status: string
}

export interface ITasksWithMemberAndProject extends Omit<ITask, 'project_id' | 'member'> {
    proid: number,
    proname: string,
    memid: number,
    memname: string,
    mememail: string
}

export interface ITasksWithMember extends Omit<ITask, 'member' | 'project_id' | 'description'> {
    memid: number,
    memname: string,
    mememail: string
}

export interface ITaskStatus extends Pick<ITask, 'task_id' | 'status'> {

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