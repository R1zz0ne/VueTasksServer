class UserDTO {
    userId: number;
    name: string;
    email: string;

    constructor(model: any) {
        this.userId = model.userId;
        this.name = model.name;
        this.email = model.email;
    }
}

export default UserDTO;