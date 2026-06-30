import { Button } from 'primereact/button';
import axios from 'axios';

const DeleteUser = ({ rowData, onUserDeleted, showError, showSuccess }) => {
    const confirmDeleteUser = async () => {
        if (window.confirm(`Are you sure you want to delete ${rowData.name}?`)) {
            try {
                await axios.delete(`http://localhost:5001/users/${rowData.id}`);
                showSuccess("User Deleted Successfully");
                onUserDeleted(rowData.id);
            } catch (error) {
                showError("Error deleting user");
            }
        }
    };

    return (
        <Button label="Delete" icon="pi pi-trash" outlined severity="danger" onClick={confirmDeleteUser} title="Delete User" />
    );
};

export default DeleteUser;
