class UserDTO {
    user_id: number;
    name: string;
    email: string;

    constructor(model: any) {
        this.user_id = model.user_id;
        this.name = model.name;
        this.email = model.email;
    }
}

export default UserDTO;