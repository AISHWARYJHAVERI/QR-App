import { Button } from 'primereact/button';
import axios from 'axios';

const DeleteAdmin = ({ rowData, onAdminDeleted, showError, showSuccess }) => {
    const confirmDeleteAdmin = async () => {
        if (window.confirm(`Are you sure you want to delete ${rowData.name}?`)) {
            try {
                await axios.delete(`/admins/${rowData.id}`);
                showSuccess("Admin Deleted Successfully");
                onAdminDeleted(rowData.id);
            } catch (error) {
                showError("Error deleting admin");
            }
        }
    };

    return (
        <Button label="Delete" icon="pi pi-trash" outlined severity="danger" onClick={confirmDeleteAdmin} title="Delete Admin" />
    );
};

export default DeleteAdmin;
